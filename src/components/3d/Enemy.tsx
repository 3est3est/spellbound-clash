import { Box } from '@react-three/drei';
import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Group } from 'three';
import { type EnemyData } from '../../types/game.types';

// Enemies stay hidden until the player gets within this radius, then fade in
// (mirrors the fog-of-war "gradual reveal" from the design spec).
const REVEAL_RADIUS = 24;

interface EnemyProps {
  enemy: EnemyData;
}

export default function Enemy({ enemy }: EnemyProps) {
  const groupRef = useRef<Group>(null);
  const { camera } = useThree();

  useFrame(() => {
    if (!groupRef.current || enemy.defeated) return;
    // The camera sits 10 units behind the player (see Player.tsx), so the
    // player's ground position is derived from the camera each frame.
    const px = camera.position.x;
    const pz = camera.position.z - 10;
    const dx = enemy.position[0] - px;
    const dz = enemy.position[2] - pz;
    groupRef.current.visible = Math.sqrt(dx * dx + dz * dz) < REVEAL_RADIUS;

    // Face the player (confrontational, Pokémon-style encounter).
    const angle = Math.atan2(px - enemy.position[0], pz - enemy.position[2]);
    let cur = groupRef.current.rotation.y;
    let diff = angle - cur;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    groupRef.current.rotation.y = cur + diff * 0.15;
  });

  if (enemy.defeated) return null;

  return (
    <group ref={groupRef} position={enemy.position}>
      {/* Lower body / robe */}
      <Box args={[0.9, 0.8, 0.7]} position={[0, 0.4, 0]} castShadow>
        <meshStandardMaterial color="#450a0a" flatShading />
      </Box>
      {/* Torso */}
      <Box args={[0.8, 0.7, 0.7]} position={[0, 1.0, 0]} castShadow>
        <meshStandardMaterial color="#7f1d1d" flatShading />
      </Box>
      {/* Head */}
      <Box args={[0.62, 0.6, 0.6]} position={[0, 1.55, 0]} castShadow>
        <meshStandardMaterial color="#991b1b" flatShading />
      </Box>
      {/* Horns */}
      <Box args={[0.16, 0.42, 0.16]} position={[-0.26, 1.95, 0]} rotation={[0, 0, 0.3]} castShadow>
        <meshStandardMaterial color="#1c0606" flatShading />
      </Box>
      <Box args={[0.16, 0.42, 0.16]} position={[0.26, 1.95, 0]} rotation={[0, 0, -0.3]} castShadow>
        <meshStandardMaterial color="#1c0606" flatShading />
      </Box>
      {/* Glowing eyes (menacing) */}
      <Box args={[0.15, 0.15, 0.05]} position={[-0.16, 1.6, 0.31]}>
        <meshStandardMaterial color="#fde047" emissive="#facc15" emissiveIntensity={1.6} flatShading />
      </Box>
      <Box args={[0.15, 0.15, 0.05]} position={[0.16, 1.6, 0.31]}>
        <meshStandardMaterial color="#fde047" emissive="#facc15" emissiveIntensity={1.6} flatShading />
      </Box>
      {/* Fanged mouth */}
      <Box args={[0.4, 0.12, 0.05]} position={[0, 1.42, 0.31]}>
        <meshStandardMaterial color="#3f0a0a" flatShading />
      </Box>
      {/* Claws / hands */}
      <Box args={[0.18, 0.4, 0.18]} position={[-0.5, 0.95, 0.1]} castShadow>
        <meshStandardMaterial color="#7f1d1d" flatShading />
      </Box>
      <Box args={[0.18, 0.4, 0.18]} position={[0.5, 0.95, 0.1]} castShadow>
        <meshStandardMaterial color="#7f1d1d" flatShading />
      </Box>
    </group>
  );
}
