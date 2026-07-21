import { useGameStore } from '../../store/useGameStore';
import { DIFFICULTY_CONFIGS } from '../../types/game.types';

export default function GameOver() {
  const { totalCorrect, totalWrong, enemiesDefeated, totalEnemies, difficulty, gameStartedAt, resetGame, score, coins } =
    useGameStore();
  const config = DIFFICULTY_CONFIGS[difficulty];

  const elapsed = gameStartedAt ? Math.max(0, Math.floor((Date.now() - gameStartedAt) / 1000)) : 0;
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');
  const total = totalCorrect + totalWrong;
  const acc = total > 0 ? Math.round((totalCorrect / total) * 100) : 0;

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center z-[100] p-4 text-center"
      style={{ background: 'rgba(0,0,0,0.7)' }}
    >
      <div
        className="relative z-10 rpg-panel-pink px-8 py-7 max-w-lg w-full animate-pop-in"
        style={{ textAlign: 'center' }}
      >
        <h1
          className="font-pixel font-black mb-1"
          style={{
            fontSize: 'clamp(24px, 6vw, 42px)',
            color: '#cc2222',
            textShadow: '3px 3px 0 #ffffff, -2px -2px 0 #ffffff, 2px -2px 0 #ffffff, -2px 2px 0 #ffffff',
            letterSpacing: '0.05em'
          }}
        >
          เกมจบแล้ว!
        </h1>
        <div className="rpg-divider mb-4" />

        <h2 className="font-pixel font-bold text-sm mb-4" style={{ color: '#661a44' }}>
          ระดับ — <span style={{ color: '#cc2222' }}>{config.label}</span>
        </h2>

        <div className="bg-white/50 border-4 border-[#ff66aa] p-4 mb-5 text-left shadow-inner">
          {([
            { label: 'ศัตรูที่ปราบได้', value: `${enemiesDefeated}/${totalEnemies}`, color: '#cc2222' },
            { label: 'ตอบถูก', value: String(totalCorrect), color: '#22aa22' },
            { label: 'ผิด / หมดเวลา', value: String(totalWrong), color: '#cc2222' },
            null,
            { label: 'เวลาที่ใช้', value: `${mm}:${ss}`, color: '#661a44' },
            { label: 'ความแม่นยำ', value: `${acc}%`, color: '#661a44' },
            null,
            { label: '★ คะแนน', value: score.toLocaleString(), color: '#a31c5d', big: true },
            { label: '🪙 เหรียญ', value: String(coins), color: '#f8a820' },
          ] as Array<null | { label: string; value: string; color: string; big?: boolean }>)
            .map((row, i) => {
              if (row === null) return <div key={i} className="rpg-divider-thin border-[#ff66aa] my-2" style={{ background: '#ff66aa' }} />;
              return (
                <div key={i} className="flex justify-between items-center py-1">
                  <span className="font-pixel font-semibold text-sm" style={{ color: '#661a44' }}>{row.label}</span>
                  <span
                    className="font-pixel font-bold"
                    style={{ fontSize: row.big ? '18px' : '14px', color: row.color }}
                  >
                    {row.value}
                  </span>
                </div>
              );
            })}
        </div>

        <button
          onClick={resetGame}
          className="rpg-btn-red py-4 px-10 w-full font-bold text-base shadow-[4px_4px_0_rgba(0,0,0,0.2)]"
        >
          ↺ ลองใหม่อีกครั้ง
        </button>
      </div>
    </div>
  );
}
