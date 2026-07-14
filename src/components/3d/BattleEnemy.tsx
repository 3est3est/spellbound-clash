import { Box } from '@react-three/drei';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

interface BattleEnemyProps {
  shake?: boolean;
}

export default function BattleEnemy({ shake = false }: BattleEnemyProps) {
  const group = useRef<any>(null);

  useFrame((state) => {
    if (group.current) {
      group.current.position.x = shake ? Math.sin(state.clock.elapsedTime * 40) * 0.15 : 0;
    }
  });

  return (
    <group ref={group} scale={[2, 2, 2]}>
      {/* Body */}
      <Box args={[0.8, 0.9, 0.7]} position={[0, 0.45, 0]}>
        <meshStandardMaterial color="#7f1d1d" flatShading />
      </Box>
      {/* Head */}
      <Box args={[0.6, 0.6, 0.6]} position={[0, 1.2, 0]}>
        <meshStandardMaterial color="#b91c1c" flatShading />
      </Box>
      {/* Horns */}
      <Box args={[0.18, 0.3, 0.18]} position={[-0.22, 1.62, 0]}>
        <meshStandardMaterial color="#450a0a" flatShading />
      </Box>
      <Box args={[0.18, 0.3, 0.18]} position={[0.22, 1.62, 0]}>
        <meshStandardMaterial color="#450a0a" flatShading />
      </Box>
      {/* Glowing eyes */}
      <Box args={[0.14, 0.14, 0.05]} position={[-0.15, 1.25, 0.32]}>
        <meshStandardMaterial
          color="#fde047"
          emissive="#facc15"
          emissiveIntensity={1.2}
          flatShading
        />
      </Box>
      <Box args={[0.14, 0.14, 0.05]} position={[0.15, 1.25, 0.32]}>
        <meshStandardMaterial
          color="#fde047"
          emissive="#facc15"
          emissiveIntensity={1.2}
          flatShading
        />
      </Box>
    </group>
  );
}