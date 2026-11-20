"""Slice the owner-chosen HUD reference sheet (assets/source/ui_hud_sheet_v01.webp, already RGBA)
into separate transparent PNGs under public/assets/ui/. No repainting: pixels are copied as-is,
only stray low-alpha noise (alpha < 8, or outside the piece's own outline + 3 px) is cleared.
Usage: python3 tools/art/slice_hud.py   (needs Pillow + numpy)"""
from PIL import Image
import numpy as np, json, sys
SRC = 'assets/source/ui_hud_sheet_v01.webp'
OUT = 'public/assets/ui/'
# Menu icons without a game feature yet (bag, quest, chat, emote, swap) are commented out so the build stays small.
# name -> (a point inside the piece in sheet px (y, x), output width or None = native)
PIECES = {
    'ui_hud_hp_frame_v01': ((30, 200), 900),
    'ui_hud_boss_frame_v01': ((310, 600), 1260),
    'ui_btn_frame_v01': ((380, 225), 270),
    'ui_stick_base_v01': ((530, 445), None),
    'ui_stick_knob_v01': ((530, 857), None),
    'ui_panel_v01': ((400, 1300), None),
    # 'ui_menu_bag_v01': ((790, 90), 150),
    # 'ui_menu_quest_v01': ((790, 300), 150),
    'ui_menu_settings_v01': ((790, 510), 150),
    # 'ui_menu_chat_v01': ((790, 720), 150),
    # 'ui_menu_emote_v01': ((790, 930), 150),
    # 'ui_menu_swap_v01': ((790, 1140), 150),
    'ui_toggle_v01': ((785, 1350), None),
}
src = np.array(Image.open(SRC).convert('RGBA'))
H, W = src.shape[:2]
opaque = src[..., 3] > 8

def flood(y, x):
    m = np.zeros((H, W), bool); st = [(y, x)]; m[y, x] = True
    while st:
        cy, cx = st.pop()
        for ny, nx in ((cy + 1, cx), (cy - 1, cx), (cy, cx + 1), (cy, cx - 1)):
            if 0 <= ny < H and 0 <= nx < W and opaque[ny, nx] and not m[ny, nx]:
                m[ny, nx] = True; st.append((ny, nx))
    return m

report = {}
for name, ((y, x), outw) in PIECES.items():
    r = 0
    while not opaque[y, x]:  # nudge to the nearest opaque pixel
        r += 1; ys, xs = np.nonzero(opaque[max(0, y - r):y + r + 1, max(0, x - r):x + r + 1])
        if len(ys): y, x = max(0, y - r) + ys[0], max(0, x - r) + xs[0]
    m = flood(y, x); d = m.copy()
    for _ in range(3): d = d | np.roll(d, 1, 0) | np.roll(d, -1, 0) | np.roll(d, 1, 1) | np.roll(d, -1, 1)
    ys, xs = np.nonzero(m)
    y0, y1, x0, x1 = max(0, ys.min() - 3), min(H, ys.max() + 4), max(0, xs.min() - 3), min(W, xs.max() + 4)
    out = src[y0:y1, x0:x1].copy()
    keep = d[y0:y1, x0:x1] & (out[..., 3] >= 8)
    out[..., 3] = np.where(keep, out[..., 3], 0); out[out[..., 3] == 0, :3] = 0
    im = Image.fromarray(out)
    if outw and outw < im.width:  # premultiplied resize so no dark fringe appears at the edges
        im = im.convert('RGBa').resize((outw, round(im.height * outw / im.width)), Image.LANCZOS).convert('RGBA')
    im.save(OUT + name + '.png', optimize=True)
    a = np.array(im)[..., 3]
    report[name] = {'sheet_box': [int(x0), int(y0), int(x1 - x0), int(y1 - y0)], 'size': list(im.size),
                    'semi_px': int(((a > 0) & (a < 250)).sum()), 'edge_alpha_max': int(max(a[0].max(), a[-1].max(), a[:, 0].max(), a[:, -1].max()))}
json.dump(report, open(OUT + 'slices.json', 'w'), indent=1)
print(json.dumps(report, indent=1))
