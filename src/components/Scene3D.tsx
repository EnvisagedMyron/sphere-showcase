import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { Suspense, useState } from 'react';
import GeometricShape from './GeometricShape';
import InfoModal from './InfoModal';

interface SelectedObject {
  name: string;
  description: string;
}

const Scene3D = () => {
  const [selectedObject, setSelectedObject] = useState<SelectedObject | null>(null);

  const handleShapeClick = (name: string) => {
    setSelectedObject({
      name,
      description: 'hello',
    });
  };

  const closeModal = () => {
    setSelectedObject(null);
  };

  return (
    <div className="relative w-full h-screen">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        className="bg-background"
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <pointLight position={[-10, -10, -5]} intensity={0.5} color="#4f46e5" />
          <pointLight position={[10, -10, 5]} intensity={0.5} color="#7c3aed" />
          
          <GeometricShape
            type="sphere"
            position={[-3, 0, 0]}
            color="#4f8ff7"
            onClick={() => handleShapeClick('Sphere')}
          />
          <GeometricShape
            type="cube"
            position={[0, 0, 0]}
            color="#8b5cf6"
            onClick={() => handleShapeClick('Cube')}
          />
          <GeometricShape
            type="cylinder"
            position={[3, 0, 0]}
            color="#22d3ee"
            onClick={() => handleShapeClick('Cylinder')}
          />
          
          <Environment preset="city" />
          
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={3}
            maxDistance={20}
          />
        </Suspense>
      </Canvas>
      
      <InfoModal
        isOpen={selectedObject !== null}
        onClose={closeModal}
        name={selectedObject?.name || ''}
        description={selectedObject?.description || ''}
      />
      
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
        <p className="text-muted-foreground text-sm">
          <span className="text-foreground font-medium">Left Click + Drag</span> to rotate • 
          <span className="text-foreground font-medium"> Shift + Left Click</span> to pan • 
          <span className="text-foreground font-medium"> Click shapes</span> for info
        </p>
      </div>
    </div>
  );
};

export default Scene3D;
