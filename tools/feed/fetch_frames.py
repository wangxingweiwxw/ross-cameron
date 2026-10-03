"""Downloads YouTube's auto-generated frames (≈25/50/75% of each video) and the cover image, resized into ../../ross-cameron/frames/ so the page never hot-links YouTube.
recap video: {id}-0.jpg cover, {id}-1..3.jpg frames (640x360)   short: {id}-0.jpg cover, {id}-2.jpg mid frame (360x640)"""
import io, json, os, urllib.request
from PIL import Image
OUT = '../../ross-cameron/frames'
os.makedirs(OUT, exist_ok=True)
def get(url):
    try:
        return Image.open(io.BytesIO(urllib.request.urlopen(url, timeout=30).read())).convert('RGB')
    except Exception as e:
        print('miss', url, e); return None
for it in json.load(open('items.json')):
    vid, short = it['id'], it['kind'] == 'short'
    want = {0: 'oardefault', 2: 'oar2'} if short else {0: 'maxresdefault', 1: 'maxres1', 2: 'maxres2', 3: 'maxres3'}
    for k, name in want.items():
        p = f'{OUT}/{vid}-{k}.jpg'
        if os.path.exists(p): continue
        im = get(f'https://i.ytimg.com/vi/{vid}/{name}.jpg')
        if im is None and short and k == 0: im = get(f'https://i.ytimg.com/vi/{vid}/oar1.jpg')  # some Shorts have no portrait cover
        if im is None and not short: im = get(f'https://i.ytimg.com/vi/{vid}/{"hqdefault" if k == 0 else f"hq{k}"}.jpg')
        if im is None: continue
        size = (360, 640) if short else (640, 360)
        # centre-crop to the target aspect, then resize
        w, h = im.size; r = size[0] / size[1]
        if w / h > r: nw = int(h * r); im = im.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
        else: nh = int(w / r); im = im.crop((0, (h - nh) // 2, w, (h - nh) // 2 + nh))
        im.resize(size, Image.LANCZOS).save(p, quality=72, optimize=True, progressive=True)
print(len(os.listdir(OUT)), 'files', sum(os.path.getsize(f'{OUT}/{f}') for f in os.listdir(OUT)) // 1024, 'KB')
