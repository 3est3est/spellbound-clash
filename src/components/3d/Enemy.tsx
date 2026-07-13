import { Box } from '@react-three/drei';
import { type EnemyData } from '../../types/game.types';

interface EnemyProps {
  enemy: EnemyData;
}

export default function Enemy({ enemy }: EnemyProps) {
  if (enemy.defeated) return null;

  return (
    <group position={enemy.position}>
      {/* Body */}
      <Box args={[0.8, 0.9, 0.7]} position={[0, 0.45, 0]} castShadow>
        <meshStandardMaterial color="#7f1d1d" flatShading />
      </Box>
      {/* Head */}
      <Box args={[0.6, 0.6, 0.6]} position={[0, 1.2, 0]} castShadow>
        <meshStandardMaterial color="#b91c1c" flatShading />
      </Box>
      {/* Horns */}
      <Box args={[0.18, 0.3, 0.18]} position={[-0.22, 1.62, 0]} castShadow>
        <meshStandardMaterial color="#450a0a" flatShading />
      </Box>
      <Box args={[0.18, 0.3, 0.18]} position={[0.22, 1.62, 0]} castShadow>
        <meshStandardMaterial color="#450a0a" flatShading />
      </Box>
      {/* Glowing eyes */}
      <Box args={[0.14, 0.14, 0.05]} position={[-0.15, 1.25, 0.32]}>
        <meshStandardMaterial color="#fde047" emissive="#facc15" emissiveIntensity={1.2} flatShading />
      </Box>
      <Box args={[0.14, 0.14, 0.05]} position={[0.15, 1.25, 0.32]}>
        <meshStandardMaterial color="#fde047" emissive="#facc15" emissiveIntensity={1.2} flatShading />
      </Box>
    </group>
  );
}
