import sys
from PIL import Image

def main():
    walk_img = Image.open('public/sprites/craftpix-net-208004-free-vampire-4-direction-pixel-character-sprite-pack/PNG/Vampires1/With_shadow/Vampires1_Walk_with_shadow.png')
    attack_img = Image.open('public/sprites/craftpix-net-208004-free-vampire-4-direction-pixel-character-sprite-pack/PNG/Vampires1/With_shadow/Vampires1_Attack_with_shadow.png')

    # Create LPC compatible sheet: 384 x 3328 (6 cols * 64, 52 rows * 64)
    out = Image.new('RGBA', (384, 3328), (0,0,0,0))

    # Assuming vampire sprite rows: 0=Down, 1=Left, 2=Right, 3=Up
    # We want LPC format:
    # Row 39 = Walk Side (Left/Right)
    # Row 40 = Walk Down
    # Row 41 = Walk Up
    # Row 51 = Attack Down (We will use attack side or attack down)

    # Walk Down (Row 0 of Vampire -> Row 40 of LPC)
    out.paste(walk_img.crop((0, 0, 384, 64)), (0, 40*64))
    
    # Walk Up (Row 3 of Vampire -> Row 41 of LPC)
    out.paste(walk_img.crop((0, 192, 384, 256)), (0, 41*64))
    
    # Walk Side (Row 2 of Vampire, which is Right, -> Row 39 of LPC)
    out.paste(walk_img.crop((0, 128, 384, 192)), (0, 39*64))

    # Attack Side (Row 2 of Vampire Attack, Right -> Row 51 of LPC, wait we should map Attack Side to Attack Side?)
    # Wait, the game uses LPC_ATTACK.down (row 51) for the enemy's attack.
    # We want the enemy to attack left in battle.
    # We can paste Attack Right (row 2) into Row 51, and GameCanvas flips it!
    out.paste(attack_img.crop((0, 128, 384, 192)), (0, 51*64))

    out.save('public/sprites/enemy.png')
    print("Vampire sprite stitched to public/sprites/enemy.png")

if __name__ == '__main__':
    main()
