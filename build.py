#!/usr/bin/env python3
"""Builds dist/ (installable PWA) and artifact.html (preview page) from src/."""
import glob, os, base64, json, shutil
ROOT = os.path.dirname(os.path.abspath(__file__))
src = lambda p: open(os.path.join(ROOT, 'src', p), encoding='utf-8').read()
css = src('style.css').replace('__MONET__', src('monet.b64').strip()).replace('__SEURAT__', src('bg-seurat.b64').strip()).replace('__NIGHT__', src('bg-night.b64').strip())
js = '\n'.join(open(f, encoding='utf-8').read() for f in sorted(glob.glob(os.path.join(ROOT, 'src', '[0-9][0-9]-*.js'))))
FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Fraunces:ital,opsz,wght@0,9..144,500;1,9..144,500&family=Dancing+Script:wght@600&display=swap">'
BODY = '<div id="app"><main class="wrap"><p style="padding:24px 0">Loading One Day…</p></main></div><noscript>One Day needs JavaScript.</noscript>'
TITLE = 'One Day — Mariana'

artifact = f'<title>{TITLE}</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n{FONTS}\n<style>\n{css}\n</style>\n{BODY}\n<script>\n{js}\n</script>\n'
open(os.path.join(ROOT, 'artifact.html'), 'w', encoding='utf-8').write(artifact)

dist = os.path.join(ROOT, 'dist')
os.makedirs(dist, exist_ok=True)
index = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{TITLE}</title>
<meta name="description" content="A personal daily accountability app. Data stays on this device.">
<meta name="theme-color" content="#F1ECF7" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#1B1726" media="(prefers-color-scheme: dark)">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="One Day">
<meta name="referrer" content="no-referrer">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icons/icon-192.png" type="image/png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
{FONTS}
<style>
:root {{ padding-top: env(safe-area-inset-top, 0px); padding-bottom: env(safe-area-inset-bottom, 0px); }}
[hidden] {{ display: none !important; }}
img {{ max-width: 100%; }}
{css}
</style>
</head>
<body>
{BODY}
<script>
{js}
</script>
</body>
</html>
'''
open(os.path.join(dist, 'index.html'), 'w', encoding='utf-8').write(index)
manifest = {
  "name": TITLE, "short_name": "One Day", "start_url": "./", "scope": "./", "display": "standalone",
  "background_color": "#F1ECF7", "theme_color": "#66569A", "lang": "en",
  "icons": [
    {"src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png"},
    {"src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png"},
    {"src": "icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}
  ]
}
shutil.copy(os.path.join(ROOT, 'src', 'mindset.json'), os.path.join(dist, 'mindset.json'))
shutil.copy(os.path.join(ROOT, 'src', 'mindset.json'), os.path.join(ROOT, 'mindset.json'))
json.dump(manifest, open(os.path.join(dist, 'manifest.webmanifest'), 'w'), indent=2)
shutil.copy(os.path.join(ROOT, 'src', 'sw.js'), os.path.join(dist, 'sw.js'))
print('built', len(index), 'bytes')
