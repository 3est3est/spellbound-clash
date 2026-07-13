import { useGameStore } from '../../store/useGameStore';

export default function HUD() {
  const { playerHP, maxPlayerHP, enemiesDefeated, totalEnemies, difficulty } = useGameStore();

  const diffLabel = { EASY: 'EASY', MEDIUM: 'MEDIUM', HARD: 'HARD' }[difficulty];
  const diffColor = { EASY: 'text-emerald-400', MEDIUM: 'text-amber-400', HARD: 'text-red-400' }[difficulty];

  return (
    <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none p-4">
      <div className="flex items-center justify-between">
        
        {/* Player HP */}
        <div className="bg-black retro-border px-6 py-4 flex items-center gap-3">
          <span className="text-xl text-white font-bold tracking-widest mr-2">HP:</span>
          <div className="flex gap-1">
            {Array.from({ length: maxPlayerHP }).map((_, i) => (
              <span
                key={i}
                className={`text-2xl transition-none ${
                  i < playerHP ? 'opacity-100' : 'opacity-30 grayscale'
                }`}
              >
                {i < playerHP ? '❤️' : '🖤'}
              </span>
            ))}
          </div>
        </div>

        {/* Enemies Defeated */}
        <div className="bg-black retro-border px-6 py-4 flex items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="text-white font-bold text-xl tracking-widest">
              ENEMIES: <span className="text-red-400">{enemiesDefeated}</span>/{totalEnemies}
            </span>
          </div>
          <div className="w-1 h-6 bg-white" />
          <div className={`font-bold text-xl tracking-widest ${diffColor}`}>
            {diffLabel}
          </div>
        </div>
        
      </div>
    </div>
  );
}
