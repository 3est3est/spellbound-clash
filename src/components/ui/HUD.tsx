import { useGameStore } from '../../store/useGameStore';
import PixelHeart from './PixelHeart';

export default function HUD() {
  const { playerHP, maxPlayerHP, enemiesDefeated, totalEnemies, difficulty } = useGameStore();

  const diffLabel = { EASY: 'EASY', MEDIUM: 'MEDIUM', HARD: 'HARD' }[difficulty];
  const diffColor = { EASY: 'text-emerald-400', MEDIUM: 'text-amber-400', HARD: 'text-red-400' }[difficulty];

  return (
    <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none p-4">
      <div className="flex items-center justify-between gap-4">

        {/* Player HP */}
        <div className="bg-black retro-border px-5 py-3 flex flex-col gap-2 w-64">
          <div className="flex justify-between font-pixel text-[10px] font-bold tracking-widest text-white">
            <span>HP</span>
            <span>{playerHP} / {maxPlayerHP}</span>
          </div>
          <div className="flex gap-1 flex-wrap">
            {Array.from({ length: maxPlayerHP }).map((_, i) => (
              <PixelHeart key={i} filled={i < playerHP} />
            ))}
          </div>
        </div>

        {/* Enemies Defeated */}
        <div className="bg-black retro-border px-5 py-3 flex items-center gap-4">
          <span className="font-pixel text-white font-bold text-[10px] tracking-widest leading-relaxed">
            FOE <span className="text-red-400">{enemiesDefeated}</span>/{totalEnemies}
          </span>
          <div className="w-1 h-5 bg-white" />
          <div className={`font-pixel font-bold text-[10px] tracking-widest ${diffColor}`}>
            {diffLabel}
          </div>
        </div>

      </div>

      {/* Pause hint */}
      <div className="absolute top-4 right-1/2 translate-x-1/2 mt-1 pointer-events-none">
        <span className="font-pixel text-[8px] text-slate-400 tracking-widest uppercase">
          [ESC] MENU
        </span>
      </div>
    </div>
  );
}
