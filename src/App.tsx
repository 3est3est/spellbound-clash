import { useGameStore } from './store/useGameStore';
import MainMenu from './components/ui/MainMenu';
import HUD from './components/ui/HUD';
import BattleTransition from './components/ui/BattleTransition';
import BattleOverlay from './components/ui/BattleOverlay';
import GameOver from './components/ui/GameOver';
import VictoryScreen from './components/ui/VictoryScreen';
import Scene from './components/3d/Scene';

function App() {
  const { gameState } = useGameStore();

  return (
    <div className="w-screen h-screen overflow-hidden bg-slate-950 font-sans text-slate-100 select-none">
      {/* 3D Exploration Scene (renders underneath UI) */}
      {(gameState === 'EXPLORE' || gameState === 'BATTLE_TRANSITION' || gameState === 'BATTLE') && <Scene />}

      {/* UI Overlays based on state */}
      {gameState === 'MENU' && <MainMenu />}
      
      {gameState === 'EXPLORE' && <HUD />}
      
      {gameState === 'BATTLE_TRANSITION' && <BattleTransition />}
      
      {gameState === 'BATTLE' && <BattleOverlay />}
      
      {gameState === 'GAMEOVER' && <GameOver />}
      
      {gameState === 'WIN' && <VictoryScreen />}
    </div>
  );
}

export default App;
