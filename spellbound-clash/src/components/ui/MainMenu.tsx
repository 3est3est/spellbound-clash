import { useState, useEffect } from "react";
import { useGameStore } from "../../store/useGameStore";
import { DIFFICULTY_CONFIGS, type Difficulty, type LeaderboardEntry } from "../../types/game.types";

const difficulties: Difficulty[] = ["EASY", "MEDIUM", "HARDCORE"];

const inputStyle: React.CSSProperties = {
  background: "rgba(16, 20, 40, 0.85)",
  border: "3px solid #6a3aa8",
  outline: "3px solid #14143c",
  outlineOffset: "-6px",
  color: "#f0e6c8",
  padding: "10px 12px",
  fontFamily: "'Kanit', sans-serif",
  fontSize: "13px",
  fontWeight: "bold",
  width: "100%",
  boxSizing: "border-box",
  marginBottom: "8px",
};

function Backdrop({ onClick }: { onClick: () => void }) {
  return (
    <div
      className="fixed inset-0 z-40"
      style={{ background: "rgba(10,12,28,0.7)", backdropFilter: "blur(2px)" }}
      onClick={onClick}
    />
  );
}

function ModalFrame({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <>
      <Backdrop onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="mainmenu-modal pointer-events-auto w-full max-w-md">
          <div className="flex items-center justify-between gap-3 pb-3 mb-3 border-b-4 border-[#6a3aa8]">
            <span className="font-pixel text-sm" style={{ color: "#f5d87a" }}>{title}</span>
            <button
              onClick={onClose}
              className="font-pixel text-sm px-3 py-1 border-4 outline outline-4 -outline-offset-8 bg-[#1c2030] border-[#4a3a5e] outline-[#14143c] text-[#f0e6c8] cursor-pointer hover:bg-[#2a2440] active:translate-x-[2px] active:translate-y-[2px]"
              aria-label="ปิด"
            >
              X
            </button>
          </div>
          {children}
        </div>
      </div>
    </>
  );
}

function PlayerModal({
  onClose,
  onDone,
}: {
  onClose: () => void;
  onDone: (name: string) => void;
}) {
  const { getSavedName, setAdminCode, adminMode, createProfile, continueGame } = useGameStore();
  const savedName = getSavedName();
  const [name, setName] = useState(savedName ?? "");
  const [pin, setPin] = useState("");
  const [adminInput, setAdminInput] = useState("");
  const [adminStatus, setAdminStatus] = useState<"idle" | "ok" | "invalid">("idle");
  const [mode, setMode] = useState<"new" | "continue">(savedName ? "continue" : "new");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleAdminCode = () => {
    const ok = setAdminCode(adminInput);
    setAdminStatus(ok ? "ok" : "invalid");
  };

  const handleConfirm = async () => {
    setError("");
    if (!name.trim()) { setError("กรุณาใส่ชื่อผู้เล่นก่อน"); return; }
    setBusy(true);
    try {
      if (mode === "continue") {
        if (!pin.trim()) { setError("กรุณาใส่ PIN 4 หลัก"); return; }
        const res = await continueGame(name, pin);
        if (!res.ok) { setError(res.error ?? "ชื่อหรือ PIN ไม่ถูกต้อง"); return; }
      } else {
        const res = await createProfile(name, pin || "0000");
        if (!res.ok) { setError(res.error ?? "สร้างผู้เล่นไม่ได้"); return; }
      }
      onDone(name.trim());
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalFrame title="ผู้เล่น" onClose={onClose}>
      <div className="flex gap-2 mb-3">
        {(["new", "continue"] as const).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setError(""); }}
            className={`flex-1 font-pixel text-xs py-2 border-4 outline outline-4 -outline-offset-8 transition-colors ${mode === m
              ? 'bg-[#6a3aa8] border-[#9a5adc] outline-[#2a1a4c] text-white shadow-[inset_0_4px_0_rgba(255,255,255,0.12),inset_0_-4px_0_rgba(10,6,20,0.3),4px_4px_0_rgba(0,0,0,0.35)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-[2px_2px_0_rgba(0,0,0,0.5)]'
              : 'bg-[#1c2030] border-[#4a3a5e] outline-[#14143c] text-[#9a8f72] shadow-[inset_0_4px_0_rgba(255,255,255,0.07),inset_0_-4px_0_rgba(0,0,0,0.28),4px_4px_0_rgba(0,0,0,0.35)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none'
              }`}
          >
            {m === 'new' ? 'ผู้เล่นใหม่' : 'เล่นต่อ'}
          </button>
        ))}
      </div>

      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ชื่อผู้เล่น" style={inputStyle} />
      <input
        value={pin}
        onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
        inputMode="numeric"
        placeholder={mode === "continue" ? "PIN (4 หลัก)" : "ตั้ง PIN (4 หลัก)"}
        style={{ ...inputStyle, letterSpacing: "0.3em" }}
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
          className="font-pixel text-[9px] px-3 py-2 border-4 outline outline-4 -outline-offset-8 bg-[#1c2030] border-[#4a3a5e] outline-[#14143c] text-[#9a8f72] hover:bg-[#2a2440] hover:text-[#f0e6c8] active:translate-x-[2px] active:translate-y-[2px] cursor-pointer whitespace-nowrap"
        >
          ใช้
        </button>
      </div>
      {adminStatus === "ok" && (
        <p className="font-pixel text-[10px] text-center mb-2 text-[#f5d87a]">โหมด ADMIN เปิดแล้ว (ปลดประตูฟรี / god mode)</p>
      )}
      {adminStatus === "invalid" && (
        <p className="font-pixel text-[10px] text-center mb-2 text-red-600">รหัส admin ไม่ถูกต้อง</p>
      )}

      {adminMode && (
        <p className="font-pixel text-[10px] text-center mb-2 text-[#f5d87a]">ADMIN เปิดอยู่</p>
      )}

      {error && (
        <p className="font-pixel text-xs text-center mt-2 animate-blink text-red-600">{error}</p>
      )}

      <div className="mt-4">
        <button onClick={handleConfirm} disabled={busy} className="rpg-btn w-full py-3 text-sm disabled:opacity-60 disabled:cursor-wait">
          {busy ? "กำลังเชื่อมต่อ..." : mode === "continue" ? "เล่นต่อ" : "สร้างผู้เล่น"}
        </button>
      </div>
    </ModalFrame>
  );
}

function DifficultyModal({
  current,
  onSelect,
  onClose,
}: {
  current: Difficulty;
  onSelect: (d: Difficulty) => void;
  onClose: () => void;
}) {
  return (
    <ModalFrame title="เลือกความยาก" onClose={onClose}>
      <div className="flex flex-col gap-3">
        {difficulties.map((diff) => {
          const config = DIFFICULTY_CONFIGS[diff];
          const isSelected = current === diff;
          return (
            <button
              key={diff}
              onClick={() => onSelect(diff)}
              className={`rpg-diff-btn ${isSelected ? "selected" : ""}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-pixel text-sm" style={{ color: isSelected ? "#f0e6c8" : "#9a8f72" }}>
                  {diff === "HARDCORE" ? "HARD" : diff}
                </span>
                <span className="font-pixel text-[10px]" style={{ color: isSelected ? "#f5d87a" : "#9a8f72" }}>
                  {isSelected ? "เลือกแล้ว" : "เลือก"}
                </span>
              </div>
              <div className="h-[2px] bg-current mb-2 opacity-30"></div>
              <div className="grid grid-cols-3 gap-2 font-pixel text-[10px] leading-none text-center">
                <div className="flex flex-col gap-1 items-center">
                  <span className="opacity-80">HP</span>
                  <span style={{ color: isSelected ? "#f0e6c8" : "#9a8f72", fontSize: "13px" }}>{config.playerHP}</span>
                </div>
                <div className="flex flex-col gap-1 items-center border-l border-r border-current border-opacity-30">
                  <span className="opacity-80">FOE</span>
                  <span style={{ color: isSelected ? "#f0e6c8" : "#9a8f72", fontSize: "13px" }}>{config.totalEnemies}</span>
                </div>
                <div className="flex flex-col gap-1 items-center">
                  <span className="opacity-80">TIME</span>
                  <span style={{ color: isSelected ? "#f0e6c8" : "#9a8f72", fontSize: "13px" }}>{config.timerSeconds}s</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </ModalFrame>
  );
}

function ConfirmModal({
  name,
  difficulty,
  onConfirm,
  onClose,
}: {
  name: string;
  difficulty: Difficulty;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <ModalFrame title="เริ่มผจญภัย?" onClose={onClose}>
      <p className="font-pixel text-xs text-center my-4" style={{ color: "#f0e6c8" }}>
        ความยาก: <span style={{ color: "#f5d87a" }}>{difficulty}</span>
      </p>
      <p className="font-pixel text-xs text-center mb-5" style={{ color: "#f0e6c8" }}>
        กำลังเล่นเป็น <span style={{ color: "#f5d87a" }}>{name}</span>
      </p>
      <div className="flex gap-3">
        <button onClick={onClose} className="rpg-diff-btn flex-1 py-2.5 text-xs font-pixel text-xs">ยกเลิก</button>
        <button onClick={onConfirm} className="rpg-btn flex-1 py-2.5 text-xs font-pixel text-xs">เริ่ม!</button>
      </div>
    </ModalFrame>
  );
}

function LeaderboardPanel() {
  const { getLeaderboard } = useGameStore();
  const [board, setBoard] = useState<LeaderboardEntry[]>([]);
  const [boardExpanded, setBoardExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadBoard = async () => {
    setLoading(true);
    try {
      const b = await getLeaderboard();
      setBoard(b);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBoard();
  }, [getLeaderboard]);

  const shownBoard = boardExpanded ? board : board.slice(0, 5);

  return (
    <div className="hidden lg:flex fixed right-4 top-4 z-50 flex-col w-60 bg-[#12142c]/90 backdrop-blur-sm border-4 border-[#6a3aa8] outline outline-4 outline-[#14143c] -outline-offset-8 shadow-[4px_4px_0_rgba(0,0,0,0.4)]">
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b-2 border-[#6a3aa8]">
        <span className="font-pixel text-[11px] font-bold" style={{ color: "#f5d87a" }}>คะแนนสูงสุด</span>
        {board.length > 5 && (
          <button
            onClick={() => setBoardExpanded(v => !v)}
            className="font-pixel text-[10px] px-2 py-1 bg-[#1c2030] border-2 border-[#4a3a5e] text-[#f0e6c8] cursor-pointer hover:bg-[#2a2440] active:translate-x-[1px] active:translate-y-[1px]"
          >
            {boardExpanded ? "▲ ซ่อน" : "▼ เพิ่มเติม"}
          </button>
        )}
      </div>
      <div className={`px-2 py-2 ${boardExpanded ? "max-h-72 overflow-y-auto" : ""}`}>
        {loading ? (
          <p className="font-pixel text-[10px] text-center py-3 text-[#9a8f72]">กำลังโหลด...</p>
        ) : shownBoard.length === 0 ? (
          <p className="font-pixel text-[10px] text-center py-3 text-[#9a8f72]">ยังไม่มีข้อมูลคะแนน</p>
        ) : (
          <ol className="space-y-1.5">
            {shownBoard.map((e, i) => (
              <li
                key={`${e.name}-${e.difficulty}-${i}`}
                className="flex justify-between items-center px-2 py-1 bg-[#1c2030] border-2 border-[#4a3a5e]"
              >
                <span className="font-pixel text-[10px] flex gap-2">
                  <span className="font-bold text-[#f5d87a] w-5">{i + 1}.</span>
                  <span className="text-[#f0e6c8] truncate max-w-[90px]">{e.name}</span>
                </span>
                <span className="font-pixel text-[10px] text-[#f0e6c8]">
                  {e.score.toLocaleString()}{" "}
                  <span className="text-[8px] text-[#9a5adc]">({e.difficulty.substring(0, 1)})</span>
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

function SettingsModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const { bgmVolume, setBgmVolume, isMuted, toggleMute } = useGameStore();

  return (
    <ModalFrame title="ตั้งค่าระบบเสียง" onClose={onClose}>
      <div className="flex flex-col gap-4 py-3">
        {/* Toggle Mute */}
        <div className="flex items-center justify-between bg-[#191d30] p-3 border-2 border-[#6a3aa8]">
          <span className="font-pixel text-[11px] text-[#f0e6c8]">ปิดเสียง (MUTE)</span>
          <button
            onClick={toggleMute}
            className={`font-pixel text-[10px] px-3 py-1.5 border-4 outline outline-4 -outline-offset-8 transition-colors cursor-pointer ${isMuted
                ? 'bg-[#d34b3a] border-[#ff7a5c] outline-[#8f2418] text-white shadow-[inset_0_4px_0_rgba(255,255,255,0.12),inset_0_-4px_0_rgba(10,6,20,0.3)]'
                : 'bg-[#2f9e53] border-[#61d07f] outline-[#1d6b34] text-white shadow-[inset_0_4px_0_rgba(255,255,255,0.12),inset_0_-4px_0_rgba(10,6,20,0.3)]'
              }`}
          >
            {isMuted ? "🔇 MUTED" : "🔊 ACTIVE"}
          </button>
        </div>

        {/* Volume Slider */}
        <div className="flex flex-col gap-2.5 bg-[#191d30] p-3 border-2 border-[#6a3aa8]">
          <div className="flex justify-between items-center">
            <span className="font-pixel text-[11px] text-[#f0e6c8]">ความดังเพลง:</span>
            <span className="font-pixel text-[11px] text-[#f5d87a]">{Math.round(bgmVolume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={bgmVolume}
            onChange={(e) => setBgmVolume(parseFloat(e.target.value))}
            className="w-full h-2 bg-[#14143c] border border-[#6a3aa8] accent-[#f5d87a] cursor-pointer"
          />
        </div>
      </div>

      <div className="mt-4">
        <button onClick={onClose} className="rpg-btn w-full py-3 text-sm">
          ตกลง
        </button>
      </div>
    </ModalFrame>
  );
}

export default function MainMenu() {
  const { difficulty, setDifficulty, startGame, getSavedName, adminMode } = useGameStore();

  const savedName = getSavedName();
  const [modal, setModal] = useState<"player" | "difficulty" | "confirm" | "settings" | null>(null);
  const [name, setName] = useState(savedName ?? "");

  useEffect(() => {
    setName(savedName ?? "");
  }, [savedName]);

  const handleStart = () => {
    if (!name.trim()) {
      setModal("player");
      return;
    }
    setModal("confirm");
  };

  const handlePlayerDone = (n: string) => {
    setName(n);
    setModal("confirm");
  };

  return (
    <div className="mainmenu-dark fixed inset-0 flex flex-col items-center justify-center overflow-y-auto p-4 lg:p-6">

      <div
        className="absolute inset-0 bg-cover bg-center pointer-events-none"
        style={{ backgroundImage: "url(/assets/gen/main-menu-bg.webp)" }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at center, rgba(10,12,28,0.45) 0%, rgba(10,12,28,0.15) 45%, rgba(10,12,28,0) 70%)" }}
      />

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-2 pt-[36vh] pb-6">
        <button onClick={handleStart} className="rpg-btn w-full py-2 text-lg">
          เริ่มผจญภัย
        </button>
        <button onClick={() => setModal("difficulty")} className="rpg-diff-btn w-full py-1.5 flex items-center justify-between px-4">
          <span className="font-pixel text-sm text-[#9a8f72]">ความยาก</span>
          <span className="font-pixel text-sm" style={{ color: "#f5d87a" }}>{difficulty} ▾</span>
        </button>
        <button onClick={() => setModal("player")} className="rpg-diff-btn w-full py-1.5 flex items-center justify-between px-4">
          <span className="font-pixel text-sm text-[#9a8f72]">ผู้เล่น</span>
          <span className="font-pixel text-sm" style={{ color: name.trim() ? "#f5d87a" : "#9a8f72" }}>
            {name.trim() || "ใหม่"} ▾
          </span>
        </button>
        <button onClick={() => setModal("settings")} className="rpg-diff-btn w-full py-1.5 flex items-center justify-between px-4">
          <span className="font-pixel text-sm text-[#9a8f72]">ตั้งค่าเสียง</span>
          <span className="font-pixel text-sm" style={{ color: "#f5d87a" }}>⚙ ▾</span>
        </button>

        {adminMode && (
          <p className="font-pixel text-[10px] text-center mt-2 text-[#f5d87a]">
            โหมด ADMIN เปิดอยู่ (ปลดประตูฟรี / god mode)
          </p>
        )}
      </div>

      <LeaderboardPanel />

      {modal === "player" && (
        <PlayerModal
          onClose={() => setModal(null)}
          onDone={(n) => handlePlayerDone(n)}
        />
      )}
      {modal === "difficulty" && (
        <DifficultyModal current={difficulty} onSelect={(d) => { setDifficulty(d); setModal(null); }} onClose={() => setModal(null)} />
      )}
      {modal === "confirm" && (
        <ConfirmModal name={name} difficulty={difficulty} onConfirm={() => startGame()} onClose={() => setModal(null)} />
      )}
      {modal === "settings" && (
        <SettingsModal onClose={() => setModal(null)} />
      )}

    </div>
  );
}
