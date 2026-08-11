import { useState, useEffect } from "react";
import { useGameStore } from "../../store/useGameStore";
import { DIFFICULTY_CONFIGS, type Difficulty, type LeaderboardEntry } from "../../types/game.types";

const difficulties: Difficulty[] = ["EASY", "MEDIUM", "HARDCORE"];

const DECOR = [
  { x: "6%", y: "12%", glyph: "❤", size: "18px", opacity: 0.9 },
  { x: "90%", y: "10%", glyph: "✦", size: "22px", opacity: 1 },
  { x: "12%", y: "78%", glyph: "✦", size: "16px", opacity: 0.85 },
  { x: "88%", y: "82%", glyph: "❤", size: "20px", opacity: 0.9 },
  { x: "4%", y: "42%", glyph: "✧", size: "12px", opacity: 0.7 },
  { x: "95%", y: "38%", glyph: "✧", size: "13px", opacity: 0.7 },
  { x: "22%", y: "20%", glyph: "✧", size: "10px", opacity: 0.6 },
  { x: "78%", y: "24%", glyph: "✧", size: "11px", opacity: 0.6 },
  { x: "15%", y: "55%", glyph: "✧", size: "9px", opacity: 0.55 },
  { x: "84%", y: "66%", glyph: "✧", size: "9px", opacity: 0.55 },
  { x: "30%", y: "88%", glyph: "✧", size: "11px", opacity: 0.6 },
  { x: "68%", y: "90%", glyph: "✦", size: "14px", opacity: 0.8 },
];

export default function MainMenu() {
  const { difficulty, setDifficulty, startGame, createProfile, continueGame, getSavedName, getLeaderboard, setAdminCode } =
    useGameStore();

  const savedName = getSavedName();
  const [name, setName] = useState(savedName ?? "");
  const [pin, setPin] = useState("");
  const [adminInput, setAdminInput] = useState("");
  const [adminStatus, setAdminStatus] = useState<"idle" | "ok" | "invalid">("idle");
  const [mode, setMode] = useState<"new" | "continue">(savedName ? "continue" : "new");
  const [error, setError] = useState("");
  const [board, setBoard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    setBoard(getLeaderboard());
  }, [getLeaderboard]);

  const handleAdminCode = () => {
    const ok = setAdminCode(adminInput);
    setAdminStatus(ok ? "ok" : "invalid");
  };

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
    background: '#2a2418',
    border: '4px solid #6b4423',
    outline: '4px solid #1c5f33',
    outlineOffset: '-8px',
    color: '#f0e6c8',
    padding: '12px 14px',
    fontFamily: "'Kanit', sans-serif",
    fontSize: '14px',
    fontWeight: 'bold',
    width: '100%',
    boxSizing: 'border-box',
    marginBottom: '8px',
  };

  return (
    <div className="mainmenu-dark fixed inset-0 flex flex-col lg:flex-row items-center justify-center overflow-y-auto p-4 lg:p-10">

      {/* ── ของตกแต่งพื้นหลัง (flat, ไม่มีแสง) ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {DECOR.map((d, i) => (
          <span
            key={i}
            className="absolute font-pixel"
            style={{
              left: d.x, top: d.y, fontSize: d.size,
              color: d.glyph === '❤' ? '#57b86f' : '#e8c04a',
              opacity: d.opacity,
            }}
          >
            {d.glyph}
          </span>
        ))}
        {/* กรอบขอบจอด้านซ้าย/ขวาแบบ pixel */}
        <div className="absolute left-0 top-0 bottom-0 w-3" style={{ background: 'repeating-linear-gradient(180deg, #2f8f4f 0 12px, #1c3323 12px 24px)' }} />
        <div className="absolute right-0 top-0 bottom-0 w-3" style={{ background: 'repeating-linear-gradient(180deg, #2f8f4f 0 12px, #1c3323 12px 24px)' }} />
      </div>

      {/* ── ส่วนหลัก: หัวข้อเกม + ปรับเป็น 2 คอลัมน์แบบเดิม ── */}
      <div className="w-full max-w-4xl flex flex-col items-center gap-8 py-10 lg:my-auto lg:mr-72 relative z-10">

        {/* ชื่อเกม */}
        <div className="text-center w-full max-w-2xl bg-[#3a3325] border-4 border-[#8a5b32] outline outline-4 outline-[#1c5f33] -outline-offset-8 p-4 shadow-[8px_8px_0_rgba(0,0,0,0.4)] relative">
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 flex items-end gap-2">
            <span className="font-pixel text-lg" style={{ color: '#e8c04a', textShadow: '2px 2px 0px #1c5f33' }}>★</span>
            <span className="font-pixel text-3xl" style={{ color: '#f5d87a', textShadow: '2px 2px 0px #1c5f33' }}>★</span>
            <span className="font-pixel text-lg" style={{ color: '#e8c04a', textShadow: '2px 2px 0px #1c5f33' }}>★</span>
          </div>
          <span className="font-pixel text-sm absolute -top-6 left-4" style={{ color: '#57b86f' }}>✧</span>
          <span className="font-pixel text-sm absolute -top-6 right-4" style={{ color: '#57b86f' }}>✧</span>
          <h1
            className="font-pixel font-black leading-tight mt-4"
            style={{
              fontSize: 'clamp(28px, 6vw, 42px)',
              color: '#f5d87a',
              textShadow: '3px 3px 0px #1c5f33',
              letterSpacing: '0.05em'
            }}
          >
            SPELLBOUND
            <br />
            CLASH
          </h1>
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="font-pixel text-xs" style={{ color: '#57b86f' }}>❤</span>
            <div className="h-[2px] w-16" style={{ background: '#57b86f' }} />
            <span className="font-pixel text-xs" style={{ color: '#e8c04a' }}>✧</span>
            <div className="h-[2px] w-16" style={{ background: '#57b86f' }} />
            <span className="font-pixel text-xs" style={{ color: '#57b86f' }}>❤</span>
          </div>
        </div>

        {/* แบ่ง 2 คอลัมน์: เลือกระดับความยาก (ซ้าย) / ข้อมูลผู้เล่นและเริ่มเกม (ขวา) */}
        <div className="flex flex-col md:flex-row w-full gap-8 md:gap-12 items-start mt-2">

          {/* ซ้าย: เลือกระดับ */}
          <div className="flex-1 w-full flex flex-col gap-4">
            <div className="flex items-center gap-4 w-full">
              <div className="h-1 flex-1" style={{ background: '#2f8f4f' }}></div>
              <span className="font-pixel text-sm" style={{ color: '#57b86f' }}>— เลือกความยาก —</span>
              <div className="h-1 flex-1" style={{ background: '#2f8f4f' }}></div>
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
                        style={{ color: isSelected ? '#f0e6c8' : '#9a8f72' }}
                      >
                        {diff === 'HARDCORE' ? 'HARD' : diff}
                      </span>
                    </div>
                    <div className="h-[2px] bg-current mb-2 opacity-30"></div>

                    <div className="grid grid-cols-3 gap-2 font-pixel text-[10px] leading-none text-center">
                      <div className="flex flex-col gap-1 items-center">
                        <span className="opacity-80">❤ HP</span>
                        <span style={{ color: isSelected ? '#f0e6c8' : '#9a8f72', fontSize: '14px' }}>{config.playerHP}</span>
                      </div>
                      <div className="flex flex-col gap-1 items-center border-l border-r border-current border-opacity-30">
                        <span className="opacity-80">☠ FOE</span>
                        <span style={{ color: isSelected ? '#f0e6c8' : '#9a8f72', fontSize: '14px' }}>{config.totalEnemies}</span>
                      </div>
                      <div className="flex flex-col gap-1 items-center">
                        <span className="opacity-80">⏱ TIME</span>
                        <span style={{ color: isSelected ? '#f0e6c8' : '#9a8f72', fontSize: '14px' }}>{config.timerSeconds}s</span>
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
              <div className="h-1 flex-1" style={{ background: '#2f8f4f' }}></div>
              <span className="font-pixel text-sm" style={{ color: '#57b86f' }}>— ข้อมูลผู้เล่น —</span>
              <div className="h-1 flex-1" style={{ background: '#2f8f4f' }}></div>
            </div>

            <div className="rpg-panel w-full">
              <div className="flex gap-2 mb-3">
                {(['new', 'continue'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => { setMode(m); setError(""); }}
                    className={`flex-1 font-pixel text-xs py-3 border-4 outline outline-4 -outline-offset-8 transition-colors ${mode === m
                      ? 'bg-[#2f8f4f] border-[#57b86f] outline-[#1c5f33] text-white shadow-[inset_0_4px_0_rgba(255,255,255,0.12),inset_0_-4px_0_rgba(8,30,16,0.3),4px_4px_0_rgba(0,0,0,0.35)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-[2px_2px_0_rgba(0,0,0,0.5)]'
                      : 'bg-[#3d3a2f] border-[#5d3b1e] outline-[#36220f] text-[#9a8f72] shadow-[inset_0_4px_0_rgba(255,255,255,0.07),inset_0_-4px_0_rgba(0,0,0,0.28),4px_4px_0_rgba(0,0,0,0.35)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none'
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

              <div className="flex gap-2 mb-2">
                <input
                  value={adminInput}
                  onChange={(e) => { setAdminInput(e.target.value); setAdminStatus("idle"); }}
                  placeholder="รหัส admin (ไม่บังคับ)"
                  style={{ ...inputStyle, marginBottom: 0 }}
                />
                <button
                  onClick={handleAdminCode}
                  className="font-pixel text-[9px] px-3 py-2 border-4 outline outline-4 -outline-offset-8 bg-[#3d3a2f] border-[#5d3b1e] outline-[#36220f] text-[#9a8f72] hover:bg-[#4a4436] hover:text-[#f0e6c8] active:translate-x-[2px] active:translate-y-[2px] cursor-pointer whitespace-nowrap"
                >
                  ใช้
                </button>
              </div>
              {adminStatus === "ok" && (
                <p className="font-pixel text-[10px] text-center mb-2 text-[#f5d87a]">
                  ⭐ โหมด ADMIN เปิดแล้ว (ปลดประตูฟรี / god mode)
                </p>
              )}
              {adminStatus === "invalid" && (
                <p className="font-pixel text-[10px] text-center mb-2 text-red-600">
                  ⚠ รหัส admin ไม่ถูกต้อง
                </p>
              )}

              {error && (
                <p className="font-pixel text-xs text-center mt-2 animate-blink text-red-600">
                  ⚠ {error}
                </p>
              )}
            </div>

            <div className="mt-auto pt-2">
              <button onClick={mode === "continue" ? handleContinue : handleStart} className="rpg-btn w-full py-6 text-xl">
                ▶ เริ่มผจญภัย
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* ── ขวาสุดของจอ: ตารางคะแนนสูงสุด (แนวยาวจากบนลงล่าง) ── */}
      <div className="hidden lg:flex fixed right-0 top-0 h-full w-72 z-50 flex-col bg-[#1c160f]/90 backdrop-blur-sm border-l-4 border-[#57b86f] shadow-[-4px_0_12px_rgba(0,0,0,0.35)]">
        {/* หัวข้อ */}
        <div className="flex items-center gap-3 px-4 py-4 border-b-2 border-[#57b86f] bg-[#2a2418]">
          <span className="font-pixel text-sm font-bold" style={{ color: '#e8c04a' }}>🏆 ตารางคะแนนสูงสุด</span>
        </div>

        {/* รายการคะแนน */}
        <div className="flex-1 overflow-y-auto px-3 py-3">
          {board.length === 0 ? (
            <p className="font-pixel text-xs text-center py-6 text-[#9a8f72]">
              ยังไม่มีข้อมูลคะแนน
            </p>
          ) : (
            <ol className="space-y-2">
              {board.slice(0, 20).map((e, i) => (
                <li
                  key={`${e.name}-${e.difficulty}-${i}`}
                  className="flex justify-between items-center p-2 bg-[#3a3325] border-2 border-[#6b4423] rounded"
                >
                  <span className="font-pixel text-xs flex gap-2">
                    <span className="font-bold text-[#e8c04a] w-6">{i + 1}.</span>
                    <span className="text-[#f0e6c8] truncate max-w-[100px]">{e.name}</span>
                  </span>
                  <span className="font-pixel text-xs text-[#f0e6c8]">
                    {e.score.toLocaleString()} <span className="text-[8px] text-[#57b86f]">({e.difficulty.substring(0, 1)})</span>
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