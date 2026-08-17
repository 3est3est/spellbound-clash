import { useEffect, useState } from 'react';
import { useGameStore } from './store/useGameStore';
import MainMenu from './components/ui/MainMenu';
import HUD from './components/ui/HUD';
import BattleTransition from './components/ui/BattleTransition';
import BattleOverlay from './components/ui/BattleOverlay';
import GameOver from './components/ui/GameOver';
import GameCanvas from './components/render/GameCanvas';
import GachaModal from './components/ui/GachaModal';
import InventoryModal from './components/ui/InventoryModal';
import ShopModal from './components/ui/ShopModal';
import BackgroundMusic from './components/audio/BackgroundMusic';
import RotateOverlay from './components/ui/RotateOverlay';

function App() {
  const {
    gameState,
    isPaused,
    setIsPaused,
    resetGame,
    isGachaOpen,
    isInventoryOpen,
    isShopOpen,
    bgmVolume,
    setBgmVolume,
    isMuted,
    toggleMute,
    recordScore,
  } = useGameStore();

  const [showPauseSettings, setShowPauseSettings] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape' && (gameState === 'EXPLORE' || gameState === 'BATTLE')) {
        setIsPaused(!isPaused);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, isPaused, setIsPaused]);

  // Reset showPauseSettings when pause menu is closed
  useEffect(() => {
    if (!isPaused) {
      setShowPauseSettings(false);
    }
  }, [isPaused]);

  return (
    <div className="w-screen h-screen overflow-hidden font-sans select-none">
      {/* Background Music System */}
      <BackgroundMusic />

      {/* Force landscape on touch devices */}
      <RotateOverlay />

      {/* 2D Pixel Exploration Scene (renders underneath UI) */}
      {(gameState === 'EXPLORE' || gameState === 'BATTLE_TRANSITION' || gameState === 'BATTLE') && <GameCanvas />}

      {/* UI Overlays based on state */}
      {gameState === 'MENU' && <MainMenu />}

      {gameState === 'EXPLORE' && <HUD />}

      {gameState === 'BATTLE_TRANSITION' && <BattleTransition />}

      {gameState === 'BATTLE' && <BattleOverlay />}

      {gameState === 'GAMEOVER' && <GameOver />}

      {/* Gacha Modal Overlay */}
      {isGachaOpen && <GachaModal />}

      {/* Inventory Modal Overlay */}
      {isInventoryOpen && <InventoryModal />}

      {/* Shop Modal Overlay */}
      {isShopOpen && <ShopModal />}

      {/* Pause Menu Overlay */}
      {isPaused && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="rpg-panel p-6 max-w-xs w-full text-center" style={{ minWidth: '260px' }}>
            {showPauseSettings ? (
              <>
                <h2
                  className="font-pixel font-black mb-2 rpg-title-gold"
                  style={{
                    fontSize: '20px',
                    letterSpacing: '0.05em',
                  }}
                >
                  ⚙️ ตั้งค่าเสียง
                </h2>
                <div className="rpg-divider mb-4" />

                {/* Details of audio settings */}
                <div className="flex flex-col gap-2.5 mb-4 text-left bg-[#1c2030]/80 p-3 border-2 border-[#6a3aa8]">
                  <div className="flex justify-between items-center">
                    <span className="font-pixel text-[10px] text-[#f0e6c8]">ความดังเพลง:</span>
                    <span className="font-pixel text-[10px] text-[#f5d87a]">{Math.round(bgmVolume * 100)}%</span>
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
                  <button
                    onClick={toggleMute}
                    className={`font-pixel text-[9px] py-1.5 mt-1 border-2 outline outline-2 -outline-offset-4 text-white text-center cursor-pointer transition-colors ${isMuted
                        ? "bg-[#d34b3a] border-[#ff7a5c] outline-[#8f2418]"
                        : "bg-[#2f9e53] border-[#61d07f] outline-[#1d6b34]"
                      }`}
                  >
                    {isMuted ? "🔇 MUTED (ปิดเสียง)" : "🔊 ACTIVE (เปิดเสียง)"}
                  </button>
                </div>

                <button
                  onClick={() => setShowPauseSettings(false)}
                  className="rpg-btn-green w-full py-2.5 font-bold text-sm shadow-[4px_4px_0_rgba(0,0,0,0.15)]"
                >
                  ◀ ย้อนกลับ
                </button>
              </>
            ) : (
              <>
                <h2
                  className="font-pixel font-black mb-2 animate-blink rpg-title-gold"
                  style={{
                    fontSize: '24px',
                    letterSpacing: '0.05em',
                  }}
                >
                  ⏸ พักเกม
                </h2>
                <div className="rpg-divider mb-4" />

                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => setIsPaused(false)}
                    className="rpg-btn-green py-3 w-full font-bold text-base shadow-[4px_4px_0_rgba(0,0,0,0.2)]"
                  >
                    ▶ เล่นต่อ
                  </button>
                  <button
                    onClick={() => setShowPauseSettings(true)}
                    className="rpg-btn py-3 w-full font-bold text-base shadow-[4px_4px_0_rgba(0,0,0,0.2)]"
                  >
                    ⚙ ตั้งค่าเสียง
                  </button>
                  <button
                    onClick={() => {
                      setIsPaused(false);
                      recordScore();
                      resetGame();
                    }}
                    className="rpg-btn-red py-3 w-full font-bold text-base shadow-[4px_4px_0_rgba(0,0,0,0.2)]"
                  >
                    ✕ ออกจากเกม
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
