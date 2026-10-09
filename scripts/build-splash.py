#!/usr/bin/env python3
# Genererer iOS-opstartsbilleder (apple-touch-startup-image) til public/splash/ og linjerne til index.html (9. okt. 2026).
# Logoets synlige midte lægges præcist i skærmens geometriske midte (iOS' egen opstartsskærm af ikonet sad ca. 3,8 % for lavt).
# Kør: python3 scripts/build-splash.py   (kræver Pillow). Kilde: public/brand/EatSafe_BrandMark_Transparent_2048.png.
from PIL import Image
import os

SRC = "public/brand/EatSafe_BrandMark_Transparent_2048.png"
OUT = "public/splash"
BG = (255, 255, 255, 255)   # appens baggrund (--paper)
LOGO_SHARE = 0.18           # logoets bredde som andel af skærmbredden
# (css-bredde, css-højde, pixelratio, enheder)
DEVICES = [
    (440, 956, 3, "iPhone 16/17 Pro Max"),
    (420, 912, 3, "iPhone Air"),
    (430, 932, 3, "iPhone 14/15/16 Plus og Pro Max"),
    (402, 874, 3, "iPhone 16/17 Pro"),
    (428, 926, 3, "iPhone 12/13/14 Plus og Pro Max"),
    (393, 852, 3, "iPhone 14 Pro, 15, 15 Pro, 16"),
    (390, 844, 3, "iPhone 12/13/14, 12/13 Pro"),
    (414, 896, 3, "iPhone XS Max, 11 Pro Max"),
    (414, 896, 2, "iPhone XR, 11"),
    (375, 812, 3, "iPhone X/XS/11 Pro, 12/13 mini"),
    (414, 736, 3, "iPhone 6/7/8 Plus"),
    (375, 667, 2, "iPhone 6/7/8, SE 2/3"),
    (320, 568, 2, "iPhone SE 1"),
]

mark = Image.open(SRC).convert("RGBA")
mark = mark.crop(mark.getbbox())
os.makedirs(OUT, exist_ok=True)
links = []
for w, h, r, name in DEVICES:
    pw, ph = w * r, h * r
    lw = round(pw * LOGO_SHARE)
    lh = round(mark.height * lw / mark.width)
    logo = mark.resize((lw, lh), Image.LANCZOS)
    canvas = Image.new("RGBA", (pw, ph), BG)
    canvas.alpha_composite(logo, ((pw - lw) // 2, (ph - lh) // 2))
    fn = f"splash-{pw}x{ph}.png"
    canvas.convert("RGB").save(os.path.join(OUT, fn), optimize=True)
    links.append(f'    <link rel="apple-touch-startup-image" media="(device-width: {w}px) and (device-height: {h}px) and (-webkit-device-pixel-ratio: {r}) and (orientation: portrait)" href="/splash/{fn}" />')
print("\n".join(links))
