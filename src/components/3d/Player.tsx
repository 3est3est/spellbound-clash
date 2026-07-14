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

    // Camera follow — smooth lerp toward the player so movement stays
    // fluid and the low-res pixel render doesn't jitter.
    const targetX = groupRef.current.position.x;
    const targetZ = groupRef.current.position.z + 10;
    const t = 1 - Math.pow(0.001, delta); // frame-rate independent lerp
    camera.position.x += (targetX - camera.position.x) * t;
    camera.position.z += (targetZ - camera.position.z) * t;
    camera.lookAt(
      camera.position.x,
      0,
      camera.position.z - 10
    );

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
      {/* Body / robe */}
      <Box ref={bodyRef} args={[0.8, 1.0, 0.6]} position={[0, 0.5, 0]} castShadow>
        <meshStandardMaterial color="#2563eb" flatShading />
      </Box>
      {/* Head */}
      <Box args={[0.6, 0.6, 0.6]} position={[0, 1.3, 0]} castShadow>
        <meshStandardMaterial color="#f1c27d" flatShading />
      </Box>
      {/* Hat */}
      <Box args={[0.8, 0.35, 0.7]} position={[0, 1.7, 0]} castShadow>
        <meshStandardMaterial color="#1e3a8a" flatShading />
      </Box>
      <Box args={[0.3, 0.5, 0.3]} position={[0, 2.0, 0]} castShadow>
        <meshStandardMaterial color="#1e3a8a" flatShading />
      </Box>
    </group>
  );
}
