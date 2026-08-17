import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { drawPet } from '../../game/rendering';

// PetSprite Canvas-based renderer
interface PetSpriteProps {
    kind: 'dog' | 'cat' | 'pig' | 'crab' | 'cow' | 'frog' | 'octopus' | 'phoenix' | 'shadow';
    silhouette?: boolean;
    size?: number;
}

export function PetSprite({ kind, silhouette = false, size = 64 }: PetSpriteProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.imageSmoothingEnabled = false;

        // Centering: TILE=16, SCALE=3 -> 48x48. Canvas is size x size.
        // For size = 64, offset x = (size-48)/2 = 8, y = (size-48)/2 = 8.
        const offset = Math.max(0, (size - 48) / 2);
        drawPet(ctx, offset, offset - 4, kind, 0, 'right');
    }, [kind, size]);

    return (
        <canvas
            ref={canvasRef}
            width={size}
            height={size}
            className="image-rendering-pixelated select-none pointer-events-none"
            style={{
                width: `${size}px`,
                height: `${size}px`,
                filter: silhouette ? 'brightness(0)' : 'none',
            }}
        />
    );
}

const GACHA_PETS = [
    { id: 'crab', name: 'น้องปูนักก้ามโต', rate: '36%', bgGradient: 'from-[#38bdf8] to-[#0284c7]' },
    { id: 'cow', name: 'น้องวัวลายจุด', rate: '36%', bgGradient: 'from-[#38bdf8] to-[#0284c7]' },
    { id: 'frog', name: 'น้องกบเขียว', rate: '16%', bgGradient: 'from-[#4ade80] to-[#16a34a]' },
    { id: 'octopus', name: 'น้องหมึกม่วง', rate: '6.2%', bgGradient: 'from-[#c084fc] to-[#7e22ce]' },
    { id: 'dog', name: 'น้องสุนัขแสนซน', rate: '3.1%', bgGradient: 'from-[#fbbf24] to-[#d97706]' },
    { id: 'phoenix', name: 'น้องฟีนิกซ์เปลวเพลิง', rate: '2.1%', bgGradient: 'from-[#ff7e40] to-[#b80000]' },
    { id: 'shadow', name: 'น้องเงาปริศนา', rate: '???%', bgGradient: 'from-[#e879f9] to-[#4c1d95]', specialRate: true },
    { id: 'empty_1', isEmpty: true },
    { id: 'empty_2', isEmpty: true },
] as const;

const petMeta = {
    crab: { name: '🦀 น้องปูนักก้ามโต', color: '#dc2626', rarity: 'Common' },
    cow: { name: '🐮 น้องวัวลายจุด', color: '#a1a1aa', rarity: 'Common' },
    frog: { name: '🐸 น้องกบเขียว', color: '#22c55e', rarity: 'Uncommon' },
    octopus: { name: '🐙 น้องหมึกม่วง', color: '#a855f7', rarity: 'Rare' },
    dog: { name: '🐶 น้องสุนัขแสนซน', color: '#d97706', rarity: 'Epic' },
    phoenix: { name: '🔥 น้องฟีนิกซ์เปลวเพลิง', color: '#f97316', rarity: 'Legendary' },
    shadow: { name: '👾 น้องเงาปริศนา', color: '#c084fc', rarity: 'Mythic' },
} as Record<string, { name: string; color: string; rarity: string }>;

export default function GachaModal() {
    const { coins, adminMode, buyGachaMultiple, petsOwned, setGachaOpen } = useGameStore();
    const [isRolling, setIsRolling] = useState(false);
    const [rollCycleIndex, setRollCycleIndex] = useState(0);
    const [rolledResults, setRolledResults] = useState<string[] | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

            if (rolledResults) {
                if (e.code === 'Enter' || e.code === 'Space' || e.code === 'Escape') {
                    e.preventDefault();
                    e.stopPropagation();
                    setRolledResults(null);
                }
                return;
            }

            if (isRolling) return;

            if (e.code === 'KeyE') {
                e.preventDefault();
                e.stopPropagation();
                handleRoll(1);
            } else if (e.code === 'KeyR') {
                e.preventDefault();
                e.stopPropagation();
                handleRoll(3);
            } else if (e.code === 'KeyT') {
                e.preventDefault();
                e.stopPropagation();
                handleRoll(8);
            } else if (e.code === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                setGachaOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown, { capture: true });
        return () => {
            window.removeEventListener('keydown', handleKeyDown, { capture: true });
        };
    }, [isRolling, rolledResults]);

    // Silhouette cycling during roll
    useEffect(() => {
        if (!isRolling) return;
        const interval = setInterval(() => {
            setRollCycleIndex((prev) => (prev + 1) % 7);
        }, 85);
        return () => clearInterval(interval);
    }, [isRolling]);

    const handleRoll = (count: number) => {
        let cost = count * 5;
        if (count === 3) cost = 15;
        else if (count === 8) cost = 40;

        if (!adminMode && coins < cost) {
            setErrorMsg(`❌ เหรียญไม่พอ! ต้องใช้ ${cost} เหรียญเพื่อสุ่ม x${count}`);
            setTimeout(() => setErrorMsg(null), 3000);
            return;
        }

        setErrorMsg(null);
        setIsRolling(true);
        setRolledResults(null);

        // Spin delay
        setTimeout(() => {
            const results = buyGachaMultiple(count);
            if (results && results.length > 0) {
                setRolledResults(results);
            } else {
                setErrorMsg('เกิดข้อผิดพลาดในการสุ่ม');
            }
            setIsRolling(false);
        }, 1500);
    };

    const getBgGradient = (id: string) => {
        if (id === 'crab' || id === 'cow') return 'bg-gradient-to-b from-[#38bdf8] to-[#0284c7]';
        if (id === 'frog') return 'bg-gradient-to-b from-[#4ade80] to-[#16a34a]';
        if (id === 'octopus') return 'bg-gradient-to-b from-[#c084fc] to-[#7e22ce]';
        if (id === 'dog') return 'bg-gradient-to-b from-[#fbbf24] to-[#d97706]';
        if (id === 'phoenix') return 'bg-gradient-to-b from-[#ff7e40] to-[#b80000]';
        if (id === 'shadow') return 'bg-gradient-to-b from-[#e879f9] to-[#4c1d95] border-2 border-[#f472b6]';
        return 'bg-slate-200';
    };

    const cyclePetId = ['crab', 'cow', 'frog', 'octopus', 'dog', 'phoenix', 'shadow'][rollCycleIndex] as any;

    return (
        <div
            className="fixed inset-0 flex items-center justify-center z-[200] p-4 bg-black/60 backdrop-blur-sm"
        >
            <div className="relative w-full max-w-sm rounded-[32px] border-[6px] border-white bg-[#f8fbff] p-5 shadow-[0_16px_36px_rgba(0,0,0,0.35),0_0_0_4px_#38bdf8] animate-pop-in">
                {/* Close Button X */}
                <button
                    onClick={() => setGachaOpen(false)}
                    disabled={isRolling}
                    className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-red-500 border-4 border-white text-white font-pixel font-bold flex items-center justify-center shadow-md hover:bg-red-600 active:scale-95 transition-all text-[8px] z-[210] cursor-pointer disabled:opacity-50"
                >
                    ✕
                </button>

                {isRolling ? (
                    /* Rolling State screen */
                    <div className="flex flex-col items-center justify-center py-10 min-h-[300px]">
                        <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-b from-[#e2e8f0] to-[#cbd5e1] border-4 border-white shadow-lg flex items-center justify-center overflow-hidden animate-bounce mb-4">
                            <PetSprite kind={cyclePetId} silhouette={true} size={64} />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                                <span className="font-pixel font-bold text-4xl text-white opacity-40">?</span>
                            </div>
                        </div>
                        <p className="font-pixel text-[10px] text-[#38bdf8] font-bold animate-pulse">กำลังสุ่มสัตว์เลี้ยง...</p>
                    </div>
                ) : rolledResults ? (
                    /* Results State overlay */
                    <div className="flex flex-col items-center justify-center py-6 min-h-[300px]">
                        <h3 className="font-pixel text-[#ea580c] font-black text-center text-[11px] mb-4 animate-bounce" style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.1)' }}>
                            🎉 ได้รับสัตว์เลี้ยง!
                        </h3>

                        <div className="w-full overflow-y-auto max-h-[220px] px-1 py-2 flex flex-wrap justify-center gap-3">
                            {rolledResults.map((petId, i) => {
                                const meta = petMeta[petId];
                                return (
                                    <div
                                        key={`${petId}-${i}`}
                                        className={`aspect-square w-[75px] rounded-[16px] p-1 flex flex-col items-center justify-center relative overflow-hidden border-[3px] border-white shadow-[0_4px_10px_rgba(0,0,0,0.15)] animate-pop-in ${getBgGradient(petId)}`}
                                        style={{ animationDelay: `${i * 150}ms` }}
                                    >
                                        <PetSprite kind={petId as any} silhouette={false} size={48} />
                                        <span
                                            className="absolute bottom-1 font-pixel font-bold text-[7px] text-white tracking-widest text-center px-0.5 line-clamp-1 w-full"
                                            style={{
                                                textShadow: '1px 1px 0px #000, -1px 1px 0px #000, 1px -1px 0px #000, -1px -1px 0px #000',
                                            }}
                                        >
                                            {meta?.rarity || 'Common'}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {rolledResults.length === 1 && (
                            <p className="font-pixel text-[9px] font-bold text-center mt-3 text-[#1e293b]">
                                ยินดีด้วย! ได้รับ {petMeta[rolledResults[0]]?.name}
                            </p>
                        )}

                        <button
                            onClick={() => setRolledResults(null)}
                            className="mt-6 w-full h-11 bg-gradient-to-b from-[#8ade24] to-[#45a305] border-[3px] border-white rounded-[16px] text-white font-pixel font-bold text-[10px] shadow-[0_4px_6px_rgba(0,0,0,0.15)] hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                        >
                            ตกลง (OK)
                        </button>
                    </div>
                ) : (
                    /* Default Modal State (The 7-pet grid and hatch actions) */
                    <>
                        {/* Title Header */}
                        <div className="text-center mb-3">
                            <h2 className="font-pixel font-black text-center text-[#1e293b] text-[13px] tracking-tight">
                                สุ่มคู่หูออกรบ
                            </h2>
                            <p className="font-pixel text-[7px] text-[#64748b] mt-1 font-bold">
                                สะสมสัตว์เลี้ยงช่วยต่อสู้โซนต่างๆ
                            </p>
                        </div>

                        {/* Coin balance panel */}
                        <div className="flex justify-between items-center bg-white border-2 border-[#e2e8f0] px-4 py-2.5 rounded-[18px] mb-3 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
                            <span className="font-pixel text-[7px] text-[#64748b] font-bold">เหรียญของคุณ:</span>
                            <span className="font-pixel text-[9px] text-[#0f172a] font-bold">🪙 {coins.toLocaleString()}</span>
                        </div>

                        {/* 3x3 Grid of pets */}
                        <div className="grid grid-cols-3 gap-2 bg-white border-[3px] border-[#f1f5f9] p-3 rounded-[24px] shadow-[inset_0_2px_8px_rgba(0,0,0,0.05)]">
                            {GACHA_PETS.map((pet, idx) => {
                                if ('isEmpty' in pet) {
                                    return (
                                        <div
                                            key={`empty-${idx}`}
                                            className="aspect-square bg-[#f8fafc] border-2 border-dashed border-[#e2e8f0] rounded-[18px] shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                                        />
                                    );
                                }

                                const isOwned = petsOwned.includes(pet.id);
                                return (
                                    <div
                                        key={pet.id}
                                        className={`aspect-square rounded-[18px] p-1 flex flex-col items-center justify-center relative overflow-hidden border-[3px] border-white shadow-[0_4px_10px_rgba(0,0,0,0.08),inset_0_-4px_0_rgba(0,0,0,0.15)] transition-all ${getBgGradient(
                                            pet.id
                                        )}`}
                                    >
                                        <PetSprite kind={pet.id as any} silhouette={!isOwned} size={48} />

                                        {/* Rate Text */}
                                        <span
                                            className="absolute bottom-1 font-pixel font-bold text-[8px] text-white tracking-widest"
                                            style={{
                                                textShadow:
                                                    '1.2px 1.2px 0px #000, -1.2px 1.2px 0px #000, 1.2px -1.2px 0px #000, -1.2px -1.2px 0px #000',
                                                color: ('specialRate' in pet && (pet as any).specialRate) ? '#ff5252' : '#ffffff',
                                            }}
                                        >
                                            {pet.rate}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Cost Display Button ("🖱️ 5sp") */}
                        <div className="my-3 flex justify-center">
                            <div className="bg-[#00a8ff] border-[3px] border-white outline outline-2 outline-[#00a8ff] rounded-full px-6 py-1.5 flex items-center justify-center gap-1.5 shadow-[0_4px_10px_rgba(0,168,255,0.25)]">
                                <span
                                    className="font-pixel text-[9px] font-bold text-white tracking-widest animate-pulse"
                                    style={{ textShadow: '1.5px 1.5px 0px rgba(0,0,0,0.15)' }}
                                >
                                    🖱️ 5sp
                                </span>
                            </div>
                        </div>

                        {/* Hatch Actions */}
                        <div className="flex gap-2">
                            {/* Hatch 1 (E) */}
                            <div className="flex flex-col items-center flex-1">
                                <button
                                    onClick={() => handleRoll(1)}
                                    className="w-full h-10 bg-gradient-to-b from-[#8ade24] to-[#45a305] border-[3px] border-white rounded-[16px] text-white font-pixel font-bold text-[8px] shadow-[0_4px_8px_rgba(69,163,5,0.25)] hover:brightness-105 active:scale-95 transition-all cursor-pointer"
                                    style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.2)' }}
                                >
                                    Hatch 1
                                </button>
                                <span className="font-pixel font-bold text-[6px] text-[#94a3b8] mt-1 whitespace-nowrap">E (5🪙)</span>
                            </div>

                            {/* x3 (R) */}
                            <div className="flex flex-col items-center flex-1">
                                <button
                                    onClick={() => handleRoll(3)}
                                    className="w-full h-10 bg-gradient-to-b from-[#fca904] to-[#f45c05] border-[3px] border-white rounded-[16px] text-white font-pixel font-bold text-[9px] shadow-[0_4px_8px_rgba(244,92,5,0.25)] hover:brightness-105 active:scale-95 transition-all cursor-pointer"
                                    style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.2)' }}
                                >
                                    x3
                                </button>
                                <span className="font-pixel font-bold text-[6px] text-[#94a3b8] mt-1 whitespace-nowrap">R (15🪙)</span>
                            </div>

                            {/* x8 (T) */}
                            <div className="flex flex-col items-center flex-1">
                                <button
                                    onClick={() => handleRoll(8)}
                                    className="w-full h-10 bg-gradient-to-b from-[#c084fc] via-[#e879f9] to-[#f472b6] border-[3px] border-white rounded-[16px] text-white font-pixel font-bold text-[9px] shadow-[0_4px_8px_rgba(232,121,249,0.25)] hover:brightness-105 active:scale-95 transition-all cursor-pointer"
                                    style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.2)' }}
                                >
                                    x8
                                </button>
                                <span className="font-pixel font-bold text-[6px] text-[#94a3b8] mt-1 whitespace-nowrap">T (40🪙)</span>
                            </div>
                        </div>

                        {/* Error Msg Display */}
                        {errorMsg && (
                            <div className="absolute bottom-20 left-4 right-4 text-center font-pixel font-bold text-[7px] text-[#ef4444] bg-[#fee2e2] border border-[#fca5a5] py-2 rounded-xl animate-bounce">
                                {errorMsg}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
