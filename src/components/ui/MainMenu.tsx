import { useGameStore } from '../../store/useGameStore';
import { DIFFICULTY_CONFIGS, type Difficulty } from '../../types/game.types';

const difficulties: Difficulty[] = ['EASY', 'MEDIUM', 'HARD'];

const difficultyPanel: Record<Difficulty, string> = {
  EASY: 'border-emerald-700',
  MEDIUM: 'border-amber-600',
  HARD: 'border-red-700',
};

export default function MainMenu() {
  const { difficulty, setDifficulty, startGame } = useGameStore();

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center rpg-backdrop overflow-hidden font-sans p-4">
      {/* Title plaque */}
      <div className="text-center mb-10 relative z-10">
        <div className="rpg-panel px-10 py-6 inline-block">
          <h1 className="font-pixel text-4xl sm:text-5xl font-bold text-[#2b3a8c] mb-3 uppercase tracking-widest leading-relaxed rpg-title-dark">
            <span className="rpg-star">★</span> Spellbound <span className="rpg-star">★</span>
            <br />
            Clash
          </h1>
          <div className="rpg-divider mt-3" />
          <p className="font-pixel text-[#3a2a5a] mt-3 text-[11px] uppercase tracking-widest">
            - เลือกความยาก -
          </p>
        </div>
      </div>

      {/* Difficulty Selection */}
      <div className="flex flex-wrap gap-6 mb-10 relative z-10 justify-center">
        {difficulties.map((diff) => {
          const config = DIFFICULTY_CONFIGS[diff];
          const isSelected = difficulty === diff;

          return (
            <button
              key={diff}
              onClick={() => setDifficulty(diff)}
              className={`
                relative w-56 p-5 transition-none cursor-pointer rpg-panel
                ${difficultyPanel[diff]}
                ${isSelected ? 'scale-105 z-20' : 'opacity-70 grayscale hover:grayscale-0'}
              `}
            >
              {isSelected && (
                <div className="absolute -top-5 -left-5 text-[#c0392b] text-3xl animate-blink drop-shadow-[2px_2px_0_#000]">
                  ▶
                </div>
              )}

              <div className="text-center">
                <h3 className="font-pixel text-sm font-bold uppercase mb-3 leading-relaxed text-[#2b3a8c]">
                  {config.label}
                </h3>

                <div className="rpg-divider mb-3" />

                <div className="space-y-2 text-sm text-left">
                  <div className="flex justify-between font-pixel text-[10px] text-[#3a2a5a]">
                    <span>❤ HP:</span>
                    <span className="font-bold">{config.playerHP}</span>
                  </div>
                  <div className="flex justify-between font-pixel text-[10px] text-[#3a2a5a]">
                    <span>👹 FOE:</span>
                    <span className="font-bold">{config.totalEnemies}</span>
                  </div>
                  <div className="flex justify-between font-pixel text-[10px] text-[#3a2a5a]">
                    <span>⏱ TIME:</span>
                    <span className="font-bold">{config.timerSeconds}s</span>
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
        className="font-pixel relative z-10 px-14 py-5 text-sm font-bold rpg-btn rpg-btn-blue uppercase tracking-widest"
      >
        ▶ เริ่มผจญภัย
      </button>

      {/* Footer hint */}
      <p className="font-pixel text-[#2b3a8c] text-[10px] mt-10 relative z-10 uppercase animate-blink drop-shadow-[1px_1px_0_#fff]">
        [ WASD / ลูกศร เพื่อเดิน ]
      </p>
    </div>
  );
}
