"""Chinese voiceover for the transcript translations (tx_zh/*.tsv) → ../../ross-cameron/audio/<id>.mp3 + tts.json (paragraph offsets).

Each translated paragraph is synthesised separately with edge-tts (needs network) and cached in tts_cache/<hash>.mp3,
so editing one paragraph only re-synthesises that paragraph. Per item, the paragraphs are decoded and joined with a
short pause into one MP3; tts.json records where each paragraph starts in it (build.py embeds that in the page).
  python3 tts.py            synthesise what is missing, then rebuild changed audio files
  python3 tts.py ID [ID...] only these items"""
import asyncio, hashlib, json, os, subprocess, sys
sys.path.insert(0, '.')
from zh_tx import paras, zh

VOICE, RATE = 'zh-CN-YunxiNeural', '+10%'
SR, GAP = 24000, 0.35          # PCM sample rate, pause between paragraphs (s)
OUT, CACHE = '../../ross-cameron/audio', 'tts_cache'

def key(text): return hashlib.sha1(f'{VOICE}|{RATE}|{text}'.encode()).hexdigest()[:16]
def digest(Z):
    """Identifies an item's audio: changes when any paragraph text (or the voice) changes; build.py checks it."""
    return hashlib.sha1('|'.join(key(z) if z else '-' for z in Z).encode()).hexdigest()[:10]

async def synth(text, sem, left):
    import edge_tts
    f = f'{CACHE}/{key(text)}.mp3'
    if os.path.exists(f): return
    async with sem:
        for n in range(5):
            try:
                await edge_tts.Communicate(text, VOICE, rate=RATE).save(f + '.part')
                os.replace(f + '.part', f); break
            except Exception as e:
                print('retry', n + 1, type(e).__name__, e, flush=True); await asyncio.sleep(3 * (n + 1))
        else: raise SystemExit(f'edge-tts failed: {text[:40]}')
        left[0] -= 1
        if left[0] % 25 == 0: print(left[0], 'paragraphs left', flush=True)

def pcm(f):
    return subprocess.run(['ffmpeg', '-v', 'error', '-i', f, '-f', 's16le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True).stdout

def join(i, Z):
    """Decode the cached paragraphs into one PCM stream piped to the MP3 encoder; returns per-paragraph start seconds."""
    enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 's16le', '-ac', '1', '-ar', str(SR), '-i', '-',
                            '-c:a', 'libmp3lame', '-b:a', '32k', f'{OUT}/{i}.mp3'], stdin=subprocess.PIPE)
    gap, pos, starts = b'\0\0' * int(SR * GAP), 0, []
    for z in Z:
        if z is None: starts.append(None); continue
        a = pcm(f'{CACHE}/{key(z)}.mp3')
        starts.append(round(pos / 2 / SR, 2)); enc.stdin.write(a + gap); pos += len(a) + len(gap)
    enc.stdin.close(); assert enc.wait() == 0, i
    return starts, round(pos / 2 / SR, 1)

async def main(ids):
    items = [it for it in json.load(open('items.json', encoding='utf-8')) if not ids or it['id'] in ids]
    meta = json.load(open('tts.json')) if os.path.exists('tts.json') else {}
    Zs = {it['id']: zh(it['id'], paras(it)[1]) for it in items}
    todo = sorted({z for Z in Zs.values() for z in Z if z and not os.path.exists(f'{CACHE}/{key(z)}.mp3')})
    print(len(todo), 'paragraphs to synthesise,', sum(map(len, todo)), 'chars', flush=True)
    sem = asyncio.Semaphore(4)
    left = [len(todo)]
    await asyncio.gather(*(synth(z, sem, left) for z in todo))
    for i, Z in Zs.items():
        if not any(Z): meta.pop(i, None); continue
        h = digest(Z)
        if meta.get(i, {}).get('h') == h and os.path.exists(f'{OUT}/{i}.mp3'): continue
        starts, dur = join(i, Z)
        meta[i] = dict(h=h, dur=dur, at=starts); print('audio', i, f'{dur / 60:.1f} min', flush=True)
        json.dump(meta, open('tts.json', 'w'), separators=(',', ':'))
    json.dump(meta, open('tts.json', 'w'), separators=(',', ':'))
    print('total', f'{sum(m["dur"] for m in meta.values()) / 3600:.2f} h,', len(meta), 'files')

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True); os.makedirs(CACHE, exist_ok=True)
    asyncio.run(main(set(sys.argv[1:])))
