import { useGameStore } from '../../store/useGameStore';
import PixelHeart from './PixelHeart';

export default function HUD() {
  const { playerHP, maxPlayerHP, enemiesDefeated, totalEnemies, difficulty } = useGameStore();

  const diffLabel = { EASY: 'ง่าย', MEDIUM: 'ปานกลาง', HARD: 'ยาก' }[difficulty];
  const diffColor = { EASY: 'text-emerald-300', MEDIUM: 'text-amber-300', HARD: 'text-red-300' }[difficulty];

  return (
    <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none p-3">
      <div className="flex items-start justify-between gap-4">
        {/* Player HP */}
        <div className="rpg-panel px-4 py-2 flex flex-col gap-1 w-auto pointer-events-none">
          <div className="flex justify-between font-pixel text-[10px] font-bold tracking-wide text-[#2b3a8c] gap-4">
            <span>❤ HP</span>
            <span>{playerHP}/{maxPlayerHP}</span>
          </div>
          <div className="flex gap-0.5 flex-wrap">
            {Array.from({ length: maxPlayerHP }).map((_, i) => (
              <PixelHeart key={i} filled={i < playerHP} />
            ))}
          </div>
        </div>

        {/* Enemies Defeated */}
        <div className="rpg-panel px-4 py-2 flex items-center gap-3 pointer-events-none">
          <span className="font-pixel text-[#2b3a8c] font-bold text-[10px] tracking-wide leading-relaxed">
            ศัตรู <span className="text-[#c0392b]">{enemiesDefeated}</span>/{totalEnemies}
          </span>
          <div className="w-1 h-5 bg-[#3a2a5a]" />
          <div className={`font-pixel font-bold text-[10px] tracking-wide ${diffColor}`}>
            {diffLabel}
          </div>
        </div>
      </div>

      {/* Pause hint */}
      <div className="absolute top-3 right-1/2 translate-x-1/2 pointer-events-none">
        <span className="font-pixel text-[8px] text-[#2b3a8c] tracking-widest uppercase drop-shadow-[1px_1px_0_#fff]">
          [ESC] เมนู
        </span>
      </div>
    </div>
  );
}
