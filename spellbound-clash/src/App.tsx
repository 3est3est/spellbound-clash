import { useEffect } from 'react';
import { useGameStore } from './store/useGameStore';
import MainMenu from './components/ui/MainMenu';
import HUD from './components/ui/HUD';
import BattleTransition from './components/ui/BattleTransition';
import BattleOverlay from './components/ui/BattleOverlay';
import GameOver from './components/ui/GameOver';
import VictoryScreen from './components/ui/VictoryScreen';
import GameCanvas from './components/render/GameCanvas';

function App() {
  const { gameState, isPaused, setIsPaused, resetGame } = useGameStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape' && (gameState === 'EXPLORE' || gameState === 'BATTLE')) {
        setIsPaused(!isPaused);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, isPaused, setIsPaused]);

  return (
    <div className="w-screen h-screen overflow-hidden font-sans select-none">
      {/* 2D Pixel Exploration Scene (renders underneath UI) */}
      {(gameState === 'EXPLORE' || gameState === 'BATTLE_TRANSITION' || gameState === 'BATTLE') && <GameCanvas />}

      {/* UI Overlays based on state */}
      {gameState === 'MENU' && <MainMenu />}
      
      {gameState === 'EXPLORE' && <HUD />}
      
      {gameState === 'BATTLE_TRANSITION' && <BattleTransition />}
      
      {gameState === 'BATTLE' && <BattleOverlay />}
      
      {gameState === 'GAMEOVER' && <GameOver />}
      
      {gameState === 'WIN' && <VictoryScreen />}

      {/* Pause Menu Overlay */}
      {isPaused && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="rpg-panel p-6 max-w-xs w-full text-center" style={{ minWidth: '260px' }}>
            
            <h2
              className="font-pixel font-black mb-2 animate-blink rpg-title-gold"
              style={{
                fontSize: '24px',
                letterSpacing: '0.05em',
              }}
            >
              ⏸ พักเกม
            </h2>
            <div className="rpg-divider mb-5" />

            <div className="flex flex-col gap-3">
              <button
                onClick={() => setIsPaused(false)}
                className="rpg-btn-green py-3 w-full font-bold text-base shadow-[4px_4px_0_rgba(0,0,0,0.2)]"
              >
                ▶ เล่นต่อ
              </button>
              <button
                onClick={() => {
                  setIsPaused(false);
                  resetGame();
                }}
                className="rpg-btn-red py-3 w-full font-bold text-base shadow-[4px_4px_0_rgba(0,0,0,0.2)]"
              >
                ✕ ออกจากเกม
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
