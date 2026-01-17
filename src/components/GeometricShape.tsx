import { useRef, useState } from 'react';
import { Mesh, Vector3 } from 'three';
import { useFrame, useThree } from '@react-three/fiber';

interface GeometricShapeProps {
  type: 'sphere' | 'cube' | 'cylinder';
  position: [number, number, number];
  color: string;
  opacity?: number;
  visible?: boolean;
  onClick: (screenPosition: { x: number; y: number }) => void;
}

const GeometricShape = ({ type, position, color, opacity = 1, visible = true, onClick }: GeometricShapeProps) => {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const { camera, gl } = useThree();

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.1;
    }
  });

  const handleClick = (event: { stopPropagation: () => void }) => {
    event.stopPropagation();
    
    if (meshRef.current) {
      const vector = new Vector3();
      meshRef.current.getWorldPosition(vector);
      vector.project(camera);
      
      const x = (vector.x * 0.5 + 0.5) * gl.domElement.clientWidth;
      const y = (-vector.y * 0.5 + 0.5) * gl.domElement.clientHeight;
      
      onClick({ x, y });
    }
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

  if (!visible) return null;

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
        transparent={opacity < 1}
        opacity={opacity}
      />
    </mesh>
  );
};

export default GeometricShape;
