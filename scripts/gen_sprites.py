#!/usr/bin/env python3
"""
gen_sprites.py - Generate pixel-art sprite sheets for spellbound-clash.
Produces:
  public/sprites/hero_new.png   - Blue wizard hero
  public/sprites/enemy_new.png  - Dark mage enemy

Sheet format: 64x64 pixels per frame, same LPC row layout as the game:
  Row 39 = walk side (right-facing, flip for left)
  Row 40 = walk down
  Row 41 = walk up
  Row 51 = attack down
Each row has 6 animation frames (cols 0-5).
Total sheet size: 6 cols × 52 rows (at minimum) = 384 × 3328 px
"""

from PIL import Image, ImageDraw
import os

OUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'sprites')
os.makedirs(OUT_DIR, exist_ok=True)

FW = 64  # frame width
FH = 64  # frame height
COLS = 6  # frames per row
ROWS = 52  # total rows in sheet (to include row 51 for attack)

def make_sheet():
    return Image.new('RGBA', (FW * COLS, FH * ROWS), (0, 0, 0, 0))

def draw_frame(img, col, row, draw_fn, frame_idx=0):
    """Draw a sprite frame into slot (col, row) of the sheet."""
    x0, y0 = col * FW, row * FH
    frame = Image.new('RGBA', (FW, FH), (0, 0, 0, 0))
    d = ImageDraw.Draw(frame)
    draw_fn(d, frame_idx)
    img.paste(frame, (x0, y0), frame)

# ─────────────────────────────────────────
# HERO: Blue Wizard / Spell Caster
# ─────────────────────────────────────────
HERO_ROBE    = (42, 90, 200, 255)    # bright blue robe
HERO_ROBE_D  = (24, 56, 145, 255)    # darker blue
HERO_HAT     = (15, 30, 90, 255)     # deep navy hat
HERO_SKIN    = (255, 210, 160, 255)  # warm skin
HERO_HAIR    = (80, 40, 10, 255)     # dark brown hair
HERO_BELT    = (180, 130, 20, 255)   # golden belt
HERO_EYES    = (30, 30, 80, 255)     # dark eyes
HERO_STAR    = (255, 230, 50, 255)   # star on hat
HERO_WAND    = (140, 90, 30, 255)    # wand color
HERO_MAGIC   = (160, 220, 255, 255)  # magic glow

def hero_shadow(d, ox=32, oy=60, rx=18, ry=5):
    d.ellipse([ox-rx, oy-ry, ox+rx, oy+ry], fill=(0,0,0,60))

def hero_body_down(d, frame_idx=0):
    """Hero facing down (toward camera)."""
    # Bob animation
    bob = [-1,0,1,0,-1,0][frame_idx % 6]
    ox, oy = 32, 60

    hero_shadow(d)
    y = 10 + bob

    # Robe body
    d.rectangle([22, y+18, 42, y+48], fill=HERO_ROBE)
    d.rectangle([22, y+38, 42, y+48], fill=HERO_ROBE_D)

    # Belt
    d.rectangle([22, y+34, 42, y+38], fill=HERO_BELT)

    # Arms
    d.rectangle([14, y+20, 22, y+36], fill=HERO_ROBE)
    d.rectangle([42, y+20, 50, y+36], fill=HERO_ROBE)

    # Hands
    d.rectangle([14, y+34, 20, y+42], fill=HERO_SKIN)
    d.rectangle([44, y+34, 50, y+42], fill=HERO_SKIN)

    # Wand in right hand
    d.rectangle([46, y+24, 49, y+46], fill=HERO_WAND)
    # Wand tip magic glow
    d.ellipse([43, y+20, 52, y+28], fill=HERO_MAGIC)

    # Feet
    d.rectangle([23, y+46, 31, y+54], fill=HERO_HAT)
    d.rectangle([33, y+46, 41, y+54], fill=HERO_HAT)

    # Neck
    d.rectangle([28, y+12, 36, y+20], fill=HERO_SKIN)

    # Head
    d.rectangle([22, y+4, 42, y+16], fill=HERO_SKIN)

    # Eyes (forward)
    d.rectangle([25, y+8, 28, y+12], fill=HERO_EYES)
    d.rectangle([36, y+8, 39, y+12], fill=HERO_EYES)

    # Mouth (small smile)
    d.rectangle([29, y+13, 36, y+14], fill=(180, 100, 90, 255))

    # Hat brim
    d.rectangle([18, y+2, 46, y+6], fill=HERO_HAT)

    # Hat cone
    d.rectangle([24, y-10, 40, y+4], fill=HERO_HAT)
    d.rectangle([27, y-18, 37, y-8], fill=HERO_HAT)
    d.rectangle([30, y-24, 34, y-16], fill=HERO_HAT)

    # Star on hat
    d.rectangle([29, y-15, 35, y-11], fill=HERO_STAR)
    d.rectangle([30, y-18, 34, y-8], fill=HERO_STAR)

def hero_body_up(d, frame_idx=0):
    """Hero facing up (away from camera)."""
    bob = [-1,0,1,0,-1,0][frame_idx % 6]
    y = 10 + bob

    hero_shadow(d)

    # Robe body (back)
    d.rectangle([22, y+18, 42, y+48], fill=HERO_ROBE_D)
    d.rectangle([22, y+38, 42, y+48], fill=(15, 40, 100, 255))

    # Arms
    d.rectangle([14, y+20, 22, y+36], fill=HERO_ROBE_D)
    d.rectangle([42, y+20, 50, y+36], fill=HERO_ROBE_D)

    # Feet
    d.rectangle([23, y+46, 31, y+54], fill=HERO_HAT)
    d.rectangle([33, y+46, 41, y+54], fill=HERO_HAT)

    # Hair (back of head visible)
    d.rectangle([22, y+2, 42, y+18], fill=HERO_HAIR)
    d.rectangle([24, y, 40, y+6], fill=HERO_HAIR)

    # Hat
    d.rectangle([18, y+1, 46, y+5], fill=HERO_HAT)
    d.rectangle([24, y-10, 40, y+3], fill=HERO_HAT)
    d.rectangle([27, y-18, 37, y-8], fill=HERO_HAT)
    d.rectangle([30, y-24, 34, y-16], fill=HERO_HAT)

def hero_body_side(d, frame_idx=0):
    """Hero facing right (flip for left)."""
    bob = [-1,0,1,0,-1,0][frame_idx % 6]
    # Walking leg animation
    leg_offset = [0,4,0,-4,0,4][frame_idx % 6]
    y = 10 + bob

    hero_shadow(d, rx=14)

    # Robe body
    d.rectangle([26, y+18, 44, y+48], fill=HERO_ROBE)
    d.rectangle([26, y+38, 44, y+48], fill=HERO_ROBE_D)
    d.rectangle([26, y+34, 44, y+38], fill=HERO_BELT)

    # Forward arm (right arm visible from side)
    d.rectangle([42, y+20, 52, y+36], fill=HERO_ROBE)
    d.rectangle([42, y+34, 50, y+44], fill=HERO_SKIN)
    # Wand
    d.rectangle([47, y+22, 50, y+44], fill=HERO_WAND)
    d.ellipse([44, y+16, 54, y+26], fill=HERO_MAGIC)

    # Back arm
    d.rectangle([18, y+20, 26, y+36], fill=HERO_ROBE_D)

    # Legs (animated)
    d.rectangle([26, y+46, 34, y+54+leg_offset], fill=HERO_HAT)
    d.rectangle([36, y+46, 44, y+54-leg_offset], fill=HERO_HAT)

    # Head
    d.rectangle([26, y+2, 46, y+18], fill=HERO_SKIN)
    # Side eye
    d.rectangle([42, y+7, 46, y+11], fill=HERO_EYES)
    # Hair
    d.rectangle([24, y+2, 30, y+18], fill=HERO_HAIR)
    d.rectangle([24, y, 36, y+6], fill=HERO_HAIR)
    # Ear
    d.rectangle([24, y+8, 27, y+13], fill=HERO_SKIN)

    # Hat
    d.rectangle([22, y+1, 48, y+5], fill=HERO_HAT)
    d.rectangle([28, y-10, 46, y+3], fill=HERO_HAT)
    d.rectangle([31, y-18, 45, y-8], fill=HERO_HAT)
    d.rectangle([34, y-24, 44, y-16], fill=HERO_HAT)

def hero_attack(d, frame_idx=0):
    """Hero attack/spell pose (facing down, lunging forward)."""
    lunge = [0, 3, 6, 8, 5, 2][frame_idx % 6]
    y = 10

    hero_shadow(d, ox=32+lunge//2)

    # Robe body (angled forward)
    d.rectangle([22+lunge, y+18, 42+lunge, y+48], fill=HERO_ROBE)
    d.rectangle([22+lunge, y+38, 42+lunge, y+48], fill=HERO_ROBE_D)
    d.rectangle([22+lunge, y+34, 42+lunge, y+38], fill=HERO_BELT)

    # Extended casting arm
    arm_ext = lunge + 8
    d.rectangle([42+lunge, y+20, 52+arm_ext, y+30], fill=HERO_ROBE)
    d.rectangle([52+arm_ext, y+22, 58+arm_ext, y+32], fill=HERO_SKIN)
    # Giant magic blast
    glow_r = 8 + frame_idx * 2
    d.ellipse([55+arm_ext-glow_r, y+18-glow_r, 55+arm_ext+glow_r, y+36+glow_r], fill=(100, 200, 255, 200))
    d.ellipse([57+arm_ext-4, y+22, 57+arm_ext+4, y+32], fill=(220, 240, 255, 255))

    # Back arm
    d.rectangle([14+lunge, y+20, 22+lunge, y+36], fill=HERO_ROBE)
    d.rectangle([14+lunge, y+34, 20+lunge, y+44], fill=HERO_SKIN)

    # Feet
    d.rectangle([23, y+46, 31, y+54], fill=HERO_HAT)
    d.rectangle([33, y+46, 41, y+54], fill=HERO_HAT)

    # Head (tilted toward cast)
    d.rectangle([24+lunge, y+4, 44+lunge, y+16], fill=HERO_SKIN)
    d.rectangle([27+lunge, y+8, 30+lunge, y+12], fill=HERO_EYES)
    d.rectangle([38+lunge, y+8, 41+lunge, y+12], fill=HERO_EYES)

    # Hat
    d.rectangle([20+lunge, y+2, 48+lunge, y+6], fill=HERO_HAT)
    d.rectangle([26+lunge, y-10, 42+lunge, y+4], fill=HERO_HAT)
    d.rectangle([29+lunge, y-18, 39+lunge, y-8], fill=HERO_HAT)
    d.rectangle([32+lunge, y-24, 36+lunge, y-16], fill=HERO_HAT)
    d.rectangle([31+lunge, y-15, 37+lunge, y-11], fill=HERO_STAR)

def build_hero_sheet():
    img = make_sheet()

    # Row 39 = WALK SIDE
    for f in range(6):
        draw_frame(img, f, 39, lambda d, fi=f: hero_body_side(d, fi))

    # Row 40 = WALK DOWN
    for f in range(6):
        draw_frame(img, f, 40, lambda d, fi=f: hero_body_down(d, fi))

    # Row 41 = WALK UP
    for f in range(6):
        draw_frame(img, f, 41, lambda d, fi=f: hero_body_up(d, fi))

    # Row 51 = ATTACK
    for f in range(6):
        draw_frame(img, f, 51, lambda d, fi=f: hero_attack(d, fi))

    return img

# ─────────────────────────────────────────
# ENEMY: Dark Mage / Shadow Caster
# ─────────────────────────────────────────
E_ROBE    = (60, 10, 80, 255)     # deep purple robe
E_ROBE_D  = (35, 5, 50, 255)      # darker purple
E_HOOD    = (20, 0, 40, 255)      # near-black hood
E_SKIN    = (100, 60, 80, 255)    # dark reddish skin
E_EYES    = (255, 80, 80, 255)    # glowing red eyes
E_AURA    = (180, 60, 255, 180)   # purple magic aura
E_ORB     = (220, 100, 255, 255)  # magic orb
E_BONE    = (200, 190, 160, 255)  # staff bone/skull

def enemy_shadow(d, ox=32, oy=60, rx=18, ry=5):
    d.ellipse([ox-rx, oy-ry, ox+rx, oy+ry], fill=(0,0,0,80))

def enemy_body_down(d, frame_idx=0):
    """Enemy facing down (toward camera)."""
    bob = [0,1,0,-1,0,1][frame_idx % 6]
    float_bob = bob - 2  # enemy hovers slightly
    y = 12 + float_bob

    enemy_shadow(d, oy=62)

    # Robe
    d.rectangle([22, y+18, 42, y+50], fill=E_ROBE)
    d.rectangle([22, y+38, 42, y+50], fill=E_ROBE_D)

    # Cloak sides (wider)
    d.rectangle([14, y+24, 22, y+50], fill=E_ROBE)
    d.rectangle([42, y+24, 50, y+50], fill=E_ROBE)

    # Floating dark particles / tendrils at bottom
    for i in range(3):
        px = 24 + i*8
        d.rectangle([px, y+48, px+4, y+56], fill=(E_ROBE[0], E_ROBE[1], E_ROBE[2], 150))

    # Staff (left side)
    d.rectangle([13, y+8, 16, y+50], fill=E_BONE)
    # Skull top of staff
    d.ellipse([8, y+2, 20, y+12], fill=E_BONE)
    d.rectangle([11, y+6, 17, y+10], fill=(0,0,0,0))  # eye holes
    d.ellipse([10, y+6, 13, y+9], fill=E_HOOD)
    d.ellipse([14, y+6, 17, y+9], fill=E_HOOD)
    # Orb above skull
    d.ellipse([9, y-5, 19, y+5], fill=E_ORB)

    # Orb aura glow
    for r in range(4, 10):
        alpha = int(100 * (1 - r/10))
        d.ellipse([14-r, y-r, 14+r, y+r], outline=(E_ORB[0], E_ORB[1], E_ORB[2], alpha))

    # Hood
    d.rectangle([20, y+2, 44, y+22], fill=E_HOOD)
    # Hood shadow inside
    d.rectangle([23, y+6, 41, y+20], fill=(0, 0, 0, 200))

    # Eyes (glowing, ominous)
    d.ellipse([25, y+8, 31, y+14], fill=E_EYES)
    d.ellipse([33, y+8, 39, y+14], fill=E_EYES)
    # Eye inner bright
    d.ellipse([27, y+10, 29, y+12], fill=(255, 200, 200, 255))
    d.ellipse([35, y+10, 37, y+12], fill=(255, 200, 200, 255))

def enemy_body_up(d, frame_idx=0):
    """Enemy facing up."""
    bob = [0,1,0,-1,0,1][frame_idx % 6]
    y = 12 + bob - 2

    enemy_shadow(d, oy=62)

    # Robe back
    d.rectangle([22, y+18, 42, y+50], fill=E_ROBE_D)
    d.rectangle([22, y+38, 42, y+50], fill=(20, 3, 30, 255))
    d.rectangle([14, y+24, 22, y+50], fill=E_ROBE_D)
    d.rectangle([42, y+24, 50, y+50], fill=E_ROBE_D)

    # Tendrils
    for i in range(3):
        px = 24 + i*8
        d.rectangle([px, y+48, px+4, y+56], fill=(E_ROBE[0], E_ROBE[1], E_ROBE[2], 130))

    # Staff
    d.rectangle([13, y+8, 16, y+50], fill=E_BONE)
    d.ellipse([8, y+2, 20, y+12], fill=E_BONE)
    d.ellipse([9, y-5, 19, y+5], fill=E_ORB)

    # Hood back
    d.rectangle([20, y+2, 44, y+22], fill=E_HOOD)

def enemy_body_side(d, frame_idx=0):
    """Enemy facing right."""
    bob = [0,1,0,-1,0,1][frame_idx % 6]
    float_bob = bob - 2
    y = 12 + float_bob

    enemy_shadow(d, rx=14, oy=62)

    # Robe
    d.rectangle([26, y+18, 46, y+50], fill=E_ROBE)
    d.rectangle([26, y+38, 46, y+50], fill=E_ROBE_D)
    d.rectangle([18, y+24, 26, y+50], fill=E_ROBE_D)  # back cloak

    # Tendrils
    d.rectangle([28, y+48, 32, y+56], fill=(E_ROBE[0], E_ROBE[1], E_ROBE[2], 150))
    d.rectangle([36, y+48, 40, y+56], fill=(E_ROBE[0], E_ROBE[1], E_ROBE[2], 130))

    # Staff (raised)
    d.rectangle([44, y+4, 47, y+48], fill=E_BONE)
    d.ellipse([40, y-2, 51, y+10], fill=E_BONE)
    d.ellipse([41, y-8, 50, y+1], fill=E_ORB)
    # Orb glow
    for r in range(4, 8):
        alpha = int(120 * (1 - r/8))
        d.ellipse([45-r, y-4-r, 45+r, y-4+r], outline=(E_ORB[0], E_ORB[1], E_ORB[2], alpha))

    # Hood
    d.rectangle([26, y+2, 48, y+22], fill=E_HOOD)
    d.rectangle([26, y+6, 44, y+20], fill=(0, 0, 0, 200))

    # Side eye
    d.ellipse([42, y+9, 46, y+14], fill=E_EYES)
    d.ellipse([43, y+10, 45, y+13], fill=(255, 200, 200, 255))

def enemy_attack(d, frame_idx=0):
    """Enemy attack pose — launching dark energy."""
    lunge = [0, -3, -6, -8, -5, -2][frame_idx % 6]  # lunges left (toward hero)
    y = 10

    enemy_shadow(d, ox=32+lunge//2, oy=62)

    # Robe
    d.rectangle([22+lunge, y+18, 42+lunge, y+50], fill=E_ROBE)
    d.rectangle([22+lunge, y+38, 42+lunge, y+50], fill=E_ROBE_D)
    d.rectangle([14+lunge, y+24, 22+lunge, y+50], fill=E_ROBE)
    d.rectangle([42+lunge, y+24, 50+lunge, y+50], fill=E_ROBE)

    # Extended casting arms (both raised)
    arm_ext = abs(lunge) + 6
    d.rectangle([8+lunge-arm_ext, y+18, 22+lunge, y+28], fill=E_ROBE)
    d.rectangle([8+lunge-arm_ext-4, y+18, 8+lunge-arm_ext+4, y+28], fill=E_SKIN)
    # Dark energy blast
    blast_x = 8 + lunge - arm_ext - 4
    blast_r = 6 + frame_idx * 2
    d.ellipse([blast_x-blast_r, y+16-blast_r, blast_x+blast_r, y+28+blast_r], fill=(80, 0, 120, 180))
    d.ellipse([blast_x-blast_r//2, y+20-blast_r//2, blast_x+blast_r//2, y+24+blast_r//2], fill=(180, 60, 255, 255))

    # Staff raised overhead
    d.rectangle([13+lunge, y+2, 16+lunge, y+42], fill=E_BONE)
    d.ellipse([8+lunge, y-4, 20+lunge, y+8], fill=E_BONE)
    d.ellipse([9+lunge, y-10, 19+lunge, y+2], fill=E_ORB)

    # Hood
    d.rectangle([20+lunge, y+2, 44+lunge, y+22], fill=E_HOOD)
    d.rectangle([23+lunge, y+6, 41+lunge, y+20], fill=(0, 0, 0, 200))
    d.ellipse([25+lunge, y+8, 31+lunge, y+14], fill=E_EYES)
    d.ellipse([33+lunge, y+8, 39+lunge, y+14], fill=E_EYES)

def build_enemy_sheet():
    img = make_sheet()

    # Row 39 = WALK SIDE
    for f in range(6):
        draw_frame(img, f, 39, lambda d, fi=f: enemy_body_side(d, fi))

    # Row 40 = WALK DOWN
    for f in range(6):
        draw_frame(img, f, 40, lambda d, fi=f: enemy_body_down(d, fi))

    # Row 41 = WALK UP
    for f in range(6):
        draw_frame(img, f, 41, lambda d, fi=f: enemy_body_up(d, fi))

    # Row 51 = ATTACK
    for f in range(6):
        draw_frame(img, f, 51, lambda d, fi=f: enemy_attack(d, fi))

    return img

# ─────────────────────────────────────────
# Generate and save
# ─────────────────────────────────────────
print("Generating hero sprite sheet...")
hero_sheet = build_hero_sheet()
hero_path = os.path.join(OUT_DIR, 'player_new.png')
hero_sheet.save(hero_path)
print(f"  Saved: {hero_path}  ({hero_sheet.width}x{hero_sheet.height}px)")

print("Generating enemy sprite sheet...")
enemy_sheet = build_enemy_sheet()
enemy_path = os.path.join(OUT_DIR, 'enemy_new.png')
enemy_sheet.save(enemy_path)
print(f"  Saved: {enemy_path}  ({enemy_sheet.width}x{enemy_sheet.height}px)")

print("\nDone! Sheets saved with LPC-compatible row layout:")
print("  Row 39 = walk side  |  Row 40 = walk down  |  Row 41 = walk up  |  Row 51 = attack")
