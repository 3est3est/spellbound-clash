import { useGameStore } from '../../store/useGameStore';
import PixelHeart from './PixelHeart';

export default function HUD() {
  const { playerHP, maxPlayerHP, difficulty, coins, score, unlockedZones, adminMode } = useGameStore();

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

          {/* คะแนน & เหรียญ */}
          <div className="flex items-center gap-4 mt-1">
            <div className="flex items-center gap-1">
              <span className="font-pixel text-sm" style={{ color: '#f5c842', ...textShadowStyle }}>★</span>
              <span
                className="font-pixel font-bold text-sm"
                style={{ color: '#ffffff', ...textShadowStyle }}
              >
                {score.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-pixel text-sm" style={{ color: '#f5c842', ...textShadowStyle }}>🪙</span>
              <span
                className="font-pixel font-bold text-sm"
                style={{ color: '#ffffff', ...textShadowStyle }}
              >
                {coins.toLocaleString()}
              </span>
            </div>
            {adminMode && (
              <button
                onClick={() => useGameStore.getState().adminAddCoins(100)}
                title="Admin: เพิ่มเหรียญ +100"
                className="pointer-events-auto flex items-center gap-1 bg-[#2a2418] hover:bg-[#3a3325] border-2 border-[#f5d87a] text-[#f5d87a] px-2 py-0.5 rounded cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-[2px_2px_0_rgba(0,0,0,0.5)] font-pixel text-[10px]"
              >
                ⭐ +100 🪙
              </button>
            )}
          </div>

          {/* ปุ่มกระเป๋าสัตว์เลี้ยง & ร้านค้า */}
          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={() => useGameStore.getState().setInventoryOpen(true)}
              className="pointer-events-auto flex items-center gap-2 bg-[#2a2418] hover:bg-[#3a3325] border-4 border-[#6b4423] outline outline-4 outline-[#1c5f33] -outline-offset-8 px-3 py-1 cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-[3px_3px_0_rgba(0,0,0,0.5)]"
            >
              <span className="text-sm">🎒</span>
              <span className="font-pixel text-[9px] font-bold text-[#e8c04a]">กระเป๋าเป้</span>
            </button>
            {unlockedZones.includes(2) && (
              <button
                onClick={() => useGameStore.getState().setShopOpen(true)}
                className="pointer-events-auto flex items-center gap-2 bg-[#2a2418] hover:bg-[#3a3325] border-4 border-[#6b4423] outline outline-4 outline-[#1c5f33] -outline-offset-8 px-3 py-1 cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-[3px_3px_0_rgba(0,0,0,0.5)]"
              >
                <span className="text-sm">🛒</span>
                <span className="font-pixel text-[9px] font-bold text-[#e8c04a]">ร้านค้า</span>
              </button>
            )}
          </div>
        </div>

        {/* ── ขวา: ปุ่มหยุดเกม + ระดับ ── */}
        <div className="flex items-center gap-4 animate-slide-down">
          {adminMode && (
            <div className="flex flex-col items-center gap-1 justify-center">
              <span className="font-pixel font-bold text-[10px]" style={{ color: '#f5d87a', textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000' }}>
                ⭐ ADMIN
              </span>
            </div>
          )}
          {/* ระดับความยาก */}
          <div className="flex flex-col items-center gap-1 justify-center">
            <span className="font-pixel text-[10px]" style={{ color: '#b0d8ff', ...textShadowStyle }}>
              ระดับ
            </span>
            <span
              className="font-pixel font-bold text-xs"
              style={{ color: diffColor, ...textShadowStyle }}
            >
              {diffLabel}
            </span>
          </div>

          {/* ปุ่มหยุดเกม */}
          <button
            onClick={() => useGameStore.getState().setIsPaused(true)}
            className="pointer-events-auto w-10 h-10 flex items-center justify-center bg-[#1e1b18] hover:bg-[#322d28] border-2 border-[#ffd700] cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-[2px_2px_0_rgba(0,0,0,0.3)]"
            title="หยุดเกม (Esc)"
          >
            <span className="text-base text-[#ffd700] font-bold">⏸</span>
          </button>
        </div>
      </div>
    </div>
  );
}
