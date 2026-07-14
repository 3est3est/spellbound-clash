import { useGameStore } from '../../store/useGameStore';

export default function HUD() {
  const { playerHP, maxPlayerHP, enemiesDefeated, totalEnemies, difficulty } = useGameStore();

  const diffLabel = { EASY: 'EASY', MEDIUM: 'MEDIUM', HARD: 'HARD' }[difficulty];
  const diffColor = { EASY: 'text-emerald-400', MEDIUM: 'text-amber-400', HARD: 'text-red-400' }[difficulty];

  return (
    <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none p-4">
      <div className="flex items-center justify-between">
        
        {/* Player HP */}
        <div className="bg-black retro-border px-6 py-4 flex flex-col gap-2 w-64">
          <div className="flex justify-between font-pixel text-[10px] font-bold tracking-widest text-white">
            <span>HP</span>
            <span>{playerHP} / {maxPlayerHP}</span>
          </div>
          <div className="w-full h-4 border-2 border-white bg-slate-900 p-[2px]">
            <div
              className={`h-full transition-all duration-300 ${
                (playerHP / maxPlayerHP) <= 0.2
                  ? 'bg-red-500'
                  : (playerHP / maxPlayerHP) <= 0.5
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${(playerHP / maxPlayerHP) * 100}%` }}
            />
          </div>
        </div>

        {/* Enemies Defeated */}
        <div className="bg-black retro-border px-6 py-4 flex items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="font-pixel text-white font-bold text-[10px] tracking-widest leading-relaxed">
              ENEMIES: <span className="text-red-400">{enemiesDefeated}</span>/{totalEnemies}
            </span>
          </div>
          <div className="w-1 h-6 bg-white" />
          <div className={`font-pixel font-bold text-[10px] tracking-widest ${diffColor}`}>
            {diffLabel}
          </div>
        </div>
        
      </div>
    </div>
  );
}
