"""Print condensed transcripts: python3 tx.py ID [ID...]  (paragraph every ~45s, [mm:ss] markers)"""
import json, sys, textwrap
for vid in sys.argv[1:]:
    d = json.load(open(f'transcripts/{vid}.json'))
    it = {i['id']: i for i in json.load(open('items.json'))}[vid]
    print(f"=== {vid} | {it['date']} | {it['title']} | {d['length_seconds']}s")
    para, t0 = [], 0
    for s in d['transcript']:
        if not para: t0 = s['start']
        para.append(s['text'].replace('\n', ' '))
        if s['start'] - t0 > 45:
            print(f"[{int(t0)//60:02d}:{int(t0)%60:02d}] " + ' '.join(para)); para = []
    if para: print(f"[{int(t0)//60:02d}:{int(t0)%60:02d}] " + ' '.join(para))
