import { useGameStore, getUpgradeCost } from '../../store/useGameStore';

export default function ShopModal() {
    const { coins, itemsOwned, unlockedZones, buyItem, upgradeItem, hatUpgradeLevel, swordUpgradeLevel, setShopOpen } = useGameStore();

    const shopItems = [
        {
            id: 'hat',
            name: '👑 หมวกยอดวีรบุรุษ (Hero Hat)',
            desc: 'เพิ่มพลังชีวิตสูงสุด (Max HP) +1 หน่วยถาวรขณะสวมใส่',
            price: 15,
            icon: '👑',
            zoneReq: 1,
            zoneReqTh: 'โซน 1 (ป่ามรกต)'
        },
        {
            id: 'sword',
            name: '⚔️ ดาบประกาศิต (Holy Sword)',
            desc: 'เพิ่มระดับพลังโจมตีมอนสเตอร์ +1 หน่วยทุกครั้งที่ตอบคำถามถูก',
            price: 30,
            icon: '⚔️',
            zoneReq: 2,
            zoneReqTh: 'โซน 2 (ทะเลทราย)'
        },
        {
            id: 'shoes',
            name: '🥾 รองเท้าเทพวายุ (Storm Shoes)',
            desc: 'เพิ่มความเร็วในการวิ่งเดินสำรวจแผนที่กว้างขวางเร็วขึ้น +35%',
            price: 50,
            icon: '🥾',
            zoneReq: 4,
            zoneReqTh: 'โซน 4 (ดินแดนลาวา)'
        }
    ];

    const handleBuy = (itemId: string) => {
        buyItem(itemId);
    };

    return (
        <div
            className="fixed inset-0 flex items-center justify-center z-[200] p-4"
            style={{ background: 'rgba(0,0,0,0.5)' }}
        >
            <div className="relative z-10 rpg-panel max-w-sm w-full animate-pop-in p-6" style={{ minWidth: '320px' }}>
                {/* Title */}
                <h2 className="font-pixel font-black text-center mb-2 rpg-title-gold text-base" style={{ letterSpacing: '0.05em' }}>
                    🛒 ร้านค้าอุปกรณ์
                </h2>
                <div className="rpg-divider mb-3" />

                {/* Coins display */}
                <div className="flex justify-between items-center bg-[#26221c] border-4 border-[#6b4423] outline outline-4 outline-[#1c5f33] -outline-offset-8 px-3 py-1.5 mb-3 shadow-[3px_3px_0_rgba(0,0,0,0.4)]">
                    <span className="font-pixel text-[10px] text-[#e8c04a] font-bold">เหรียญทองของคุณ:</span>
                    <span className="font-pixel text-xs text-white font-bold">🪙 {coins.toLocaleString()}</span>
                </div>

                {/* Items List */}
                <div className="bg-[#26201a]/60 border-4 border-[#6b4423] p-3 mb-4 max-h-72 overflow-y-auto shadow-inner flex flex-col gap-3 min-h-[180px]">
                    {shopItems.map((item) => {
                        const isOwned = itemsOwned.includes(item.id);
                        const isUnlocked = unlockedZones.includes(item.zoneReq);
                        const canAfford = coins >= item.price;

                        let currentLevel = 0;
                        let maxLevelReached = false;
                        let upgradeCost = 0;
                        const canUpgrade = item.id === 'hat' || item.id === 'sword';

                        if (canUpgrade) {
                            currentLevel = item.id === 'hat' ? hatUpgradeLevel : swordUpgradeLevel;
                            maxLevelReached = currentLevel >= 12;
                            upgradeCost = getUpgradeCost(item.id as 'hat' | 'sword', currentLevel + 1);
                        }

                        const levelSuffix = canUpgrade && currentLevel > 0 ? ` +${currentLevel}` : '';
                        const currentBonusVal = canUpgrade ? (currentLevel > 0 ? 1.0 + (currentLevel - 1) * 0.5 : 0) : 0;
                        const nextBonusVal = canUpgrade ? (1.0 + currentLevel * 0.5) : 0;

                        return (
                            <div
                                key={item.id}
                                className="border-2 p-2 bg-[#33291c] border-[#6b4423] flex flex-col gap-1 shadow-[4px_4px_0_rgba(0,0,0,0.4)] relative"
                            >
                                {/* Item Details */}
                                <div className="flex justify-between items-center gap-1">
                                    <div className="flex flex-col">
                                        <span className="font-pixel text-[10px] font-bold text-[#e8dcc0]">
                                            {item.icon} {item.name}{levelSuffix}
                                        </span>
                                        {!isOwned && (
                                            <span className="text-[9px] text-[#b8a888] font-bold">
                                                ราคา: 🪙 {item.price}
                                            </span>
                                        )}
                                    </div>

                                    {/* Action Button */}
                                    {isOwned ? (
                                        canUpgrade ? (
                                            maxLevelReached ? (
                                                <span className="font-pixel text-[8px] bg-[#3a3325] text-[#e8c04a] border-2 border-[#6b4423] px-2 py-1">
                                                    ระดับสูงสุด (+12)
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => upgradeItem(item.id as 'hat' | 'sword')}
                                                    disabled={coins < upgradeCost}
                                                    className={`font-pixel text-[9px] px-2.5 py-1.5 font-bold ${coins >= upgradeCost
                                                        ? 'rpg-btn-green cursor-pointer'
                                                        : 'bg-gray-400 border-gray-600 border-2 text-gray-600 cursor-not-allowed opacity-60'
                                                        }`}
                                                >
                                                    อัพเกรด (🪙 {upgradeCost})
                                                </button>
                                            )
                                        ) : (
<span className="font-pixel text-[8px] bg-[#26221c] border-2 border-[#6b4423] text-[#b8a888] px-2 py-1">
                                                    ซื้อแล้ว
                                                </span>
                                        )
                                    ) : !isUnlocked ? (
                                        <span className="font-pixel text-[7px] bg-[#3a1d18] border border-[#ff6050] text-[#ff9b8a] px-1.5 py-1 text-center font-semibold rounded whitespace-nowrap">
                                            🔒 ปลดล็อค {item.zoneReqTh}
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => handleBuy(item.id)}
                                            disabled={!canAfford}
                                            className={`font-pixel text-[9px] px-2.5 py-1.5 font-bold ${canAfford
                                                ? 'rpg-btn-green'
                                                : 'bg-gray-400 border-gray-600 border-2 text-gray-600 cursor-not-allowed opacity-60'
                                                }`}
                                        >
                                            ซื้อของ
                                        </button>
                                    )}
                                </div>
                                <p className="text-[9px] text-[#c9bd9e] font-semibold leading-relaxed mt-1">
                                    {item.desc}
                                    {isOwned && canUpgrade && (
                                        <span className="block text-[#e8c04a] font-bold mt-0.5">
                                            ระดับโบนัสปัจจุบัน: +{currentBonusVal.toFixed(1)} {item.id === 'hat' ? 'HP' : 'พลังโจมตี'}
                                            {!maxLevelReached && ` (ขั้นถัดไป: +${nextBonusVal.toFixed(1)})`}
                                        </span>
                                    )}
                                </p>
                            </div>
                        );
                    })}
                </div>

                {/* Close Button */}
                <button
                    onClick={() => setShopOpen(false)}
                    className="rpg-btn-red py-3 w-full font-bold text-sm shadow-[4px_4px_0_rgba(0,0,0,0.2)]"
                >
                    ✕ ออกจากร้านค้า
                </button>
            </div>
        </div>
    );
}
