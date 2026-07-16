import { useGameStore } from '../../store/useGameStore';

export default function GameOver() {
  const { totalCorrect, totalWrong, enemiesDefeated, totalEnemies, gameStartedAt, resetGame } = useGameStore();

  const elapsed = gameStartedAt
    ? Math.max(0, Math.floor((Date.now() - gameStartedAt) / 1000))
    : 0;
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-black z-[100] p-4 text-center font-sans">
      
      <div className="relative z-10">
        <h1 className="font-pixel text-3xl sm:text-4xl font-black text-red-600 mb-8 tracking-widest uppercase" style={{ textShadow: '6px 6px 0 #333' }}>
          Game Over
        </h1>

        <div className="bg-black retro-border-red p-10 max-w-xl mx-auto mb-12">
          <h2 className="font-pixel text-sm font-bold text-white mb-8 border-b-4 border-white pb-4 uppercase tracking-widest">
            BATTLE STATS
          </h2>

          <div className="space-y-6 text-left">
            <div className="flex justify-between items-center font-pixel text-[11px]">
              <span className="text-white">ENEMIES DEFEATED:</span>
              <span className="font-bold text-red-400">{enemiesDefeated} / {totalEnemies}</span>
            </div>
            <div className="flex justify-between items-center font-pixel text-[11px]">
              <span className="text-white">CORRECT:</span>
              <span className="font-bold text-emerald-400">{totalCorrect}</span>
            </div>
            <div className="flex justify-between items-center font-pixel text-[11px]">
              <span className="text-white">MISS/TIMEOUT:</span>
              <span className="font-bold text-red-400">{totalWrong}</span>
            </div>
            <div className="flex justify-between items-center font-pixel text-[11px] pt-6 border-t-4 border-slate-700 mt-4">
              <span className="text-white">TIME:</span>
              <span className="font-bold text-amber-400">{mm}:{ss}</span>
            </div>
            <div className="flex justify-between items-center font-pixel text-[11px] pt-6 border-t-4 border-slate-700 mt-4">
              <span className="text-white">ACCURACY:</span>
              <span className="font-bold text-amber-400">
                {totalCorrect + totalWrong > 0
                  ? Math.round((totalCorrect / (totalCorrect + totalWrong)) * 100)
                  : 0}%
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={resetGame}
          className="
            font-pixel px-10 py-5 text-sm font-bold text-white uppercase tracking-widest
            bg-red-600 retro-border-red
            hover:bg-red-500 hover:text-white
            active:translate-y-1 active:translate-x-1 active:shadow-none
            transition-none cursor-pointer animate-blink
          "
        >
          [ TRY AGAIN ]
        </button>
      </div>
    </div>
  );
}
