import { useGameStore } from '../../store/useGameStore';
import { DIFFICULTY_CONFIGS } from '../../types/game.types';

export default function VictoryScreen() {
  const { totalCorrect, totalWrong, difficulty, resetGame } = useGameStore();
  const config = DIFFICULTY_CONFIGS[difficulty];

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-black z-[100] p-4 text-center font-sans">
      
      {/* Celebration Effects (Blocky particles) */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-4 h-4 bg-amber-400"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `blink ${0.5 + Math.random()}s step-end infinite`
            }}
          />
        ))}
      </div>
      
      <div className="relative z-10 bg-black retro-border p-12">
        <h1 className="text-8xl font-black text-amber-400 mb-8 tracking-widest uppercase" style={{ textShadow: '6px 6px 0 #b45309' }}>
          VICTORY
        </h1>
        <p className="text-white text-2xl mb-10 font-bold uppercase tracking-widest">
          MISSION COMPLETE
        </p>

        <div className="bg-black retro-border-amber p-8 max-w-xl mx-auto mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 border-b-4 border-amber-600 pb-4 uppercase tracking-widest">
            PERFORMANCE <span className="text-amber-400 ml-2">({config.label})</span>
          </h2>
          
          <div className="space-y-6 text-left">
            <div className="flex justify-between items-center text-2xl">
              <span className="text-white">CORRECT:</span>
              <span className="font-bold text-emerald-400">{totalCorrect}</span>
            </div>
            <div className="flex justify-between items-center text-2xl">
              <span className="text-white">MISS/TIMEOUT:</span>
              <span className="font-bold text-red-400">{totalWrong}</span>
            </div>
            <div className="flex justify-between items-center text-2xl pt-6 border-t-4 border-amber-900 mt-4">
              <span className="text-white">ACCURACY:</span>
              <span className="font-bold text-amber-400 text-3xl">
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
            px-12 py-5 text-2xl font-bold text-black uppercase tracking-widest
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
