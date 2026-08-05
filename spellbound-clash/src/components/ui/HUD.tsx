import { useGameStore } from '../../store/useGameStore';
import PixelHeart from './PixelHeart';

export default function HUD() {
  const { playerHP, maxPlayerHP, enemiesDefeated, totalEnemies, difficulty, coins, score } = useGameStore();

  const diffLabel = { EASY: 'ง่าย', MEDIUM: 'กลาง', HARDCORE: 'ยาก' }[difficulty];
  const diffColor = { EASY: '#60d860', MEDIUM: '#f5c842', HARDCORE: '#ff6050' }[difficulty];

  // Use simple text shadows to make text readable without a panel background
  const textShadowStyle = { textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none p-4">
      <div className="flex items-start justify-between">

        {/* ── ซ้าย: เลือด ── */}
        <div className="flex flex-col gap-2 animate-slide-down">
          {/* Hearts only, no bar, no panel */}
          <div className="flex items-center gap-2">
            <span
              className="font-pixel font-bold text-lg"
              style={{ color: '#ff6090', ...textShadowStyle }}
            >
              HP
            </span>
            <div className="flex gap-1 flex-wrap" style={{ maxWidth: '150px' }}>
              {Array.from({ length: maxPlayerHP }).map((_, i) => (
                <PixelHeart key={i} filled={i < playerHP} />
              ))}
            </div>
            <span className="font-pixel text-sm" style={{ color: '#ffffff', ...textShadowStyle }}>
              {playerHP}/{maxPlayerHP}
            </span>
          </div>

          {/* คะแนน */}
          <div className="flex items-center gap-2 mt-1">
            <span className="font-pixel text-sm" style={{ color: '#f5c842', ...textShadowStyle }}>★</span>
            <span
              className="font-pixel font-bold text-sm"
              style={{ color: '#ffffff', ...textShadowStyle }}
            >
              {score.toLocaleString()}
            </span>
          </div>
        </div>

        {/* ── ขวา: ศัตรู + เหรียญ + ระดับ ── */}
        <div className="flex gap-6 animate-slide-down">
          {/* ศัตรู */}
          <div className="flex flex-col items-center gap-1">
            <span className="font-pixel text-xs" style={{ color: '#ff7060', ...textShadowStyle }}>
              ปราบ
            </span>
            <span className="font-pixel font-bold text-sm">
              <span style={{ color: '#ffffff', ...textShadowStyle }}>{enemiesDefeated}</span>
              <span style={{ color: '#aaaaaa', ...textShadowStyle }}>/</span>
              <span style={{ color: '#ffffff', ...textShadowStyle }}>{totalEnemies}</span>
            </span>
          </div>

          {/* เหรียญ */}
          <div className="flex flex-col items-center gap-1">
            <span className="font-pixel text-xs" style={{ color: '#f5c842', ...textShadowStyle }}>
              เหรียญ
            </span>
            <span
              className="font-pixel font-bold text-sm"
              style={{ color: '#ffffff', ...textShadowStyle }}
            >
              {coins}
            </span>
          </div>

          {/* ระดับความยาก */}
          <div className="flex flex-col items-center gap-1">
            <span className="font-pixel text-xs" style={{ color: '#b0d8ff', ...textShadowStyle }}>
              ระดับ
            </span>
            <span
              className="font-pixel font-bold text-sm"
              style={{ color: diffColor, ...textShadowStyle }}
            >
              {diffLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
