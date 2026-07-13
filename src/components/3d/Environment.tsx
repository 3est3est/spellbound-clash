import { useMemo } from 'react';
import { Instances, Instance, Plane } from '@react-three/drei';
import {
  PATH_HALF_WIDTH,
  MAP_HALF_X,
  MAP_MIN_Z,
  MAP_MAX_Z,
  isOnPath,
} from './mapPath';

// Seeded RNG → stable, natural-looking forest layout every run.
function makeRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

interface Prop {
  pos: [number, number, number];
  scale: [number, number, number];
  color: string;
}

const TILE = 1;

export default function Environment() {
  const scene = useMemo(() => {
    const rng = makeRng(20260714);
    const pathTiles: Prop[] = [];
    const trunks: Prop[] = [];
    const foliage: Prop[] = [];
    const bushes: Prop[] = [];
    const rocks: Prop[] = [];
    const flowers: Prop[] = [];
    const grassTufts: Prop[] = [];
    const lilies: Prop[] = [];
    const ponds: Prop[] = [];

    // --- Walkable path tiles: mix grass + dirt so it feels like a trail ---
    const pathColors = ['#9c8354', '#a88d5d', '#7a9e4a', '#8a7a4a', '#6e8a3e'];
    for (let z = MAP_MAX_Z; z >= MAP_MIN_Z; z -= TILE) {
      for (let x = -MAP_HALF_X; x <= MAP_HALF_X; x += TILE) {
        if (isOnPath(x, z, -0.3)) {
          pathTiles.push({
            pos: [x, 0.02, z],
            scale: [1, 0.1, 1],
            color: pathColors[Math.floor(rng() * pathColors.length)],
          });
        }
      }
    }

    // --- Natural forest: scatter props across the WHOLE map, but keep a
    //     WIDE margin around the path so it's always clearly walkable. ---
    const trunkColors = ['#3b2814', '#2e1f10', '#45301a', '#33210f'];
    const leafColors = ['#1f3613', '#274617', '#2f5320', '#1a2e10', '#244018', '#356024'];
    const bushColors = ['#2f5320', '#274617', '#356024', '#1f3613'];
    const rockColors = ['#6b6b6b', '#5a5a5a', '#787878', '#647074'];
    const flowerColors = ['#fbbf24', '#f472b6', '#a78bfa', '#fb7185', '#f87171'];
    const grassColors = ['#3a6e24', '#2f5a1c', '#427a2a'];
    // Keep props well away from the path so they never block the view.
    const margin = PATH_HALF_WIDTH + 1.2;

    for (let z = MAP_MAX_Z; z >= MAP_MIN_Z; z -= 1.4) {
      for (let x = -MAP_HALF_X; x <= MAP_HALF_X; x += 1.4) {
        if (isOnPath(x, z, margin)) continue;

        const r = rng();
        const px = x + (rng() - 0.5) * 1.0;
        const pz = z + (rng() - 0.5) * 1.0;

        if (r < 0.08) {
          // Tree: SHORT trunk + COMPACT foliage that won't overhang the path
          const h = 1.8 + rng() * 1.8;
          const w = 0.45 + rng() * 0.4;
          trunks.push({
            pos: [px, h / 2, pz],
            scale: [w, h, w],
            color: trunkColors[Math.floor(rng() * trunkColors.length)],
          });
          foliage.push({
            pos: [px, h * 0.85, pz],
            scale: [w * 1.6, h * 0.9, w * 1.6],
            color: leafColors[Math.floor(rng() * leafColors.length)],
          });
        } else if (r < 0.13) {
          // Bush
          const h = 0.5 + rng() * 0.6;
          const w = 0.6 + rng() * 0.7;
          bushes.push({
            pos: [px, h / 2, pz],
            scale: [w, h, w],
            color: bushColors[Math.floor(rng() * bushColors.length)],
          });
        } else if (r < 0.17) {
          // Rock
          const h = 0.4 + rng() * 0.7;
          const w = 0.5 + rng() * 0.6;
          rocks.push({
            pos: [px, h / 2, pz],
            scale: [w, h, w],
            color: rockColors[Math.floor(rng() * rockColors.length)],
          });
        } else if (r < 0.20) {
          // Flower
          flowers.push({
            pos: [px, 0.25, pz],
            scale: [0.2, 0.4, 0.2],
            color: flowerColors[Math.floor(rng() * flowerColors.length)],
          });
        } else if (r < 0.32) {
          // Grass tuft
          grassTufts.push({
            pos: [px, 0.18, pz],
            scale: [0.35, 0.35, 0.35],
            color: grassColors[Math.floor(rng() * grassColors.length)],
          });
        } else if (r < 0.34) {
          // Small pond — blue plane sunk into the ground
          ponds.push({
            pos: [px, 0.03, pz],
            scale: [2 + rng() * 1.5, 0.05, 2 + rng() * 1.5],
            color: '#3b82f6',
          });
          // Lily pad on the pond
          if (rng() > 0.5) {
            lilies.push({
              pos: [px + (rng() - 0.5), 0.08, pz + (rng() - 0.5)],
              scale: [0.4, 0.05, 0.4],
              color: '#22c55e',
            });
          }
        }
        // else: open grass (drawn by the ground plane)
      }
    }

    return { pathTiles, trunks, foliage, bushes, rocks, flowers, grassTufts, lilies, ponds };
  }, []);

  return (
    <group>
      {/* Grass floor base */}
      <Plane
        args={[MAP_HALF_X * 2 + 2, MAP_MAX_Z - MAP_MIN_Z + 2]}
        position={[0, -0.02, (MAP_MAX_Z + MAP_MIN_Z) / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <meshStandardMaterial color="#2d5a1b" />
      </Plane>

      {/* Ponds (drawn under the path tiles & props) */}
      <Instances limit={Math.max(scene.ponds.length, 1)}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial />
        {scene.ponds.map((p, i) => (
          <Instance key={`pond${i}`} position={p.pos} scale={p.scale} color={p.color} />
        ))}
      </Instances>
      <Instances limit={Math.max(scene.lilies.length, 1)}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial />
        {scene.lilies.map((p, i) => (
          <Instance key={`lily${i}`} position={p.pos} scale={p.scale} color={p.color} />
        ))}
      </Instances>

      {/* Path tiles */}
      <Instances limit={Math.max(scene.pathTiles.length, 1)} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial />
        {scene.pathTiles.map((p, i) => (
          <Instance key={`p${i}`} position={p.pos} scale={p.scale} color={p.color} />
        ))}
      </Instances>

      {/* Grass tufts (scattered in the grass) */}
      <Instances limit={Math.max(scene.grassTufts.length, 1)}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial />
        {scene.grassTufts.map((p, i) => (
          <Instance key={`gr${i}`} position={p.pos} scale={p.scale} color={p.color} />
        ))}
      </Instances>

      {/* Flowers */}
      <Instances limit={Math.max(scene.flowers.length, 1)}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial />
        {scene.flowers.map((p, i) => (
          <Instance key={`fl${i}`} position={p.pos} scale={p.scale} color={p.color} />
        ))}
      </Instances>

      {/* Tree trunks */}
      <Instances limit={Math.max(scene.trunks.length, 1)} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial />
        {scene.trunks.map((p, i) => (
          <Instance key={`tr${i}`} position={p.pos} scale={p.scale} color={p.color} />
        ))}
      </Instances>

      {/* Tree foliage */}
      <Instances limit={Math.max(scene.foliage.length, 1)} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial />
        {scene.foliage.map((p, i) => (
          <Instance key={`fo${i}`} position={p.pos} scale={p.scale} color={p.color} />
        ))}
      </Instances>

      {/* Bushes */}
      <Instances limit={Math.max(scene.bushes.length, 1)} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial />
        {scene.bushes.map((p, i) => (
          <Instance key={`bu${i}`} position={p.pos} scale={p.scale} color={p.color} />
        ))}
      </Instances>

      {/* Rocks */}
      <Instances limit={Math.max(scene.rocks.length, 1)} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial />
        {scene.rocks.map((p, i) => (
          <Instance key={`ro${i}`} position={p.pos} scale={p.scale} color={p.color} />
        ))}
      </Instances>
    </group>
  );
}
