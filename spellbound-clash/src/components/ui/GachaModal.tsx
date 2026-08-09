import { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';

export default function GachaModal() {
    const { coins, buyGacha, setGachaOpen } = useGameStore();
    const [isRolling, setIsRolling] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const getPetThaiName = (pet: string) => {
        if (pet === 'dog') return '🐶 น้องสุนัขแสนซน';
        if (pet === 'cat') return '🐱 น้องแมวขี้อ้อน';
        if (pet === 'pig') return '🐷 น้องหมูส้มนำโชค';
        return pet;
    };

    const getPetColor = (pet: string) => {
        if (pet === 'dog') return '#d97706';
        if (pet === 'cat') return '#ea580c';
        if (pet === 'pig') return '#ec4899';
        return '#a31c5d';
    };

    const handleRoll = () => {
        if (coins < 5) {
            setErrorMsg('❌ เหรียญไม่พอ! ต้องใช้ 5 เหรียญเพื่อสุ่ม');
            setTimeout(() => setErrorMsg(null), 3000);
            return;
        }

        setErrorMsg(null);
        setIsRolling(true);
        setResult(null);

        // Cute rolling delay
        setTimeout(() => {
            const pet = buyGacha();
            if (pet) {
                setResult(pet);
            } else {
                setErrorMsg('เกิดข้อผิดพลาดในการสุ่ม');
            }
            setIsRolling(false);
        }, 1800);
    };

    const textShadowStyle = { textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' };

    return (
        <div
            className="fixed inset-0 flex items-center justify-center z-[200] p-4"
            style={{ background: 'rgba(0,0,0,0.5)' }}
        >
            <div className="relative z-10 rpg-panel max-w-sm w-full animate-pop-in p-6" style={{ minWidth: '300px' }}>
                {/* Title */}
                <h2
                    className="font-pixel font-black text-center mb-2 rpg-title-gold text-lg"
                    style={{ letterSpacing: '0.05em' }}
                >
                    🔮 ตู้สุ่มสัตว์เลี้ยง
                </h2>
                <div className="rpg-divider mb-4" />

                <div className="text-center font-semibold text-xs text-[#a31c5d] mb-4">
                    ตู้กาชาปองพิเศษ! ลุ้นรับเพื่อนร่วมเดินทางสุดน่ารัก<br />
                    ค่าสุ่มครั้งละ <span className="font-bold text-sm text-[#ea580c]">5 🪙 เหรียญ</span>
                </div>

                {/* Display Box */}
                <div className="bg-white/40 border-4 border-[#ff66aa] p-6 mb-5 flex flex-col items-center justify-center h-48 shadow-inner relative overflow-hidden">
                    {isRolling ? (
                        <div className="flex flex-col items-center justify-center animate-bounce">
                            <div className="w-16 h-16 rounded-full border-4 border-dashed border-[#a31c5d] flex items-center justify-center text-4xl animate-spin">
                                🔮
                            </div>
                            <p className="font-pixel text-xs text-[#a31c5d] mt-4 font-bold animate-pulse">กำลังหมุนตู้...</p>
                        </div>
                    ) : result ? (
                        <div className="text-center animate-pop-in">
                            <div className="text-5xl mb-3 animate-bounce">
                                {result === 'dog' ? '🐶' : result === 'cat' ? '🐱' : '🐷'}
                            </div>
                            <div className="font-pixel text-xs text-white px-3 py-1 font-bold inline-block" style={{ backgroundColor: getPetColor(result), ...textShadowStyle }}>
                                ได้รับสัตว์เลี้ยง!
                            </div>
                            <p className="font-pixel font-bold mt-3 text-sm" style={{ color: getPetColor(result) }}>
                                {getPetThaiName(result)}
                            </p>
                        </div>
                    ) : (
                        <div className="text-center text-[#a31c5d]">
                            <div className="text-5xl mb-2 opacity-80">🎁</div>
                            <p className="font-pixel text-[10px] font-bold">กดปุ่มด้านล่างเพื่อเริ่มสุ่ม</p>
                        </div>
                    )}

                    {errorMsg && (
                        <div className="absolute bottom-2 left-0 right-0 text-center font-bold text-xs text-red-600 bg-red-100/90 py-1">
                            {errorMsg}
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                    <button
                        onClick={handleRoll}
                        disabled={isRolling}
                        className="rpg-btn-green py-3 w-full font-bold text-sm disabled:opacity-50"
                    >
                        🎰 สุ่มสอยเพื่อน (5 เหรียญ)
                    </button>

                    <button
                        onClick={() => setGachaOpen(false)}
                        disabled={isRolling}
                        className="rpg-btn-red py-2.5 w-full font-bold text-sm disabled:opacity-50"
                    >
                        ปิดตู้นี้
                    </button>
                </div>
            </div>
        </div>
    );
}
