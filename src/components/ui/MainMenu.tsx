import { useGameStore } from '../../store/useGameStore';
import { DIFFICULTY_CONFIGS, type Difficulty } from '../../types/game.types';

const difficulties: Difficulty[] = ['EASY', 'MEDIUM', 'HARD'];

const difficultyClasses: Record<Difficulty, string> = {
  EASY: 'bg-emerald-900 retro-border-emerald hover:bg-emerald-800 text-white',
  MEDIUM: 'bg-amber-900 retro-border-amber hover:bg-amber-800 text-white',
  HARD: 'bg-red-900 retro-border-red hover:bg-red-800 text-white',
};

export default function MainMenu() {
  const { difficulty, setDifficulty, startGame } = useGameStore();

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-black overflow-hidden font-sans">
      
      {/* Title */}
      <div className="text-center mb-12 relative z-10">
        <h1 className="font-pixel text-4xl sm:text-5xl font-bold text-white mb-4 uppercase tracking-widest leading-relaxed" style={{ textShadow: '4px 4px 0 #333' }}>
          Spellbound
          <br/>
          Clash
        </h1>
        <p className="font-pixel text-slate-400 mt-4 text-xs uppercase tracking-widest">
          - Select Difficulty -
        </p>
      </div>

      {/* Difficulty Selection */}
      <div className="flex gap-8 mb-12 relative z-10">
        {difficulties.map((diff) => {
          const config = DIFFICULTY_CONFIGS[diff];
          const isSelected = difficulty === diff;

          return (
            <button
              key={diff}
              onClick={() => setDifficulty(diff)}
              className={`
                relative w-56 p-6 transition-none cursor-pointer
                ${difficultyClasses[diff]}
                ${isSelected ? 'scale-110 z-20 retro-border' : 'opacity-60 grayscale hover:grayscale-0'}
              `}
            >
              {isSelected && (
                <div className="absolute -top-4 -left-4 text-white text-2xl animate-blink">
                  ▶
                </div>
              )}

              <div className="text-center">
                <h3 className="font-pixel text-sm font-bold uppercase mb-2 leading-relaxed">{config.label}</h3>

                <div className="space-y-3 text-sm text-left mt-6 bg-black/50 p-4 retro-border">
                  <div className="flex justify-between font-pixel text-[10px]">
                    <span>HP:</span>
                    <span>{config.playerHP}</span>
                  </div>
                  <div className="flex justify-between font-pixel text-[10px]">
                    <span>ENEMIES:</span>
                    <span>{config.totalEnemies}</span>
                  </div>
                  <div className="flex justify-between font-pixel text-[10px]">
                    <span>TIME:</span>
                    <span>{config.timerSeconds}s</span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Start Button */}
      <button
        onClick={startGame}
        className="
          font-pixel relative z-10 px-12 py-5 text-sm font-bold
          bg-white text-black retro-border
          hover:bg-slate-200 active:translate-y-1 active:translate-x-1 active:shadow-none
          cursor-pointer uppercase tracking-widest transition-none
        "
        style={{ boxShadow: '6px 6px 0px 0px rgba(255,255,255,0.2)' }}
      >
        Start Game
      </button>

      {/* Footer hint */}
      <p className="font-pixel text-slate-500 text-[10px] mt-12 relative z-10 uppercase animate-blink">
        [ USE WASD TO MOVE ]
      </p>
    </div>
  );
}
