// Classic 8×7 pixel heart — rendered as colored pixel blocks.
// Only the heart-shaped cells are colored; background is transparent.

const HEART_CELLS = new Set([
  2,3,5,6,           // row 0
  9,10,11,12,13,14,15, // row 1
  16,17,18,19,20,21,22,23, // row 2
  24,25,26,27,28,29,30,31, // row 3
  33,34,35,36,37,38,  // row 4
  42,43,44,45,        // row 5
  51,52,              // row 6
]);

const HIGHLIGHT_CELLS = new Set([2, 5, 9, 10, 13]);
const SHADOW_CELLS = new Set([22, 23, 30, 31, 38, 45, 52]);

export default function PixelHeart({ filled, color }: { filled: boolean; color?: string }) {
  const baseColor = color || '#ee3377';
  
  // Simple darkening function for shadow
  const getShadowColor = (hex: string) => {
    if (hex === '#ff6050') return '#aa2222'; // specific mapping for enemy red
    return '#aa2255'; // default dark pink
  };
  
  // Simple lightening function for highlight
  const getHighlightColor = (hex: string) => {
    if (hex === '#ff6050') return '#ff9988'; // specific mapping for enemy red
    return '#ff99cc'; // default light pink
  };

  return (
    <div
      className={`inline-grid grid-cols-8 gap-0 ${filled ? '' : 'opacity-25'}`}
      style={{ imageRendering: 'pixelated' }}
    >
      {Array.from({ length: 56 }, (_, i) => {
        if (!HEART_CELLS.has(i)) return <span key={i} className="w-[3px] h-[3px]" />;
        const isHighlight = filled && HIGHLIGHT_CELLS.has(i);
        const isShadow = filled && SHADOW_CELLS.has(i);
        const bg = isHighlight ? getHighlightColor(baseColor) : isShadow ? getShadowColor(baseColor) : filled ? baseColor : '#553355';
        return (
          <span
            key={i}
            className="w-[3px] h-[3px]"
            style={{ background: bg, imageRendering: 'pixelated' }}
          />
        );
      })}
    </div>
  );
}
