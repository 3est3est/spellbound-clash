import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrthographicCamera } from '@react-three/drei';
import { EffectComposer, Pixelation } from '@react-three/postprocessing';
import Player from './Player';
import Enemy from './Enemy';
import Environment from './Environment';
import Particles from './Particles';
import { useGameStore } from '../../store/useGameStore';

export default function Scene() {
  const { enemies } = useGameStore();

  return (
    <div
      className="fixed inset-0 z-0 bg-slate-950"
      // Crisp pixel scaling: render small, scale up without smoothing.
      style={{ imageRendering: 'pixelated' }}
    >
      <Canvas
        shadows
        // Full resolution render, no AA. Pixelation post-processing handles
        // the chunky look; imageRendering: pixelated keeps edges crisp.
        dpr={1}
        gl={{
          antialias: false,
          powerPreference: 'high-performance',
        }}
      >
        <OrthographicCamera makeDefault position={[0, 10, 10]} zoom={40} near={-100} far={100} />

        {/* Flat ambient-bright lighting → clean, even pixel look */}
        <ambientLight intensity={1.2} />
        <directionalLight
          position={[10, 20, 5]}
          intensity={1.6}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-near={0.1}
          shadow-camera-far={100}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
        />
        <color attach="background" args={['#87ceeb']} />

        {/* Fog to hide map edges */}
        <fog attach="fog" args={['#87ceeb', 18, 45]} />

        <Suspense fallback={null}>
          <Environment />
          <Particles />
          <Player />

          {enemies.map((enemy) => (
            <Enemy key={enemy.id} enemy={enemy} />
          ))}
        </Suspense>

        {/* Pixel-art post-processing — moderate so the scene stays readable */}
        <EffectComposer>
          <Pixelation granularity={3} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
