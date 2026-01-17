import { useRef, useState } from 'react';
import { Mesh } from 'three';
import { useFrame } from '@react-three/fiber';

interface GeometricShapeProps {
  type: 'sphere' | 'cube' | 'cylinder';
  position: [number, number, number];
  color: string;
  onClick: () => void;
}

const GeometricShape = ({ type, position, color, onClick }: GeometricShapeProps) => {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.1;
    }
  });

  const handleClick = (event: { stopPropagation: () => void }) => {
    event.stopPropagation();
    onClick();
  };

  const getGeometry = () => {
    switch (type) {
      case 'sphere':
        return <sphereGeometry args={[0.8, 64, 64]} />;
      case 'cube':
        return <boxGeometry args={[1.3, 1.3, 1.3]} />;
      case 'cylinder':
        return <cylinderGeometry args={[0.6, 0.6, 1.5, 64]} />;
      default:
        return <boxGeometry args={[1, 1, 1]} />;
    }
  };

  return (
    <mesh
      ref={meshRef}
      position={position}
      onClick={handleClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      scale={hovered ? 1.1 : 1}
    >
      {getGeometry()}
      <meshStandardMaterial
        color={color}
        roughness={0.2}
        metalness={0.8}
        emissive={color}
        emissiveIntensity={hovered ? 0.4 : 0.1}
      />
    </mesh>
  );
};

export default GeometricShape;
