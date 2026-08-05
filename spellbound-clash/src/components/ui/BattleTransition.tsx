import { useEffect, useState } from 'react';
import { useGameStore } from '../../store/useGameStore';

export default function BattleTransition() {
  const [phase, setPhase] = useState(0);
  const enterBattle = useGameStore((s) => s.enterBattle);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 100);
    const t2 = setTimeout(() => setPhase(2), 350);
    const t3 = setTimeout(() => setPhase(3), 500);
    const t4 = setTimeout(() => enterBattle(), 650);
    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4);
    };
  }, [enterBattle]);

  return (
    <div className="fixed inset-0 z-[180] pointer-events-none overflow-hidden">
      {/* Flash ขาว */}
      <div
        className="absolute inset-0 bg-white"
        style={{
          opacity: phase === 0 ? 1 : 0,
          transition: 'opacity 0.1s ease-out',
        }}
      />

      {/* แถบกวาดบน สีดำ */}
      <div
        className="absolute left-0 right-0 top-0"
        style={{
          background: '#000000',
          borderBottom: '8px solid #333333',
          height: phase >= 1 ? '50%' : '0%',
          transition: 'height 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />

      {/* แถบกวาดล่าง สีดำ */}
      <div
        className="absolute left-0 right-0 bottom-0"
        style={{
          background: '#000000',
          borderTop: '8px solid #333333',
          height: phase >= 1 ? '50%' : '0%',
          transition: 'height 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />

      {/* ตัวหนังสือตรงกลาง */}
      {phase >= 1 && phase < 3 && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div
            className="font-pixel font-black animate-pop-in rpg-title-gold"
            style={{
              fontSize: 'clamp(32px, 7vw, 56px)',
              letterSpacing: '0.05em',
            }}
          >
            ⚔ ปะทะศัตรู! ⚔
          </div>
        </div>
      )}
    </div>
  );
}
