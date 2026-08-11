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
        className="relative z-10 rpg-panel px-8 py-7 max-w-lg w-full animate-pop-in"
        style={{ textAlign: 'center' }}
      >
        <h1
          className="font-pixel font-black mb-1"
          style={{
            fontSize: 'clamp(24px, 6vw, 42px)',
            color: '#ff7a5c',
            textShadow: '3px 3px 0 #000',
            letterSpacing: '0.05em'
          }}
        >
          เกมจบแล้ว!
        </h1>
        <div className="rpg-divider mb-4" />

        <h2 className="font-pixel font-bold text-sm mb-4" style={{ color: '#e8dcc0' }}>
          ระดับ — <span style={{ color: '#ff7a5c' }}>{config.label}</span>
        </h2>

        <div className="bg-[#26201a]/60 border-4 border-[#6b4423] p-4 mb-5 text-left shadow-inner">
          {([
            { label: 'ศัตรูที่ปราบได้', value: `${enemiesDefeated}/${totalEnemies}`, color: '#ff7a5c' },
            { label: 'ตอบถูก', value: String(totalCorrect), color: '#61d07f' },
            { label: 'ผิด / หมดเวลา', value: String(totalWrong), color: '#ff7a5c' },
            null,
            { label: 'เวลาที่ใช้', value: `${mm}:${ss}`, color: '#e8dcc0' },
            { label: 'ความแม่นยำ', value: `${acc}%`, color: '#e8dcc0' },
            null,
            { label: '★ คะแนน', value: score.toLocaleString(), color: '#f5d87a', big: true },
            { label: '🪙 เหรียญ', value: String(coins), color: '#e8c04a' },
          ] as Array<null | { label: string; value: string; color: string; big?: boolean }>)
            .map((row, i) => {
              if (row === null) return <div key={i} className="rpg-divider-thin my-2" style={{ background: '#e8c04a' }} />;
              return (
                <div key={i} className="flex justify-between items-center py-1">
                  <span className="font-pixel font-semibold text-sm" style={{ color: '#e8dcc0' }}>{row.label}</span>
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
