import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { Suspense, useState, useEffect, useRef } from 'react';
import GeometricShape from './GeometricShape';
import InfoModal from './InfoModal';
import { Slider } from './ui/slider';

interface SelectedObject {
  name: string;
  description: string;
  position: { x: number; y: number };
}

const Scene3D = () => {
  const [selectedObject, setSelectedObject] = useState<SelectedObject | null>(null);
  const [altPressed, setAltPressed] = useState(false);
  const [visibilityValue, setVisibilityValue] = useState([100]);
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        setAltPressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        setAltPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Update orbit controls when alt state changes
  useEffect(() => {
    if (controlsRef.current) {
      if (altPressed) {
        controlsRef.current.minPolarAngle = 0;
        controlsRef.current.maxPolarAngle = Math.PI;
      } else {
        controlsRef.current.minPolarAngle = Math.PI / 2;
        controlsRef.current.maxPolarAngle = Math.PI / 2;
      }
    }
  }, [altPressed]);

  const handleShapeClick = (name: string, screenPosition: { x: number; y: number }) => {
    setSelectedObject({
      name,
      description: 'hello',
      position: screenPosition,
    });
  };

  const closeModal = () => {
    setSelectedObject(null);
  };

  // Calculate visibility for each object based on slider
  const value = visibilityValue[0];
  
  const getObjectState = (index: number): { opacity: number; visible: boolean } => {
    // Object 1 (Sphere): visible from 33-100
    // Object 2 (Cube): visible from 66-100  
    // Object 3 (Cylinder): visible from 100
    const thresholds = [33.33, 66.66, 100];
    const threshold = thresholds[index];
    const prevThreshold = index > 0 ? thresholds[index - 1] : 0;
    
    if (value >= threshold) {
      return { opacity: 1, visible: true };
    } else if (value > prevThreshold) {
      // Transitioning - calculate opacity
      const range = threshold - prevThreshold;
      const progress = (value - prevThreshold) / range;
      return { opacity: progress, visible: true };
    }
    return { opacity: 0, visible: false };
  };

  const sphereState = getObjectState(0);
  const cubeState = getObjectState(1);
  const cylinderState = getObjectState(2);

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
            opacity={sphereState.opacity}
            visible={sphereState.visible}
            onClick={(pos) => handleShapeClick('Sphere', pos)}
          />
          <GeometricShape
            type="cube"
            position={[0, 0, 0]}
            color="#8b5cf6"
            opacity={cubeState.opacity}
            visible={cubeState.visible}
            onClick={(pos) => handleShapeClick('Cube', pos)}
          />
          <GeometricShape
            type="cylinder"
            position={[3, 0, 0]}
            color="#22d3ee"
            opacity={cylinderState.opacity}
            visible={cylinderState.visible}
            onClick={(pos) => handleShapeClick('Cylinder', pos)}
          />
          
          <Environment preset="city" />
          
          <OrbitControls
            ref={controlsRef}
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={3}
            maxDistance={20}
            minPolarAngle={Math.PI / 2}
            maxPolarAngle={Math.PI / 2}
          />
        </Suspense>
      </Canvas>
      
      <InfoModal
        isOpen={selectedObject !== null}
        onClose={closeModal}
        name={selectedObject?.name || ''}
        description={selectedObject?.description || ''}
        position={selectedObject?.position || { x: 0, y: 0 }}
      />
      
      {/* Visibility Slider */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 glass-panel rounded-xl px-6 py-4 w-80">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Objects</span>
          <span className="text-xs text-muted-foreground">
            {value >= 100 ? '3' : value >= 66.66 ? '2' : value >= 33.33 ? '1' : '0'} visible
          </span>
        </div>
        <Slider
          value={visibilityValue}
          onValueChange={setVisibilityValue}
          max={100}
          step={1}
          className="w-full"
        />
      </div>
      
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
        <p className="text-muted-foreground text-sm">
          <span className="text-foreground font-medium">Left Click + Drag</span> to rotate • 
          <span className="text-foreground font-medium"> Alt</span> for vertical • 
          <span className="text-foreground font-medium"> Shift + Click</span> to pan • 
          <span className="text-foreground font-medium"> Click shapes</span> for info
        </p>
      </div>
    </div>
  );
};

export default Scene3D;
