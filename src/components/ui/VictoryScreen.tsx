import { useMemo } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { DIFFICULTY_CONFIGS } from '../../types/game.types';

export default function VictoryScreen() {
  const { totalCorrect, totalWrong, difficulty, gameStartedAt, resetGame } = useGameStore();
  const config = DIFFICULTY_CONFIGS[difficulty];

  const particles = useMemo(
    () =>
      Array.from({ length: 40 }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        dur: 0.5 + Math.random(),
        color: ['#f4c430', '#2e8b57', '#2b3a8c', '#c0392b'][Math.floor(Math.random() * 4)],
      })),
    []
  );

  const elapsed = gameStartedAt
    ? Math.max(0, Math.floor((Date.now() - gameStartedAt) / 1000))
    : 0;
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');
  const total = totalCorrect + totalWrong;
  const acc = total > 0 ? Math.round((totalCorrect / total) * 100) : 0;

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center rpg-backdrop z-[100] p-4 text-center font-sans">
      {/* Celebration particles */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((p, i) => (
          <div
            key={i}
            className="absolute w-3 h-3"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              background: p.color,
              animation: `blink ${p.dur}s step-end infinite`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 rpg-panel px-10 py-8 max-w-xl w-full">
        <h1 className="font-pixel text-4xl sm:text-5xl font-black text-[#f4c430] mb-3 tracking-widest uppercase rpg-title-dark">
          <span className="rpg-star">★</span> VICTORY <span className="rpg-star">★</span>
        </h1>
        <div className="rpg-divider mb-5" />
        <p className="font-pixel text-[#2b3a8c] text-xs mb-6 font-bold uppercase tracking-widest">
          ผจญภัยสำเร็จ!
        </p>

        <div className="rpg-panel-blue p-6 mb-6">
          <h2 className="font-pixel text-xs font-bold text-[#fdf3d8] mb-5 uppercase tracking-widest">
            ผลงาน <span className="text-[#f4c430] ml-2">({config.label})</span>
          </h2>

          <div className="space-y-3 text-left">
            <div className="flex justify-between items-center font-pixel text-[11px] text-[#fdf3d8]">
              <span>ตอบถูก:</span>
              <span className="font-bold text-emerald-300">{totalCorrect}</span>
            </div>
            <div className="flex justify-between items-center font-pixel text-[11px] text-[#fdf3d8]">
              <span>ผิด/หมดเวลา:</span>
              <span className="font-bold text-red-300">{totalWrong}</span>
            </div>
            <div className="flex justify-between items-center font-pixel text-[11px] text-[#fdf3d8]">
              <span>ข้อทั้งหมด:</span>
              <span className="font-bold">{total}</span>
            </div>
            <div className="rpg-divider" />
            <div className="flex justify-between items-center font-pixel text-[11px] text-[#fdf3d8]">
              <span>เวลา:</span>
              <span className="font-bold">{mm}:{ss}</span>
            </div>
            <div className="flex justify-between items-center font-pixel text-[11px] text-[#fdf3d8]">
              <span>ความแม่นยำ:</span>
              <span className="font-bold text-[#f4c430] text-sm">{acc}%</span>
            </div>
          </div>
        </div>

        <button
          onClick={resetGame}
          className="font-pixel px-10 py-4 text-sm font-bold rpg-btn rpg-btn-blue uppercase tracking-widest animate-blink"
        >
          [ เล่นอีกครั้ง ]
        </button>
      </div>
    </div>
  );
}
