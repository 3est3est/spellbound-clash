import { useGameStore } from '../../store/useGameStore';

export default function GameOver() {
  const { totalCorrect, totalWrong, enemiesDefeated, totalEnemies, gameStartedAt, resetGame } = useGameStore();

  const elapsed = gameStartedAt
    ? Math.max(0, Math.floor((Date.now() - gameStartedAt) / 1000))
    : 0;
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');
  const total = totalCorrect + totalWrong;
  const acc = total > 0 ? Math.round((totalCorrect / total) * 100) : 0;

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center rpg-backdrop z-[100] p-4 text-center font-sans">
      <div className="relative z-10 rpg-panel-red px-10 py-8 max-w-xl w-full">
        <h1 className="font-pixel text-3xl sm:text-4xl font-black text-[#ffd2c2] mb-4 tracking-widest uppercase rpg-title-dark">
          ☠ GAME OVER
        </h1>
        <div className="rpg-divider mb-6 bg-[#2a0808]" />

        <h2 className="font-pixel text-xs font-bold text-[#ffe3d3] mb-6 uppercase tracking-widest">
          บันทึกการรบ
        </h2>

        <div className="space-y-3 text-left rpg-panel px-5 py-4">
          <div className="flex justify-between items-center font-pixel text-[11px] text-[#1a1430]">
            <span>ศัตรูที่ปราบ:</span>
            <span className="font-bold text-[#c0392b]">{enemiesDefeated}/{totalEnemies}</span>
          </div>
          <div className="flex justify-between items-center font-pixel text-[11px] text-[#1a1430]">
            <span>ตอบถูก:</span>
            <span className="font-bold text-[#2e8b57]">{totalCorrect}</span>
          </div>
          <div className="flex justify-between items-center font-pixel text-[11px] text-[#1a1430]">
            <span>ผิด/หมดเวลา:</span>
            <span className="font-bold text-[#c0392b]">{totalWrong}</span>
          </div>
          <div className="rpg-divider" />
          <div className="flex justify-between items-center font-pixel text-[11px] text-[#1a1430]">
            <span>เวลา:</span>
            <span className="font-bold">{mm}:{ss}</span>
          </div>
          <div className="flex justify-between items-center font-pixel text-[11px] text-[#1a1430]">
            <span>ความแม่นยำ:</span>
            <span className="font-bold text-[#b8860b]">{acc}%</span>
          </div>
        </div>

        <button
          onClick={resetGame}
          className="font-pixel mt-7 px-10 py-4 text-sm font-bold rpg-btn uppercase tracking-widest animate-blink"
        >
          [ ลองใหม่ ]
        </button>
      </div>
    </div>
  );
}
