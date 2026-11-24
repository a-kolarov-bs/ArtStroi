#!/usr/bin/env python3
"""Downloads legacy project photos and certificates from the client's old site,
converts images to WebP (long side <= 1600px) and writes manifests.
Usage: python3 scripts/fetch-legacy-assets.py   (idempotent: skips existing files)"""
from urllib.parse import unquote
import json, re, subprocess, os, sys, glob, tempfile
from concurrent.futures import ThreadPoolExecutor
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = 'https://www.artstroismolian.com'
urls = set()
for p in json.load(open(f'{ROOT}/data-extract/projects.json')):
    if p.get('cover_image_url'): urls.add(p['cover_image_url'])
    urls |= set(p.get('gallery_image_urls') or [])
for f in glob.glob(f'{ROOT}/src/**/*', recursive=True):
    if os.path.isfile(f) and f.endswith(('.astro', '.ts', '.tsx', '.json')):
        urls |= set(re.findall(r'https?://(?:www\.)?artstroismolian\.com/(?:projects|sert)/[^"\'\s)>`]+\.(?:jpg|jpeg|png|pdf)', open(f).read()))
urls = sorted(u for u in urls if re.search(r'/(projects|sert)/', u))

def dest(u):
    path = unquote(u.split('artstroismolian.com/')[1])
    if path.startswith('sert/'):
        return 'public/' + path
    m = re.match(r'projects/(\d+)\.\w+$', path)          # cover
    if m: return f'public/projects/{m[1]}/{m[1]}.webp'
    m = re.match(r'projects/(\d+)/(.+)\.\w+$', path)      # gallery
    return f'public/projects/{m[1]}/{m[2]}.webp'

def one(u):
    d = dest(u); out = f'{ROOT}/{d}'
    if u.lower().endswith('.pdf'): out = f'{ROOT}/' + d
    elif d.endswith(('.jpg', '.png')): out = f'{ROOT}/' + re.sub(r'\.\w+$', '.webp', d)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    if os.path.exists(out): return u, out, 'exists'
    tmp = tempfile.mktemp(suffix=os.path.splitext(u)[1])
    r = subprocess.run(['curl', '-sS', '--fail', '--retry', '2', '-o', tmp, u.replace('https://artstroismolian.com', BASE)], capture_output=True)
    if r.returncode: return u, None, 'fail'
    if u.lower().endswith('.pdf'):
        os.replace(tmp, out)
    else:
        sc = tmp + '.s.png'
        r = subprocess.run(['sips', '-Z', '1600', '-s', 'format', 'png', tmp, '--out', sc], capture_output=True)  # -Z only shrinks
        if r.returncode == 0:
            r = subprocess.run(['cwebp', '-quiet', '-q', '80', sc, '-o', out], capture_output=True)
        for t in (tmp, sc):
            if os.path.exists(t): os.remove(t)
        if r.returncode: return u, None, 'convert-fail'
    return u, out, 'ok'

with ThreadPoolExecutor(4) as ex: res = list(ex.map(one, urls))
def dims(f):
    if not f.endswith('.webp'): return None, None
    o = subprocess.run(['sips', '-g', 'pixelWidth', '-g', 'pixelHeight', f], capture_output=True, text=True).stdout.split()
    return int(o[o.index('pixelWidth:')+1]), int(o[o.index('pixelHeight:')+1])
man = {'projects': {}, 'sert': {}}; bad = []
for u, out, st in res:
    if not out: bad.append([u, st]); continue
    w, h = dims(out)
    man['sert' if '/sert/' in u else 'projects'][u] = {'path': '/' + os.path.relpath(out, f'{ROOT}/public'), 'width': w, 'height': h, 'bytes': os.path.getsize(out)}
for k in man:
    json.dump({'files': man[k], 'failed': [b for b in bad if ('/sert/' in b[0]) == (k == 'sert')]}, open(f'{ROOT}/public/{k}/manifest.json', 'w'), indent=1, ensure_ascii=False)
print(len(urls), 'urls;', len(urls) - len(bad), 'ok;', 'failed:', bad)
