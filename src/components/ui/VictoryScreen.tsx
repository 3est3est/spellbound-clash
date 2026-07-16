import { useMemo } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { DIFFICULTY_CONFIGS } from '../../types/game.types';

export default function VictoryScreen() {
  const { totalCorrect, totalWrong, difficulty, gameStartedAt, resetGame } = useGameStore();
  const config = DIFFICULTY_CONFIGS[difficulty];

  // Celebration particles: positions are generated once so they don't
  // re-randomize on every re-render.
  const particles = useMemo(
    () =>
      Array.from({ length: 40 }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        dur: 0.5 + Math.random(),
      })),
    []
  );

  const elapsed = gameStartedAt
    ? Math.max(0, Math.floor((Date.now() - gameStartedAt) / 1000))
    : 0;
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');
  const totalQuestions = totalCorrect + totalWrong;

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-black z-[100] p-4 text-center font-sans">
      
      {/* Celebration Effects (Blocky particles) — positions fixed once via useMemo */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((p, i) => (
          <div
            key={i}
            className="absolute w-4 h-4 bg-amber-400"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              animation: `blink ${p.dur}s step-end infinite`,
            }}
          />
        ))}
      </div>
      
      <div className="relative z-10 bg-black retro-border p-12">
        <h1 className="font-pixel text-4xl sm:text-5xl font-black text-amber-400 mb-8 tracking-widest uppercase" style={{ textShadow: '6px 6px 0 #b45309' }}>
          VICTORY
        </h1>
        <p className="font-pixel text-white text-xs mb-10 font-bold uppercase tracking-widest">
          MISSION COMPLETE
        </p>

        <div className="bg-black retro-border-amber p-8 max-w-xl mx-auto mb-12">
          <h2 className="font-pixel text-xs font-bold text-white mb-6 border-b-4 border-amber-600 pb-4 uppercase tracking-widest">
            PERFORMANCE <span className="text-amber-400 ml-2">({config.label})</span>
          </h2>

          <div className="space-y-6 text-left">
            <div className="flex justify-between items-center font-pixel text-[11px]">
              <span className="text-white">CORRECT:</span>
              <span className="font-bold text-emerald-400">{totalCorrect}</span>
            </div>
            <div className="flex justify-between items-center font-pixel text-[11px]">
              <span className="text-white">MISS/TIMEOUT:</span>
              <span className="font-bold text-red-400">{totalWrong}</span>
            </div>
            <div className="flex justify-between items-center font-pixel text-[11px]">
              <span className="text-white">QUESTIONS:</span>
              <span className="font-bold text-slate-200">{totalQuestions}</span>
            </div>
            <div className="flex justify-between items-center font-pixel text-[11px]">
              <span className="text-white">TIME:</span>
              <span className="font-bold text-slate-200">{mm}:{ss}</span>
            </div>
            <div className="flex justify-between items-center font-pixel text-[11px] pt-6 border-t-4 border-amber-900 mt-4">
              <span className="text-white">ACCURACY:</span>
              <span className="font-bold text-amber-400 text-sm">
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
            font-pixel px-10 py-5 text-sm font-bold text-black uppercase tracking-widest
            bg-amber-400 retro-border-amber
            hover:bg-amber-300
            active:translate-y-1 active:translate-x-1 active:shadow-none
            transition-none cursor-pointer animate-blink
          "
        >
          [ PLAY AGAIN ]
        </button>
      </div>
    </div>
  );
}
