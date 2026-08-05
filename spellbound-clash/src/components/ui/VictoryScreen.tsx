import { useMemo } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { DIFFICULTY_CONFIGS } from '../../types/game.types';

export default function VictoryScreen() {
  const { totalCorrect, totalWrong, difficulty, gameStartedAt, resetGame, score, coins } =
    useGameStore();
  const config = DIFFICULTY_CONFIGS[difficulty];

  const particles = useMemo(
    () =>
      Array.from({ length: 32 }, (_, i) => ({
        left: (i * 73.1) % 100,
        top: (i * 53.7) % 100,
        dur: 0.8 + (i % 5) * 0.4,
        color: ['#f8a820', '#44cc44', '#ff66aa', '#ffbbee', '#ffffff'][i % 5],
        size: (i % 3) * 2 + 4,
      })),
    []
  );

  const elapsed = gameStartedAt ? Math.max(0, Math.floor((Date.now() - gameStartedAt) / 1000)) : 0;
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');
  const total = totalCorrect + totalWrong;
  const acc = total > 0 ? Math.round((totalCorrect / total) * 100) : 0;

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center z-[100] p-4 text-center"
      style={{ background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(2px)' }}
    >
      {/* Particle background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((p, i) => (
          <div
            key={i}
            className="absolute animate-float"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              background: p.color,
              border: '2px solid #000000',
              animationDuration: `${p.dur}s`,
              opacity: 0.8,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 rpg-panel-pink px-8 py-7 max-w-lg w-full animate-pop-in">
        {/* ดาว */}
        <div className="flex justify-center gap-3 mb-4">
          {['★', '★', '★'].map((s, i) => (
            <span
              key={i}
              className="font-pixel text-4xl animate-float"
              style={{
                color: '#f8a820',
                textShadow: '3px 3px 0 #a31c5d',
                animationDelay: `${i * 0.2}s`,
              }}
            >
              {s}
            </span>
          ))}
        </div>

        {/* Title */}
        <h1
          className="font-pixel font-black mb-1 rpg-title-gold"
          style={{
            fontSize: 'clamp(32px, 7vw, 56px)',
            letterSpacing: '0.05em',
          }}
        >
          ชนะแล้ว!
        </h1>
        <div className="rpg-divider mb-4" />
        
        <p className="font-pixel font-bold text-base mb-5 text-[#a31c5d]">
          คุณเคลียร์ดันเจี้ยนระดับ {config.labelTh} สำเร็จ
        </p>

        {/* สรุปผล */}
        <div className="bg-white/70 border-4 border-[#ff66aa] px-5 py-4 mb-6 text-left shadow-inner">
          <h2 className="font-pixel font-semibold text-center text-sm mb-4 text-[#a31c5d]">
            สรุปผลงาน
          </h2>

          {([
            { label: 'ตอบถูก', value: String(totalCorrect), color: '#006600' },
            { label: 'ตอบผิด', value: String(totalWrong), color: '#cc2222' },
            { label: 'คำถามทั้งหมด', value: String(total), color: '#a31c5d' },
            null,
            { label: 'เวลาที่ใช้', value: `${mm}:${ss}`, color: '#a31c5d' },
            { label: 'ความแม่นยำ', value: `${acc}%`, color: '#a31c5d', big: true },
            null,
            { label: '★ คะแนนรวม', value: score.toLocaleString(), color: '#a31c5d', big: true },
            { label: '🪙 เหรียญที่ได้', value: String(coins), color: '#f8a820' },
          ] as Array<null | { label: string; value: string; color: string; big?: boolean }>)
            .map((row, i) => {
              if (row === null) return <div key={i} className="rpg-divider-thin border-[#ff66aa] my-2" style={{ background: '#ff66aa' }} />;
              return (
                <div key={i} className="flex justify-between items-center py-1">
                  <span className="font-pixel font-semibold text-sm" style={{ color: '#a31c5d' }}>{row.label}</span>
                  <span
                    className="font-pixel font-bold"
                    style={{
                      fontSize: row.big ? '18px' : '14px',
                      color: row.color,
                    }}
                  >
                    {row.value}
                  </span>
                </div>
              );
            })}
        </div>

        <button
          onClick={resetGame}
          className="rpg-btn-green py-4 px-10 font-bold text-base w-full shadow-[4px_4px_0_rgba(0,0,0,0.2)]"
        >
          ▶ กลับสู่เมนูหลัก
        </button>
      </div>
    </div>
  );
}
