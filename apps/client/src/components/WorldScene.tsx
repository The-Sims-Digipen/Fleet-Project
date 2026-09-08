import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";

type Material = "matte" | "glossy" | "metal";

const materialValues: Record<Material, { roughness: number; metalness: number }> = {
  matte: { roughness: 0.9, metalness: 0 },
  glossy: { roughness: 0.18, metalness: 0.1 },
  metal: { roughness: 0.3, metalness: 0.85 },
};

export function WorldScene({
  size,
  rotation,
  light,
  color,
  material,
  wireframe,
}: {
  size: number;
  rotation: number;
  light: number;
  color: string;
  material: Material;
  wireframe: boolean;
}) {
  return (
    <div className="scene-canvas">
      <p className="sr-only">Interactive 3D world containing one plane.</p>
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [8, 7, 9], fov: 42, near: 0.1, far: 60 }}
        fallback={<div className="scene-fallback">WebGL is unavailable.</div>}
      >
        <color attach="background" args={["#07100f"]} />
        <ambientLight intensity={0.35 + light / 100} />
        <directionalLight position={[6, 9, 5]} intensity={0.5 + light / 45} color="#ffffff" />

        <mesh rotation={[-Math.PI / 2, rotation * (Math.PI / 180), 0]}>
          <planeGeometry args={[size, size]} />
          <meshStandardMaterial color={color} wireframe={wireframe} {...materialValues[material]} />
        </mesh>

        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.06}
          minDistance={4}
          maxDistance={24}
          maxPolarAngle={Math.PI / 2.02}
          target={[0, 0, 0]}
        />
      </Canvas>
    </div>
  );
}
