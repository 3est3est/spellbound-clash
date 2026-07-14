import { Box } from '@react-three/drei';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

interface BattlePlayerProps {
  shake?: boolean;
}

export default function BattlePlayer({ shake = false }: BattlePlayerProps) {
  const group = useRef<any>(null);

  useFrame((state) => {
    if (group.current) {
      group.current.position.x = shake ? Math.sin(state.clock.elapsedTime * 40) * 0.15 : 0;
    }
  });

  return (
    <group ref={group} scale={[2, 2, 2]} rotation={[0, Math.PI, 0]}>
      {/* Body / robe */}
      <Box args={[0.8, 1.0, 0.6]} position={[0, 0.5, 0]}>
        <meshStandardMaterial color="#2563eb" flatShading />
      </Box>
      {/* Head */}
      <Box args={[0.6, 0.6, 0.6]} position={[0, 1.3, 0]}>
        <meshStandardMaterial color="#f1c27d" flatShading />
      </Box>
      {/* Hat */}
      <Box args={[0.8, 0.35, 0.7]} position={[0, 1.7, 0]}>
        <meshStandardMaterial color="#1e3a8a" flatShading />
      </Box>
      <Box args={[0.3, 0.5, 0.3]} position={[0, 2.0, 0]}>
        <meshStandardMaterial color="#1e3a8a" flatShading />
      </Box>
    </group>
  );
}