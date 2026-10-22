#!/usr/bin/env python3
"""Merges tools/tr/*.tsv (index, es, it, fr) with tools/strings.json into src/i18n/ui.json."""
import json, glob, os, re
H = os.path.dirname(os.path.abspath(__file__))
lists = {'': [x['s'] for x in json.load(open(os.path.join(H, 'strings-v1.json'), encoding='utf-8'))]}
for v in ('v2', 'v3', 'v4'):
    if os.path.exists(os.path.join(H, f'strings-{v}.json')): lists[v + '-'] = [x['s'] for x in json.load(open(os.path.join(H, f'strings-{v}.json'), encoding='utf-8'))]
out = {}
dec = lambda s: s.replace('\\u202f', ' ')
for f in sorted(glob.glob(os.path.join(H, 'tr', '*.tsv'))):
    strings = lists[os.path.basename(f)[:3] if os.path.basename(f)[:3] in lists else '']
    for line in open(f, encoding='utf-8'):
        line = line.rstrip('\n')
        if not line.strip(): continue
        parts = line.split('\t')
        if len(parts) != 4: raise SystemExit(f'{f}: bad line {line[:60]}')
        i, es, it, fr = int(parts[0]), dec(parts[1]), dec(parts[2]), dec(parts[3])
        if es == '=': continue
        en = strings[i]
        ph = sorted(re.findall(r'\{\d+\}', en))
        for t in (es, it, fr):
            if sorted(re.findall(r'\{\d+\}', t)) != ph: raise SystemExit(f'placeholder mismatch at {i}: {en} -> {t}')
        out[en] = [es, it, fr]
# extra entries (plural nouns and other fixed words)
extra = os.path.join(H, 'tr', 'extra.json')
if os.path.exists(extra): out.update(json.load(open(extra, encoding='utf-8')))
os.makedirs(os.path.join(H, '..', 'src', 'i18n'), exist_ok=True)
json.dump(out, open(os.path.join(H, '..', 'src', 'i18n', 'ui.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
print(len(out), 'entries')
