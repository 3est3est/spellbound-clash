// CSS pixel-art heart — no emoji. 8×7 grid of <span> cells.
// The filled/outline pattern is styled in index.css (.pixel-heart.full/.empty).
// Order of cells (row-major), used for the empty-outline pattern too:
//  . . X X . X X .
//  . X X X X X X X
//  X X X X X X X X
//  X X X X X X X X
//  . X X X X X X .
//  . . X X X X . .
//  . . . X X . . .

const CELLS = Array.from({ length: 56 });

export default function PixelHeart({ filled }: { filled: boolean }) {
  return (
    <div className={`pixel-heart ${filled ? 'full' : 'empty'}`}>
      {CELLS.map((_, i) => (
        <span key={i} />
      ))}
    </div>
  );
}
