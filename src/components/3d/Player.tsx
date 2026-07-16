import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Box } from '@react-three/drei';
import { Vector3, Mesh, Group } from 'three';
import { useGameStore } from '../../store/useGameStore';
import { isOnPath, MAP_MIN_Z, MAP_MAX_Z } from './mapPath';

const SPEED = 5;
const COLLISION_DISTANCE = 1.5;

export default function Player() {
  const groupRef = useRef<Group>(null);
  const bodyRef = useRef<Mesh>(null);
  const { camera } = useThree();
  const keys = useRef<{ [key: string]: boolean }>({});

  const { gameState, enemies, enterBattleTransition } = useGameStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Only allow movement in EXPLORE state
    if (gameState !== 'EXPLORE') return;

    const moveDir = new Vector3(0, 0, 0);

    if (keys.current['KeyW'] || keys.current['ArrowUp']) moveDir.z -= 1;
    if (keys.current['KeyS'] || keys.current['ArrowDown']) moveDir.z += 1;
    if (keys.current['KeyA'] || keys.current['ArrowLeft']) moveDir.x -= 1;
    if (keys.current['KeyD'] || keys.current['ArrowRight']) moveDir.x += 1;

    if (moveDir.lengthSq() > 0) {
      moveDir.normalize().multiplyScalar(SPEED * delta);

      // Face the direction of travel (snappy 8-way, RPG style).
      const targetRotY = Math.atan2(moveDir.x, moveDir.z);
      let cur = groupRef.current.rotation.y;
      let diff = targetRotY - cur;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      groupRef.current.rotation.y = cur + diff * Math.min(1, delta * 12);

      const pos = groupRef.current.position;

      const tryX = pos.x + moveDir.x;
      if (isOnPath(tryX, pos.z) && pos.z > MAP_MIN_Z && pos.z < MAP_MAX_Z) {
        pos.x = tryX;
      }
      const tryZ = pos.z + moveDir.z;
      if (isOnPath(pos.x, tryZ) && tryZ > MAP_MIN_Z && tryZ < MAP_MAX_Z) {
        pos.z = tryZ;
      }
    }

    // Camera follow — smooth lerp toward the player for fluid movement.
    // Camera rotation is LOCKED (fixed pitch, zero yaw/roll) so the map
    // never tilts when the player strafes left/right. We only translate.
    const targetX = groupRef.current.position.x;
    const targetZ = groupRef.current.position.z + 10;
    const t = 1 - Math.pow(0.001, delta);
    camera.position.x += (targetX - camera.position.x) * t;
    camera.position.z += (targetZ - camera.position.z) * t;
    camera.position.y = 10;
    camera.rotation.set(-Math.PI / 4, 0, 0);

    // Enemy collision check
    const playerPos = groupRef.current.position;
    for (const enemy of enemies) {
      if (enemy.defeated) continue;

      const enemyPos = new Vector3(enemy.position[0], 0, enemy.position[2]);
      const distance = playerPos.distanceTo(enemyPos);

      if (distance < COLLISION_DISTANCE) {
        enterBattleTransition(enemy.id);
        break;
      }
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Cloak / robe — tapered pixel-wizard body */}
      <Box ref={bodyRef} args={[0.85, 1.0, 0.6]} position={[0, 0.5, 0]} castShadow>
        <meshStandardMaterial color="#3b3f9e" flatShading />
      </Box>
      {/* Robe trim (lighter band at the bottom) */}
      <Box args={[0.9, 0.18, 0.64]} position={[0, 0.09, 0]} castShadow>
        <meshStandardMaterial color="#6d71e0" flatShading />
      </Box>
      {/* Head / face */}
      <Box args={[0.55, 0.55, 0.55]} position={[0, 1.25, 0]} castShadow>
        <meshStandardMaterial color="#f1c27d" flatShading />
      </Box>
      {/* Eyes (dark pixels facing +z by default) */}
      <Box args={[0.1, 0.12, 0.05]} position={[-0.14, 1.3, 0.28]}>
        <meshStandardMaterial color="#1f2937" flatShading />
      </Box>
      <Box args={[0.1, 0.12, 0.05]} position={[0.14, 1.3, 0.28]}>
        <meshStandardMaterial color="#1f2937" flatShading />
      </Box>
      {/* Wide-brim wizard hat */}
      <Box args={[1.0, 0.16, 1.0]} position={[0, 1.62, 0]} castShadow>
        <meshStandardMaterial color="#1e3a8a" flatShading />
      </Box>
      {/* Hat cone */}
      <Box args={[0.5, 0.6, 0.5]} position={[0, 2.0, 0]} castShadow>
        <meshStandardMaterial color="#2747c4" flatShading />
      </Box>
      {/* Hat star (gold emblem) */}
      <Box args={[0.22, 0.22, 0.06]} position={[0, 1.85, 0.26]}>
        <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.6} flatShading />
      </Box>
      {/* Staff (held to the side) */}
      <Box args={[0.08, 1.7, 0.08]} position={[0.6, 0.85, 0.1]} castShadow>
        <meshStandardMaterial color="#7c4a1e" flatShading />
      </Box>
      <Box args={[0.26, 0.26, 0.26]} position={[0.6, 1.75, 0.1]}>
        <meshStandardMaterial color="#38bdf8" emissive="#0ea5e9" emissiveIntensity={1.2} flatShading />
      </Box>
    </group>
  );
}
