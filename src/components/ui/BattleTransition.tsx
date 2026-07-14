import { useEffect, useState } from 'react';
import { useGameStore } from '../../store/useGameStore';

export default function BattleTransition() {
  const { enterBattle, currentEnemy } = useGameStore();
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    // Phase 0: Flash white
    const t1 = setTimeout(() => setPhase(1), 150);
    // Phase 1: Black bars slide in
    const t2 = setTimeout(() => setPhase(2), 600);
    // Phase 2: Show enemy name
    const t3 = setTimeout(() => setPhase(3), 1400);
    // Phase 3: Transition out → enter battle
    const t4 = setTimeout(() => {
      enterBattle();
    }, 2200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [enterBattle]);

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      {/* Flash overlay */}
      <div
        className={`absolute inset-0 bg-white transition-opacity duration-200 ${
          phase === 0 ? 'opacity-80' : 'opacity-0'
        }`}
      />

      {/* Black bars slide in from top and bottom (Pokémon style) */}
      <div
        className={`absolute top-0 left-0 right-0 bg-slate-950 transition-all duration-500 ease-in-out ${
          phase >= 1 ? 'h-1/2' : 'h-0'
        }`}
      />
      <div
        className={`absolute bottom-0 left-0 right-0 bg-slate-950 transition-all duration-500 ease-in-out ${
          phase >= 1 ? 'h-1/2' : 'h-0'
        }`}
      />

      {/* Enemy encounter text */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center transition-none z-10 font-sans uppercase tracking-widest ${
          phase >= 2 ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="text-6xl mb-6 animate-blink">⚔️</div>
        <h2 className="font-pixel text-lg font-bold text-white mb-4 bg-black px-6 py-3 retro-border">
          ENEMY ENCOUNTER!
        </h2>
        {currentEnemy && (
          <p className="font-pixel text-sm text-red-500 font-bold bg-black px-4 py-2 retro-border-red animate-blink">
            {currentEnemy.name}
          </p>
        )}
      </div>

      {/* Fade out */}
      <div
        className={`absolute inset-0 bg-slate-950 transition-opacity duration-300 z-20 ${
          phase >= 3 ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />
    </div>
  );
}
