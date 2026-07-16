#!/usr/bin/env python3
"""Génère des logos autonomes « YowYob + pastille » (couleur + initiales) pour les
plateformes qui partagent le logo de la suite (accounting/billing/tp), à transmettre.
Sortie : public/images/badged/<id>.png (fond transparent, ~512px)."""

import os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
LOGO = os.path.join(ROOT, "public", "images", "yowyob-logo.png")
OUT_DIR = os.path.join(ROOT, "public", "images", "badged")
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

# (id, initiales, couleur pastille)
BADGES = [
    ("accounting", "AC", "#2563EB"),  # bleu
    ("billing",    "BL", "#1E40AF"),  # bleu foncé
    ("thirdparty", "TP", "#F97316"),  # orange
]

CANVAS = 512
LOGO_H = 400                 # hauteur du logo dans le canvas
BADGE_D = 210                # diamètre de la pastille colorée
RING = 12                    # épaisseur du liseré blanc


def hex_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def make(one_id, initials, color):
    logo = Image.open(LOGO).convert("RGBA")
    w = round(LOGO_H * logo.width / logo.height)
    logo = logo.resize((w, LOGO_H), Image.LANCZOS)

    canvas = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    lx = (CANVAS - w) // 2 - 30
    ly = (CANVAS - LOGO_H) // 2 - 30
    canvas.alpha_composite(logo, (lx, ly))

    draw = ImageDraw.Draw(canvas)
    # centre de la pastille : coin bas-droit du logo
    cx = lx + w + 6
    cy = ly + LOGO_H + 6
    cx = min(cx, CANVAS - BADGE_D // 2 - 4)
    cy = min(cy, CANVAS - BADGE_D // 2 - 4)
    r = BADGE_D // 2
    # liseré blanc
    draw.ellipse([cx - r - RING, cy - r - RING, cx + r + RING, cy + r + RING],
                 fill=(255, 255, 255, 255))
    # disque coloré
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=hex_rgb(color) + (255,))
    # initiales
    font = ImageFont.truetype(FONT, int(BADGE_D * 0.44))
    tb = draw.textbbox((0, 0), initials, font=font)
    tw, th = tb[2] - tb[0], tb[3] - tb[1]
    draw.text((cx - tw / 2 - tb[0], cy - th / 2 - tb[1]), initials,
              font=font, fill=(255, 255, 255, 255))

    out = os.path.join(OUT_DIR, one_id + ".png")
    canvas.save(out)
    print("écrit :", out)


if __name__ == "__main__":
    os.makedirs(OUT_DIR, exist_ok=True)
    for b in BADGES:
        make(*b)
