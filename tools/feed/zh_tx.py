"""Paragraph split for the transcript view + the Chinese paragraph translations in tx_zh/<id>.tsv.

tx_zh/<id>.tsv: one line per paragraph, "<start seconds>\t<中文译文>", same order as paragraphs().
  python3 zh_tx.py dump ID [ID...]   print the English paragraphs to translate ("<start>\t<text>")
  python3 zh_tx.py load FILE          split a batch file (same format as dump, Chinese instead of English) into tx_zh/<id>.tsv
  python3 zh_tx.py status            translation coverage per item"""
import json, os, re, sys

def paragraphs(segs, gap):
    out, cur, t0 = [], [], 0
    for s in segs:
        if not cur: t0 = s['start']
        cur.append(s['text'].replace('\n', ' ').strip())
        if s['start'] - t0 >= gap and re.search(r'[.?!]"?$', cur[-1]) or s['start'] - t0 >= gap * 1.6:
            out.append([int(t0), ' '.join(cur)]); cur = []
    if cur: out.append([int(t0), ' '.join(cur)])
    return out

def paras(it):
    t = json.load(open(f'transcripts/{it["id"]}.json', encoding='utf-8'))
    return t, paragraphs(t['transcript'], 12 if it['kind'] == 'short' else 22)

def zh(i, P):
    """Chinese lines for item i aligned to paragraphs P; None where not translated yet."""
    f = f'tx_zh/{i}.tsv'
    if not os.path.exists(f): return [None] * len(P)
    rows = [l.rstrip('\n').split('\t', 1) for l in open(f, encoding='utf-8') if l.strip()]
    assert len(rows) == len(P) and all(int(r[0]) == p[0] for r, p in zip(rows, P)), f'{f}: starts do not match paragraphs'
    assert all(len(r) == 2 and r[1].strip() for r in rows), f'{f}: empty translation'
    return [r[1].strip() for r in rows]

if __name__ == '__main__':
    items = {i['id']: i for i in json.load(open('items.json', encoding='utf-8'))}
    if sys.argv[1] == 'dump':
        for i in sys.argv[2:]:
            print(f'=== {i} | {items[i]["date"]} | {items[i]["title"]}')
            for s, t in paras(items[i])[1]: print(f'{s}\t{t}')
    elif sys.argv[1] == 'load':
        blocks = re.split(r'^=== ', open(sys.argv[2], encoding='utf-8').read(), flags=re.M)[1:]
        for b in blocks:
            head, *lines = b.strip('\n').split('\n'); i = head.split(' |')[0].strip()
            lines = [re.sub(r'^(\d+)\s+', r'\1\t', l.strip()) for l in lines if l.strip()]
            open(f'tx_zh/{i}.tsv', 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
            try: zh(i, paras(items[i])[1]); print('ok', i, len(lines))
            except AssertionError as e: os.remove(f'tx_zh/{i}.tsv'); print('FAIL', e)
    else:
        todo = [(i, len(paras(it)[1])) for i, it in items.items() if not os.path.exists(f'tx_zh/{i}.tsv')]
        print(f'{len(items) - len(todo)}/{len(items)} translated; todo:', ' '.join(f'{i}({n})' for i, n in todo))
