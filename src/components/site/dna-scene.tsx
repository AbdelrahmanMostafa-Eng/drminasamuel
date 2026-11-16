"use client";

import * as React from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";

const PAIRS = 30;

function Helix() {
  const group = React.useRef<THREE.Group>(null);
  const pairs = React.useMemo(
    () =>
      Array.from({ length: PAIRS }, (_, i) => {
        const angle = i * 0.42;
        const y = (i - PAIRS / 2) * 0.23;
        const r = 1.05;
        return {
          a: [Math.cos(angle) * r, y, Math.sin(angle) * r] as [number, number, number],
          b: [-Math.cos(angle) * r, y, -Math.sin(angle) * r] as [number, number, number],
          y,
          angle,
        };
      }),
    [],
  );
  const orange = React.useMemo(() => new THREE.MeshStandardMaterial({ color: "#ff8a1a", roughness: 0.25, metalness: 0.15, emissive: "#ff6a00", emissiveIntensity: 0.25 }), []);
  const blue = React.useMemo(() => new THREE.MeshStandardMaterial({ color: "#4fb0d6", roughness: 0.25, metalness: 0.2, emissive: "#1f607c", emissiveIntensity: 0.35 }), []);
  const bar = React.useMemo(() => new THREE.MeshStandardMaterial({ color: "#d6ebf3", roughness: 0.4, transparent: true, opacity: 0.55 }), []);
  const sphere = React.useMemo(() => new THREE.SphereGeometry(0.15, 28, 28), []);
  const cyl = React.useMemo(() => new THREE.CylinderGeometry(0.035, 0.035, 2.1, 10), []);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    g.rotation.y += delta * 0.32;
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, state.pointer.y * 0.25, 0.04);
    g.rotation.z = THREE.MathUtils.lerp(g.rotation.z, 0.38 - state.pointer.x * 0.2, 0.04);
    g.position.y = Math.sin(state.clock.elapsedTime * 0.6) * 0.12;
  });

  return (
    <group ref={group} rotation={[0, 0, 0.38]}>
      {pairs.map((p, i) => (
        <group key={i}>
          <mesh geometry={sphere} material={orange} position={p.a} />
          <mesh geometry={sphere} material={blue} position={p.b} />
          <mesh geometry={cyl} material={bar} position={[0, p.y, 0]} rotation={[0, -p.angle, Math.PI / 2]} />
        </group>
      ))}
    </group>
  );
}

function Particles({ count = 70 }) {
  const ref = React.useRef<THREE.Points>(null);
  const positions = React.useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 9;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 8;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 4 - 1;
    }
    return arr;
  }, [count]);
  useFrame((_, d) => {
    if (ref.current) ref.current.rotation.y += d * 0.03;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#9fd3e8" transparent opacity={0.7} sizeAttenuation />
    </points>
  );
}

export default function DnaScene({ className }: { className?: string }) {
  return (
    <div className={className}>
      <Canvas dpr={[1, 1.8]} camera={{ position: [0, 0, 6.8], fov: 45 }} gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}>
        <ambientLight intensity={0.55} />
        <directionalLight position={[3, 4, 5]} intensity={1.4} />
        <pointLight position={[-4, -2, 2]} intensity={18} color="#ff8a1a" />
        <pointLight position={[4, 3, 2]} intensity={14} color="#4fb0d6" />
        <Helix />
        <Particles />
      </Canvas>
    </div>
  );
}
