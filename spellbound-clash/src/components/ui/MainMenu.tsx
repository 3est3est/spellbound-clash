import { useState, useEffect } from "react";
import { useGameStore } from "../../store/useGameStore";
import { DIFFICULTY_CONFIGS, type Difficulty, type LeaderboardEntry } from "../../types/game.types";

const difficulties: Difficulty[] = ["EASY", "MEDIUM", "HARDCORE"];

export default function MainMenu() {
  const { difficulty, setDifficulty, startGame, createProfile, continueGame, getSavedName, getLeaderboard } =
    useGameStore();

  const savedName = getSavedName();
  const [name, setName] = useState(savedName ?? "");
  const [pin, setPin] = useState("");
  const [mode, setMode] = useState<"new" | "continue">(savedName ? "continue" : "new");
  const [error, setError] = useState("");
  const [board, setBoard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    setBoard(getLeaderboard());
  }, [getLeaderboard]);

  const handleStart = () => {
    setError("");
    if (!name.trim()) { setError("กรุณาใส่ชื่อผู้เล่นก่อน"); return; }
    createProfile(name, pin || "0000");
    startGame();
  };

  const handleContinue = () => {
    setError("");
    if (!name.trim()) { setError("กรุณาใส่ชื่อผู้เล่น"); return; }
    if (!pin.trim()) { setError("กรุณาใส่ PIN 4 หลัก"); return; }
    const ok = continueGame(name, pin);
    if (!ok) { setError("ชื่อหรือ PIN ไม่ถูกต้อง"); return; }
    startGame();
  };

  const inputStyle: React.CSSProperties = {
    background: '#ffffff',
    border: '4px solid #cccccc',
    outline: '4px solid #a31c5d',
    outlineOffset: '-8px',
    color: '#a31c5d',
    padding: '12px 14px',
    fontFamily: "'Kanit', sans-serif",
    fontSize: '14px',
    fontWeight: 'bold',
    width: '100%',
    boxSizing: 'border-box',
    marginBottom: '8px',
  };

  return (
    <div
      className="fixed inset-0 flex flex-col lg:flex-row items-center justify-center overflow-y-auto p-4 lg:p-10"
      style={{
        background: 'linear-gradient(180deg, #fdf5df 0%, #fdf5df 25%, #ffbbee 60%, #b4e0b4 100%)',
      }}
    >
      {/* ── ส่วนหลัก: หัวข้อเกม + ปรับเป็น 2 คอลัมน์แบบเดิม ── */}
      <div className="w-full max-w-4xl flex flex-col items-center gap-8 py-10 lg:my-auto lg:mr-72">

        {/* ชื่อเกม */}
        <div className="text-center w-full max-w-2xl bg-[#fdf5df] border-4 border-[#f8a820] outline outline-4 outline-[#a31c5d] -outline-offset-8 p-4 shadow-[8px_8px_0_rgba(0,0,0,0.15)] relative">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2">
            <span className="font-pixel text-4xl" style={{ color: '#f8a820', textShadow: '2px 2px 0px #a31c5d' }}>★</span>
          </div>
          <h1
            className="font-pixel font-black leading-tight mt-4"
            style={{
              fontSize: 'clamp(28px, 6vw, 42px)',
              color: '#a31c5d',
              textShadow: '3px 3px 0px #ff66aa',
              letterSpacing: '0.05em'
            }}
          >
            SPELLBOUND
            <br />
            CLASH
          </h1>
        </div>

        {/* แบ่ง 2 คอลัมน์: เลือกระดับความยาก (ซ้าย) / ข้อมูลผู้เล่นและเริ่มเกม (ขวา) */}
        <div className="flex flex-col md:flex-row w-full gap-8 md:gap-12 items-start mt-2">

          {/* ซ้าย: เลือกระดับ */}
          <div className="flex-1 w-full flex flex-col gap-4">
            <div className="flex items-center gap-4 w-full">
              <div className="h-1 flex-1 bg-[#a31c5d]"></div>
              <span className="font-pixel text-sm" style={{ color: '#a31c5d' }}>— เลือกความยาก —</span>
              <div className="h-1 flex-1 bg-[#a31c5d]"></div>
            </div>

            <div className="flex flex-col gap-3 w-full">
              {difficulties.map((diff) => {
                const config = DIFFICULTY_CONFIGS[diff];
                const isSelected = difficulty === diff;
                return (
                  <button
                    key={diff}
                    onClick={() => setDifficulty(diff)}
                    className={`rpg-diff-btn ${isSelected ? 'selected' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className="font-pixel text-lg"
                        style={{ color: isSelected ? '#a31c5d' : '#666666' }}
                      >
                        {diff === 'HARDCORE' ? 'HARD' : diff}
                      </span>
                    </div>
                    <div className="h-[2px] bg-current mb-2 opacity-30"></div>

                    <div className="grid grid-cols-3 gap-2 font-pixel text-[10px] leading-none text-center">
                      <div className="flex flex-col gap-1 items-center">
                        <span className="opacity-80">❤ HP</span>
                        <span style={{ color: isSelected ? '#a31c5d' : '#666666', fontSize: '14px' }}>{config.playerHP}</span>
                      </div>
                      <div className="flex flex-col gap-1 items-center border-l border-r border-current border-opacity-30">
                        <span className="opacity-80">☠ FOE</span>
                        <span style={{ color: isSelected ? '#a31c5d' : '#666666', fontSize: '14px' }}>{config.totalEnemies}</span>
                      </div>
                      <div className="flex flex-col gap-1 items-center">
                        <span className="opacity-80">⏱ TIME</span>
                        <span style={{ color: isSelected ? '#a31c5d' : '#666666', fontSize: '14px' }}>{config.timerSeconds}s</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ขวา: ข้อมูลผู้เล่น + เริ่มเกม */}
          <div className="flex-1 w-full flex flex-col gap-4">
            <div className="flex items-center gap-4 w-full">
              <div className="h-1 flex-1 bg-[#a31c5d]"></div>
              <span className="font-pixel text-sm" style={{ color: '#a31c5d' }}>— ข้อมูลผู้เล่น —</span>
              <div className="h-1 flex-1 bg-[#a31c5d]"></div>
            </div>

            <div className="rpg-panel bg-white/60 backdrop-blur w-full">
              <div className="flex gap-2 mb-3">
                {(['new', 'continue'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => { setMode(m); setError(""); }}
                    className={`flex-1 font-pixel text-xs py-3 border-4 outline outline-4 -outline-offset-8 transition-colors ${mode === m
                      ? 'bg-[#a31c5d] border-[#ff66aa] outline-[#5a0b30] text-white'
                      : 'bg-[#e8e8e8] border-[#cccccc] outline-[#888888] text-[#666666]'
                      }`}
                  >
                    {m === 'new' ? 'ผู้เล่นใหม่' : 'เล่นต่อ'}
                  </button>
                ))}
              </div>

              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ชื่อผู้เล่น"
                style={inputStyle}
              />
              <input
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                inputMode="numeric"
                placeholder={mode === "continue" ? "PIN (4 หลัก)" : "ตั้ง PIN (4 หลัก)"}
                style={{ ...inputStyle, letterSpacing: '0.3em' }}
              />

              {error && (
                <p className="font-pixel text-xs text-center mt-2 animate-blink text-red-600">
                  ⚠ {error}
                </p>
              )}
            </div>

            <div className="mt-auto pt-2">
              <button onClick={mode === "continue" ? handleContinue : handleStart} className="rpg-btn w-full py-6 text-xl shadow-[6px_6px_0_rgba(0,0,0,0.15)]">
                ▶ เริ่มผจญภัย
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* ── ขวาสุดของจอ: ตารางคะแนนสูงสุด (แนวยาวจากบนลงล่าง) ── */}
      <div className="hidden lg:flex fixed right-0 top-0 h-full w-72 z-50 flex-col bg-[#fdf5df]/80 backdrop-blur-sm border-l-4 border-[#f8a820] shadow-[-4px_0_12px_rgba(0,0,0,0.1)]">
        {/* หัวข้อ */}
        <div className="flex items-center gap-3 px-4 py-4 border-b-2 border-[#f8a820] bg-[#fdf5df]">
          <span className="font-pixel text-sm font-bold" style={{ color: '#a31c5d' }}>🏆 ตารางคะแนนสูงสุด</span>
        </div>

        {/* รายการคะแนน */}
        <div className="flex-1 overflow-y-auto px-3 py-3">
          {board.length === 0 ? (
            <p className="font-pixel text-xs text-center py-6 text-gray-500">
              ยังไม่มีข้อมูลคะแนน
            </p>
          ) : (
            <ol className="space-y-2">
              {board.slice(0, 20).map((e, i) => (
                <li
                  key={`${e.name}-${e.difficulty}-${i}`}
                  className="flex justify-between items-center p-2 bg-white/80 border-2 border-[#a31c5d] rounded"
                >
                  <span className="font-pixel text-xs flex gap-2">
                    <span className="font-bold text-[#f8a820] w-6">{i + 1}.</span>
                    <span className="text-[#a31c5d] truncate max-w-[100px]">{e.name}</span>
                  </span>
                  <span className="font-pixel text-xs text-[#a31c5d]">
                    {e.score.toLocaleString()} <span className="text-[8px] text-[#ff66aa]">({e.difficulty.substring(0, 1)})</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

    </div>
  );
}
