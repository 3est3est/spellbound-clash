import { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';

export default function InventoryModal() {
    const {
        petsOwned,
        equippedPet,
        equipPet,
        setInventoryOpen,
        itemsOwned,
        equippedHat,
        equippedSword,
        equippedShoes,
        equipItem,
        unequipItem
    } = useGameStore();

    const [activeTab, setActiveTab] = useState<'pets' | 'equipment'>('pets');

    const petDetails = {
        dog: { name: '🐶 น้องสุนัขแสนซน (ฟื้นฟู HP)', desc: 'ความสามารถ [รักษาใจ]: ฟื้นฟู HP 1 หน่วยทันทีเมื่อชนะการต่อสู้ (หากเลือดเหลือ 2 หรือน้อยกว่า จะฟื้นฟูแรงเป็น 2 หน่วย!)', color: '#d97706' },
        cat: { name: '🐱 น้องแมวขี้อ้อน (เพิ่มดาเมจ)', desc: 'ความสามารถ [พลัง爪]: เพิ่มดาเมจที่ทำได้ต่อมอนสเตอร์ 1 หน่วย (ทำให้ตีมอนสเตอร์ลดเลือดรอบละ 2 หน่วยแทนที่จะลด 1)', color: '#ea580c' },
        pig: { name: '🐷 น้องหมูนำโชค (เหรียญ x2)', desc: 'ความสามารถ [โชครับทรัพย์]: ทวีคูณเหรียญทองที่ได้รับหลังปราบมอนสเตอร์สำเร็จในแต่ละโซนแบบคูณ 2 (x2)!', color: '#ec4899' },
    } as Record<string, { name: string; desc: string; color: string }>;

    const counts = petsOwned.reduce((acc, pet) => {
        acc[pet] = (acc[pet] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const uniqueOwned = Object.keys(counts) as Array<'dog' | 'cat' | 'pig'>;

    const handleEquipPet = (p: string) => {
        if (equippedPet === p) {
            equipPet(null); // Unequip if already equipped
        } else {
            equipPet(p); // Equip
        }
    };

    // Equipment Details
    const equipItemsDetails = {
        hat: {
            name: '👑 หมวกยอดวีรบุรุษ (Hero Hat)',
            desc: 'สวมใส่เพื่อเพิ่มพลังชีวิตสูงสุด (Max HP) +1 หน่วยทันที',
            slot: 'hat',
            color: '#a31c5d'
        },
        sword: {
            name: '⚔️ ดาบประกาศิต (Holy Sword)',
            desc: 'สวมใส่เพื่อเพิ่มพลังการโจมตีมอนสเตอร์ +1 หน่วยต่อการคำตอบถูก',
            slot: 'sword',
            color: '#3b82f6'
        },
        shoes: {
            name: '🥾 รองเท้าเทพวายุ (Storm Shoes)',
            desc: 'สวมใส่เพื่อเพิ่มความเร็วในการวิ่งเดินสำรวจแผนที่ +35%',
            slot: 'shoes',
            color: '#10b981'
        }
    } as Record<string, { name: string; desc: string; slot: string; color: string }>;

    const handleEquipItem = (itemId: string, slot: string) => {
        let isCurrentlyEquipped = false;
        if (slot === 'hat') isCurrentlyEquipped = equippedHat === itemId;
        else if (slot === 'sword') isCurrentlyEquipped = equippedSword === itemId;
        else if (slot === 'shoes') isCurrentlyEquipped = equippedShoes === itemId;

        if (isCurrentlyEquipped) {
            unequipItem(slot);
        } else {
            equipItem(itemId, slot);
        }
    };

    return (
        <div
            className="fixed inset-0 flex items-center justify-center z-[200] p-4"
            style={{ background: 'rgba(0,0,0,0.5)' }}
        >
            <div className="relative z-10 rpg-panel max-w-sm w-full animate-pop-in p-6" style={{ minWidth: '320px' }}>
                {/* Title */}
                <h2
                    className="font-pixel font-black text-center mb-2 rpg-title-gold text-base"
                    style={{ letterSpacing: '0.05em' }}
                >
                    🎒 กระเป๋าเป้สะพาย
                </h2>
                <div className="rpg-divider mb-3" />

                {/* Tabs */}
                <div className="flex gap-2 mb-3">
                    <button
                        onClick={() => setActiveTab('pets')}
                        className={`flex-1 font-pixel text-[10px] py-2 border-4 outline outline-4 -outline-offset-8 transition-colors font-bold ${activeTab === 'pets'
                                ? 'bg-[#a31c5d] border-[#ff66aa] outline-[#5a0b30] text-white'
                                : 'bg-[#e8e8e8] border-[#cccccc] outline-[#888888] text-[#666666]'
                            }`}
                    >
                        🐾 สัตว์เลี้ยง
                    </button>
                    <button
                        onClick={() => setActiveTab('equipment')}
                        className={`flex-1 font-pixel text-[10px] py-2 border-4 outline outline-4 -outline-offset-8 transition-colors font-bold ${activeTab === 'equipment'
                                ? 'bg-[#a31c5d] border-[#ff66aa] outline-[#5a0b30] text-white'
                                : 'bg-[#e8e8e8] border-[#cccccc] outline-[#888888] text-[#666666]'
                            }`}
                    >
                        ⚔️ ของสวมใส่
                    </button>
                </div>

                {/* Content Panel */}
                <div className="bg-white/45 border-4 border-[#ff66aa] p-3 mb-5 max-h-64 overflow-y-auto shadow-inner flex flex-col gap-3 min-h-[144px]">
                    {activeTab === 'pets' ? (
                        uniqueOwned.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-6 text-center text-xs text-[#a31c5d] font-pixel font-bold">
                                <span className="text-3xl mb-1 opacity-60">🐾</span>
                                ยังไม่มีสัตว์เลี้ยง!<br />
                                หมุนสุ่มได้จากตู้นะ
                            </div>
                        ) : (
                            uniqueOwned.map((pet) => {
                                const details = petDetails[pet];
                                const isEquipped = equippedPet === pet;
                                return (
                                    <div
                                        key={pet}
                                        className="border-2 p-2 bg-[#fdf5df] flex flex-col gap-1 shadow-[2px_2px_0_rgba(0,0,0,0.1)]"
                                        style={{ borderColor: isEquipped ? '#ffd700' : '#ff66aa' }}
                                    >
                                        <div className="flex justify-between items-center">
                                            <span className="font-pixel text-[10px] font-bold" style={{ color: details.color }}>
                                                {details.name} {counts[pet] > 1 && `(x${counts[pet]})`}
                                            </span>
                                            <button
                                                onClick={() => handleEquipPet(pet)}
                                                className={`font-pixel text-[9px] px-2.5 py-1.5 font-bold ${isEquipped ? 'rpg-btn-red text-[8px] px-1.5' : 'rpg-btn-green'
                                                    }`}
                                            >
                                                {isEquipped ? '✕ ถอดออก' : '✓ สวมใส่'}
                                            </button>
                                        </div>
                                        <p className="text-[9px] text-gray-700 font-semibold leading-relaxed mt-1">
                                            {details.desc}
                                        </p>
                                    </div>
                                );
                            })
                        )
                    ) : (
                        itemsOwned.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-6 text-center text-xs text-[#a31c5d] font-pixel font-bold">
                                <span className="text-3xl mb-1 opacity-60">⚔️</span>
                                ยังไม่มีของสวมใส่!<br />
                                ซื้อได้จากร้านค้าเลยนะ
                            </div>
                        ) : (
                            itemsOwned.map((itemId) => {
                                const details = equipItemsDetails[itemId];
                                if (!details) return null;

                                let isEquipped = false;
                                if (details.slot === 'hat') isEquipped = equippedHat === itemId;
                                else if (details.slot === 'sword') isEquipped = equippedSword === itemId;
                                else if (details.slot === 'shoes') isEquipped = equippedShoes === itemId;

                                return (
                                    <div
                                        key={itemId}
                                        className="border-2 p-2 bg-[#fdf5df] flex flex-col gap-1 shadow-[2px_2px_0_rgba(0,0,0,0.1)]"
                                        style={{ borderColor: isEquipped ? '#ffd700' : '#ff66aa' }}
                                    >
                                        <div className="flex justify-between items-center">
                                            <span className="font-pixel text-[10px] font-bold" style={{ color: details.color }}>
                                                {details.name}
                                            </span>
                                            <button
                                                onClick={() => handleEquipItem(itemId, details.slot)}
                                                className={`font-pixel text-[9px] px-2.5 py-1.5 font-bold ${isEquipped ? 'rpg-btn-red text-[8px] px-1.5' : 'rpg-btn-green'
                                                    }`}
                                            >
                                                {isEquipped ? '✕ ถอดออก' : '✓ สวมใส่'}
                                            </button>
                                        </div>
                                        <p className="text-[9px] text-gray-700 font-semibold leading-relaxed mt-1">
                                            {details.desc}
                                        </p>
                                    </div>
                                );
                            })
                        )
                    )}
                </div>

                {/* Close Button */}
                <button
                    onClick={() => setInventoryOpen(false)}
                    className="rpg-btn-red py-3 w-full font-bold text-sm shadow-[4px_4px_0_rgba(0,0,0,0.2)]"
                >
                    ✕ ปิดกระเป๋า
                </button>
            </div>
        </div>
    );
}
