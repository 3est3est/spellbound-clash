import { useEffect, useState } from 'react';
import { useGameStore } from '../../store/useGameStore';

// A lightweight 2D Pokémon-style battle transition: a quick white flash +
// wipe, drawn with plain divs (no 3D). Mounted only during BATTLE_TRANSITION.
export default function BattleTransition() {
  const [phase, setPhase] = useState(0);
  const enterBattle = useGameStore((s) => s.enterBattle);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 120);
    const t2 = setTimeout(() => setPhase(2), 320);
    // After the flash, actually enter the battle so the quiz appears.
    const t3 = setTimeout(() => enterBattle(), 520);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [enterBattle]);

  return (
    <div className="fixed inset-0 z-[180] pointer-events-none flex items-center justify-center">
      {/* expanding white flash */}
      <div
        className="absolute inset-0 bg-white transition-opacity duration-200"
        style={{ opacity: phase >= 1 ? 0 : 1 }}
      />
      {/* center slash bar */}
      <div
        className="bg-[#0b1020] transition-all duration-200"
        style={{
          height: phase === 0 ? '0%' : phase === 1 ? '14%' : '0%',
          width: '100%',
        }}
      />
      {phase < 2 && (
        <div className="font-pixel text-2xl text-[#0b1020] tracking-widest uppercase animate-blink">
          BATTLE!
        </div>
      )}
    </div>
  );
}
