import { Suspense } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrthographicCamera } from '@react-three/drei';
import { EffectComposer, Pixelation } from '@react-three/postprocessing';
import Player from './Player';
import Enemy from './Enemy';
import Environment from './Environment';
import Particles from './Particles';
import { useGameStore } from '../../store/useGameStore';

/**
 * Responsive zoom: derive the orthographic zoom from the viewport size so the
 * same amount of world-space is visible regardless of window dimensions.
 * ~55 world-units across the smaller screen axis so the player can see the
 * path ahead while exploring the large map.
 */
const MIN_VIEW_UNITS = 40;

function ResponsiveCamera() {
  const { size } = useThree();
  const set = useThree((s) => s.set);

  const PITCH = Math.PI / 4;

  // Derive zoom from the viewport size so the visible world area stays
  // consistent. Compensate for the -45° pitch (cos(45°)) so the actual
  // visible span equals MIN_VIEW_UNITS instead of zooming in too far.
  const zoom = Math.max(10, Math.min(size.width, size.height) / (MIN_VIEW_UNITS * Math.cos(PITCH)));

  return (
    <OrthographicCamera
      makeDefault
      zoom={zoom}
      position={[0, 10, 10]}
      rotation={[-PITCH, 0, 0]}
      near={-100}
      far={100}
      onUpdate={(cam) => {
        cam.lookAt(0, 0, 0);
        set({ camera: cam });
      }}
    />
  );
}

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
        <ResponsiveCamera />

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
          <Pixelation granularity={2} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
