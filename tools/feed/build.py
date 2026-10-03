"""Builds ../../ross-cameron/index.html from template.html + app.js + items.json (YouTube item metadata) + zh.py (title/description translations)
+ summaries.py (Chinese summaries written from the transcripts) + transcripts/*.json (TranscriptAPI)
+ tx_zh/*.tsv (paragraph-by-paragraph Chinese translations of the transcripts, see zh_tx.py) + the ledger parts of index.v1.html.
Frames are expected in ../../ross-cameron/frames (run fetch_frames.py first); the Chinese voiceover in ../../ross-cameron/audio + tts.json (run tts.py;
items without audio fall back to the browser's speech synthesis)."""
import json, os, re, sys
sys.path.insert(0, '.')
from zh import ZH
from summaries import S, SH
from zh_tx import paras, zh
from tts import digest
sys.path.insert(0, '../series')
from series import rail_series, SERIES_CSS

# ---- ledger (markup + JS) from the v1 page; its stylesheet is not reused ----
v1 = open('index.v1.html', encoding='utf-8').read()
stats = re.search(r'(<div class="stats">.*?</div></div>)\s*<div class="reading">', v1, re.S).group(1)
reading = re.search(r'(<div class="reading">.*?</div>)</div>\s*<nav', v1, re.S).group(1)
secs = re.search(r'(<section id="annual">.*</section>)\s*</main>', v1, re.S).group(1)
secs = re.sub(r'<div class="source-item"><span class="source-id">S06</span>.*?</div></div>', '', secs, flags=re.S)  # old visual-reference credit
assert 'serenity' not in secs.lower()
secs = re.sub(r'<h2><span>0(\d)</span>', r'<h2><span>L\1</span>', secs)
js = re.search(r'<script>(.*?)</script>', v1, re.S).group(1)
js = re.sub(r'const observer=new IntersectionObserver.*?\n', '', js)
js = js.replace('rgba(29,78,216,', 'rgba(79,140,255,').replace("'#1944a7'", "'#bcd3ff'")  # 正收益用蓝色

# ---- per-item data ----
# 视频中他自报的当日盈亏：(主账户, 小账户)，None = 视频里没说
PV = {'pE28gatGmwo': (0, None), '0yaq1jVucSw': (-31000, None), '2FMq35RvcbQ': (-10000, None), 'v1gjl51UiTA': (2992, None),
      'H6UQrcZ5_F8': (9961, None), 'lJ3GmD_ocIg': (13543, None), 'KcwJ9JtigiQ': (10391, None), 'zZPvL7Qrlkc': (26000, None),
      '_CVpwf8-Iyo': (24000, None), 'spaw93SAySQ': (None, 11000), '881U8Ya0QKI': (0, None), 'QVCkRBAUrSo': (0, 0),
      'HV7aW59s0p8': (None, 6385), 'ZRvnTrmQHsM': (-44000, -3000), 'zopLK4MtWPA': (0, 0), 'VZjai9BpRWU': (620, None),
      'x1RLtnF2To4': (121, None), 'sp533QHi-58': (27814, None), 'dun36aWBpxg': (-8200, -8400), 'nB5g2GFvBxU': (-5000, None),
      'Wd_iUsteoaw': (0, None), '6XWWdmOkOPs': (976, None), 'bd16G3KZJ7s': (47000, None), 'M2x5LGI3LIY': (-15000, 3400),
      'hs87P5GNEac': (None, 10598)}

items = json.load(open('items.json', encoding='utf-8'))
tts = json.load(open('tts.json')) if os.path.exists('tts.json') else {}
feed, tx, au, words, done, total = [], {}, {}, 0, 0, 0
for it in items:
    i = it['id']; zt, ze, topic = ZH[i]
    t, P = paras(it)
    n = t['length_seconds']; short = it['kind'] == 'short'
    words += sum(len(s['text'].split()) for s in t['transcript'])
    Z = zh(i, P); done += sum(z is not None for z in Z); total += len(P)
    tx[i] = [[s, e, z] if z else [s, e] for (s, e), z in zip(P, Z)]  # [start, English, 中文译文]
    a = tts.get(i)  # 配音：at = 每段在音频里的起点秒数（未翻译的段为 null）；译文改过但没重跑 tts.py 的不收录，页面改用浏览器朗读
    if a and a['h'] == digest(Z) and os.path.exists(f'../../ross-cameron/audio/{i}.mp3'):
        au[i] = dict(h=a['h'], dur=a['dur'], at=a['at'])
    frames = [[k, None if k == 0 else round(n * k / 4)] for k in ((0, 2) if short else (0, 1, 2, 3))]
    for k, _ in frames: assert os.path.exists(f'../../ross-cameron/frames/{i}-{k}.jpg'), (i, k)
    d = dict(id=i, kind=it['kind'], date=it['date'], title=it['title'], en=it['en'], zt=zt, ze=ze, topic=topic, views=it['views'], len=n, fr=frames)
    if short:
        d['sum'] = SH[i]
    else:
        s = S[i]; d.update(sum=s['sum'], pts=s['pts'], ch=s['ch'], tk=s['tk'], pnl=s['pnl'])
        if i in PV: d['pv'], d['ps'] = PV[i]
    feed.append(d)
assert not [i for i in items if i['kind'] == 'video' and i['id'] not in S]

t = open('template.html', encoding='utf-8').read()
for k, v in {'__LEDGER_TOP__': stats + reading.replace('<div class="reading">', '<div class="reading" id="caveats">'), '__V1SECTIONS__': secs,
             '__V1JS__': js.strip(), '__FEED__': json.dumps(feed, ensure_ascii=False, separators=(',', ':')),
             '__TX__': json.dumps(tx, ensure_ascii=False, separators=(',', ':')),
             '__AUDIO__': json.dumps(au, separators=(',', ':')), '__WORDS__': f'{words:,}',
             '__APPJS__': open('app.js', encoding='utf-8').read(),
             '__SERIES__': rail_series('ross-cameron'), '__SERIESCSS__': SERIES_CSS}.items():
    assert k in t, k
    t = t.replace(k, v)
assert 'serenity' not in t.lower() and 'youtube.com' not in t and 'ytimg' not in t, 'external YouTube/visual-reference link left in page'
open('../../ross-cameron/index.html', 'w', encoding='utf-8').write(t)
print('ok', len(t) // 1024, 'KB,', len(feed), 'items,', f'{words:,}', 'transcript words,', f'{done}/{total}', 'paragraphs translated,', f'{len(au)}/{len(feed)}', 'items voiced')
