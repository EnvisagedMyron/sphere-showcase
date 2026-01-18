import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { Vector3 } from 'three';
import GeometricShape from './GeometricShape';
import InfoModal from './InfoModal';
import { Slider } from './ui/slider';

interface SelectedObject {
  name: string;
  description: string;
  shapeWorldPosition: Vector3;
}

// Custom camera controls component
const CameraControls = ({ onVoidClick }: { onVoidClick: () => void }) => {
  const { camera, gl } = useThree();
  const isDragging = useRef(false);
  const hasMoved = useRef(false);
  const mouseDownTime = useRef(0);
  const altPressed = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  // theta = horizontal rotation, cameraY = vertical position, phi = vertical rotation angle (for alt mode)
  const cameraState = useRef({ 
    theta: 0, 
    cameraY: 0, 
    phi: Math.PI / 2, 
    radius: 8,
    // Store base values for alt mode transitions
    baseTheta: 0,
    basePhi: Math.PI / 2
  });

  const updateCamera = useCallback(() => {
    const { theta, cameraY, phi, radius } = cameraState.current;
    
    if (altPressed.current) {
      // Alt mode: spherical coords for vertical rotation (phi controls up/down angle)
      camera.position.x = radius * Math.sin(phi) * Math.sin(theta);
      camera.position.y = radius * Math.cos(phi);
      camera.position.z = radius * Math.sin(phi) * Math.cos(theta);
    } else {
      // Normal mode: horizontal rotation + vertical TRANSLATION (Y-axis movement)
      // Camera orbits horizontally at fixed radius on XZ plane, but Y is independent
      camera.position.x = radius * Math.sin(theta);
      camera.position.y = cameraY;
      camera.position.z = radius * Math.cos(theta);
    }
    camera.lookAt(0, 0, 0);
  }, [camera]);

  useEffect(() => {
    const canvas = gl.domElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Alt' && !altPressed.current) {
        altPressed.current = true;
        // Calculate phi from current camera Y position relative to origin
        const { radius, cameraY } = cameraState.current;
        // Get actual distance from origin to camera
        const actualRadius = Math.sqrt(radius * radius + cameraY * cameraY);
        // Clamp for acos
        const clampedRatio = Math.max(-0.99, Math.min(0.99, cameraY / actualRadius));
        cameraState.current.phi = Math.acos(clampedRatio);
        cameraState.current.radius = actualRadius;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt' && altPressed.current) {
        altPressed.current = false;
        // Convert back: calculate cameraY from current phi and keep horizontal radius
        const { radius, phi, theta } = cameraState.current;
        cameraState.current.cameraY = radius * Math.cos(phi);
        // Recalculate horizontal radius (distance on XZ plane)
        const horizontalRadius = radius * Math.sin(phi);
        cameraState.current.radius = horizontalRadius > 0.5 ? horizontalRadius : 8;
        updateCamera();
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0 && !e.shiftKey) {
        isDragging.current = true;
        hasMoved.current = false;
        mouseDownTime.current = Date.now();
        lastMouse.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;

      const deltaX = e.clientX - lastMouse.current.x;
      const deltaY = e.clientY - lastMouse.current.y;
      
      // Consider it moved if more than 3px
      if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
        hasMoved.current = true;
      }
      
      lastMouse.current = { x: e.clientX, y: e.clientY };

      // Horizontal drag = rotate horizontally
      cameraState.current.theta -= deltaX * 0.01;

      if (altPressed.current) {
        // Alt + vertical drag = vertical rotation (change phi) - NON-INVERTED
        // Moving mouse DOWN rotates camera DOWN (increases phi toward PI)
        cameraState.current.phi -= deltaY * 0.01;
        cameraState.current.phi = Math.max(0.1, Math.min(Math.PI - 0.1, cameraState.current.phi));
      } else {
        // Normal vertical drag = TRANSLATE camera on Y axis
        // Mouse UP moves camera UP (positive Y), mouse DOWN moves camera DOWN (negative Y)
        cameraState.current.cameraY -= deltaY * 0.05;
        cameraState.current.cameraY = Math.max(-10, Math.min(10, cameraState.current.cameraY));
      }

      updateCamera();
    };

    const handleMouseUp = (e: MouseEvent) => {
      const wasDragging = isDragging.current;
      const didMove = hasMoved.current;
      const duration = Date.now() - mouseDownTime.current;
      isDragging.current = false;
      
      // Single click (short, no movement) on void = close modal
      if (wasDragging && !didMove && duration < 200) {
        onVoidClick();
      }
    };

    const handleWheel = (e: WheelEvent) => {
      cameraState.current.radius += e.deltaY * 0.01;
      cameraState.current.radius = Math.max(3, Math.min(20, cameraState.current.radius));
      updateCamera();
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('wheel', handleWheel);

    updateCamera();

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [gl, updateCamera, onVoidClick]);

  return null;
};

// Component to track shape screen positions dynamically
const ShapeScreenTracker = ({ 
  worldPosition, 
  onPositionUpdate 
}: { 
  worldPosition: Vector3; 
  onPositionUpdate: (pos: { x: number; y: number }) => void;
}) => {
  const { camera, gl } = useThree();
  
  useFrame(() => {
    const vector = worldPosition.clone();
    vector.project(camera);
    const x = (vector.x * 0.5 + 0.5) * gl.domElement.clientWidth;
    const y = (-vector.y * 0.5 + 0.5) * gl.domElement.clientHeight;
    onPositionUpdate({ x, y });
  });
  
  return null;
};

const Scene3D = () => {
  const [selectedObject, setSelectedObject] = useState<SelectedObject | null>(null);
  const [selectedShapeName, setSelectedShapeName] = useState<string | null>(null);
  const [shapeScreenPosition, setShapeScreenPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  // Store the fixed modal position (where popup was opened)
  const [fixedModalPosition, setFixedModalPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [basicVisibility, setBasicVisibility] = useState([100]);
  const [pyramidVisibility, setPyramidVisibility] = useState([100]);

  const handleShapeClick = (name: string, screenPosition: { x: number; y: number }, worldPosition: Vector3) => {
    setSelectedObject({
      name,
      description: 'hello',
      shapeWorldPosition: worldPosition.clone(),
    });
    setSelectedShapeName(name);
    setShapeScreenPosition(screenPosition);
    // Fix the modal position at click time - it won't move with camera
    setFixedModalPosition(screenPosition);
  };

  const closeModal = useCallback(() => {
    setSelectedObject(null);
    setSelectedShapeName(null);
  }, []);

  // Calculate visibility for basic shapes (sphere, cube, cylinder)
  const getBasicObjectState = (index: number): { opacity: number; visible: boolean } => {
    const value = basicVisibility[0];
    const thresholds = [33.33, 66.66, 100];
    const threshold = thresholds[index];
    const prevThreshold = index > 0 ? thresholds[index - 1] : 0;
    
    if (value >= threshold) {
      return { opacity: 1, visible: true };
    } else if (value > prevThreshold) {
      const range = threshold - prevThreshold;
      const progress = (value - prevThreshold) / range;
      return { opacity: progress, visible: true };
    }
    return { opacity: 0, visible: false };
  };

  // Calculate visibility for pyramids
  const getPyramidObjectState = (index: number): { opacity: number; visible: boolean } => {
    const value = pyramidVisibility[0];
    const thresholds = [33.33, 66.66, 100];
    const threshold = thresholds[index];
    const prevThreshold = index > 0 ? thresholds[index - 1] : 0;
    
    if (value >= threshold) {
      return { opacity: 1, visible: true };
    } else if (value > prevThreshold) {
      const range = threshold - prevThreshold;
      const progress = (value - prevThreshold) / range;
      return { opacity: progress, visible: true };
    }
    return { opacity: 0, visible: false };
  };

  // Apply selection dimming
  const getAdjustedOpacity = (baseOpacity: number, shapeName: string) => {
    if (selectedShapeName && selectedShapeName !== shapeName) {
      return Math.min(baseOpacity, 0.5);
    }
    return baseOpacity;
  };

  const sphereState = getBasicObjectState(0);
  const cubeState = getBasicObjectState(1);
  const cylinderState = getBasicObjectState(2);

  const pyramid1State = getPyramidObjectState(0);
  const pyramid2State = getPyramidObjectState(1);
  const pyramid3State = getPyramidObjectState(2);

  const basicValue = basicVisibility[0];
  const pyramidValue = pyramidVisibility[0];

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
          
          {/* Basic shapes - top row */}
          <GeometricShape
            type="sphere"
            position={[-3, 1.5, 0]}
            color="#4f8ff7"
            opacity={getAdjustedOpacity(sphereState.opacity, 'Sphere')}
            visible={sphereState.visible}
            onClick={(pos, worldPos) => handleShapeClick('Sphere', pos, worldPos)}
          />
          <GeometricShape
            type="cube"
            position={[0, 1.5, 0]}
            color="#8b5cf6"
            opacity={getAdjustedOpacity(cubeState.opacity, 'Cube')}
            visible={cubeState.visible}
            onClick={(pos, worldPos) => handleShapeClick('Cube', pos, worldPos)}
          />
          <GeometricShape
            type="cylinder"
            position={[3, 1.5, 0]}
            color="#22d3ee"
            opacity={getAdjustedOpacity(cylinderState.opacity, 'Cylinder')}
            visible={cylinderState.visible}
            onClick={(pos, worldPos) => handleShapeClick('Cylinder', pos, worldPos)}
          />
          
          {/* Pyramids - bottom row */}
          <GeometricShape
            type="pyramid"
            position={[-3, -1.5, 0]}
            color="#f97316"
            opacity={getAdjustedOpacity(pyramid1State.opacity, 'Pyramid 1')}
            visible={pyramid1State.visible}
            onClick={(pos, worldPos) => handleShapeClick('Pyramid 1', pos, worldPos)}
          />
          <GeometricShape
            type="pyramid"
            position={[0, -1.5, 0]}
            color="#ef4444"
            opacity={getAdjustedOpacity(pyramid2State.opacity, 'Pyramid 2')}
            visible={pyramid2State.visible}
            onClick={(pos, worldPos) => handleShapeClick('Pyramid 2', pos, worldPos)}
          />
          <GeometricShape
            type="pyramid"
            position={[3, -1.5, 0]}
            color="#eab308"
            opacity={getAdjustedOpacity(pyramid3State.opacity, 'Pyramid 3')}
            visible={pyramid3State.visible}
            onClick={(pos, worldPos) => handleShapeClick('Pyramid 3', pos, worldPos)}
          />
          
          <Environment preset="city" />
          <CameraControls onVoidClick={closeModal} />
          
          {/* Track selected shape position dynamically */}
          {selectedObject && (
            <ShapeScreenTracker 
              worldPosition={selectedObject.shapeWorldPosition} 
              onPositionUpdate={setShapeScreenPosition}
            />
          )}
        </Suspense>
      </Canvas>
      
      <InfoModal
        isOpen={selectedObject !== null}
        onClose={closeModal}
        name={selectedObject?.name || ''}
        description={selectedObject?.description || ''}
        shapePosition={shapeScreenPosition}
        modalPosition={fixedModalPosition}
      />
      
      {/* Left side sliders */}
      <div className="absolute top-1/2 left-8 -translate-y-1/2 flex flex-col gap-6">
        {/* Basic shapes slider */}
        <div className="glass-panel rounded-xl px-4 py-4 w-48">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Basic Shapes</span>
            <span className="text-xs text-muted-foreground">
              {basicValue >= 100 ? '3' : basicValue >= 66.66 ? '2' : basicValue >= 33.33 ? '1' : '0'}
            </span>
          </div>
          <Slider
            value={basicVisibility}
            onValueChange={setBasicVisibility}
            max={100}
            step={1}
            className="w-full"
          />
        </div>
        
        {/* Pyramid slider */}
        <div className="glass-panel rounded-xl px-4 py-4 w-48">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Pyramids</span>
            <span className="text-xs text-muted-foreground">
              {pyramidValue >= 100 ? '3' : pyramidValue >= 66.66 ? '2' : pyramidValue >= 33.33 ? '1' : '0'}
            </span>
          </div>
          <Slider
            value={pyramidVisibility}
            onValueChange={setPyramidVisibility}
            max={100}
            step={1}
            className="w-full"
          />
        </div>
      </div>
      
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
        <p className="text-muted-foreground text-sm">
<span className="text-foreground font-medium">Drag</span> to rotate/move • 
          <span className="text-foreground font-medium"> Alt + Drag</span> vertical rotation • 
          <span className="text-foreground font-medium"> Scroll</span> to zoom
        </p>
      </div>
    </div>
  );
};

export default Scene3D;
