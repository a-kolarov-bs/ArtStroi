#!/usr/bin/env python3
"""Downloads legacy project photos, certificates and partner logos from the client's old site,
converts images to WebP (long side <= 1600px) and writes manifests to src/data/legacy-assets/<group>.json
(old URL -> local path + size; read by src/data/assets.ts, kept out of public/ so they are not published).
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
    if p.get('partner_logo_url'): urls.add(p['partner_logo_url'])
# src/ no longer holds the legacy URLs once they are rewritten; keep what the manifests already know.
for k in ('projects', 'sert', 'part'):
    if os.path.exists(f'{ROOT}/src/data/legacy-assets/{k}.json'):
        urls |= set(json.load(open(f'{ROOT}/src/data/legacy-assets/{k}.json'))['files'])
for f in glob.glob(f'{ROOT}/src/**/*', recursive=True):
    if os.path.isfile(f) and f.endswith(('.astro', '.ts', '.tsx', '.json')):
        urls |= set(re.findall(r'https?://(?:www\.)?artstroismolian\.com/(?:projects|sert)/[^"\'\s)>`]+\.(?:jpg|jpeg|png|pdf)', open(f).read()))
urls = sorted(u for u in urls if re.search(r'/(projects|sert|part)/', u))

def dest(u):
    path = unquote(u.split('artstroismolian.com/')[1])
    if path.startswith(('sert/', 'part/')):
        return 'public/' + path
    m = re.match(r'projects/(\d+)\.\w+$', path)          # cover
    if m: return f'public/projects/{m[1]}/{m[1]}.webp'
    m = re.match(r'projects/(\d+)/(.+)\.\w+$', path)      # gallery
    return f'public/projects/{m[1]}/{m[2]}.webp'

def px(f):
    o = subprocess.run(['sips', '-g', 'pixelWidth', '-g', 'pixelHeight', f], capture_output=True, text=True).stdout.split()
    try: return int(o[o.index('pixelWidth:')+1]), int(o[o.index('pixelHeight:')+1])
    except ValueError: return None, None

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
        # sips -Z also enlarges small images, so resize only when the long side exceeds 1600px.
        w, h = px(tmp)
        resize = ['-Z', '1600'] if max(w or 0, h or 0) > 1600 else []
        r = subprocess.run(['sips', *resize, '-s', 'format', 'png', tmp, '--out', sc], capture_output=True)
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
def group(u): return re.search(r'artstroismolian\.com/(projects|sert|part)/', u)[1]
man = {'projects': {}, 'sert': {}, 'part': {}}; bad = []
for u, out, st in res:
    if not out: bad.append([u, st]); continue
    w, h = dims(out)
    man[group(u)][u] = {'path': '/' + os.path.relpath(out, f'{ROOT}/public'), 'width': w, 'height': h, 'bytes': os.path.getsize(out)}
for k in man:
    json.dump({'files': man[k], 'failed': [b for b in bad if group(b[0]) == k]}, open(f'{ROOT}/src/data/legacy-assets/{k}.json', 'w'), indent=1, ensure_ascii=False)
print(len(urls), 'urls;', len(urls) - len(bad), 'ok;', 'failed:', bad)
