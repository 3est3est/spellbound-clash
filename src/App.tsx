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
    <div className="w-screen h-screen overflow-hidden bg-slate-950 font-sans text-slate-100 select-none">
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
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 font-sans">
          <div className="bg-black border-4 border-white p-8 max-w-sm w-full text-center retro-border">
            <h2 className="font-pixel text-2xl text-white mb-8 tracking-widest uppercase" style={{ textShadow: '2px 2px 0 #333' }}>
              PAUSED
            </h2>
            <div className="flex flex-col gap-4">
              <button
                onClick={() => setIsPaused(false)}
                className="w-full py-3 text-xl font-bold bg-white text-black border-4 border-white hover:bg-slate-200 cursor-pointer uppercase tracking-widest transition-none"
              >
                เล่นต่อ (Resume)
              </button>
              <button
                onClick={() => {
                  setIsPaused(false);
                  resetGame();
                }}
                className="w-full py-3 text-xl font-bold bg-red-600 text-white border-4 border-red-500 hover:bg-red-500 cursor-pointer uppercase tracking-widest transition-none"
              >
                ออก (Exit)
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
