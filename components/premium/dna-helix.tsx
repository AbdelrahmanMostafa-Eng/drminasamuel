"use client"

import * as React from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Float, Environment } from "@react-three/drei"
import * as THREE from "three"

const PAIRS = 26
const RISE = 0.42
const RADIUS = 1.35
const TWIST = 0.55

function Helix() {
  const group = React.useRef<THREE.Group>(null)
  const pointer = React.useRef({ x: 0, y: 0 })

  React.useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth - 0.5) * 2
      pointer.current.y = (e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener("pointermove", onMove)
    return () => window.removeEventListener("pointermove", onMove)
  }, [])

  useFrame((state, delta) => {
    if (!group.current) return
    group.current.rotation.y += delta * 0.35
    const targetX = pointer.current.y * 0.25 + 0.25
    const targetZ = pointer.current.x * 0.15
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, targetX, 0.05)
    group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, targetZ, 0.05)
  })

  const nodes = React.useMemo(() => {
    const items: { a: THREE.Vector3; b: THREE.Vector3; mid: THREE.Vector3; len: number; rot: THREE.Euler; i: number }[] = []
    for (let i = 0; i < PAIRS; i++) {
      const t = i * TWIST
      const y = (i - PAIRS / 2) * RISE
      const a = new THREE.Vector3(Math.cos(t) * RADIUS, y, Math.sin(t) * RADIUS)
      const b = new THREE.Vector3(Math.cos(t + Math.PI) * RADIUS, y, Math.sin(t + Math.PI) * RADIUS)
      const mid = a.clone().add(b).multiplyScalar(0.5)
      const dir = b.clone().sub(a)
      const len = dir.length()
      const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize())
      const rot = new THREE.Euler().setFromQuaternion(quat)
      items.push({ a, b, mid, len, rot, i })
    }
    return items
  }, [])

  const primary = "#3f7a99"
  const brand = "#f2a23a"
  const light = "#cfe6f2"

  return (
    <group ref={group}>
      {nodes.map(({ a, b, mid, len, rot, i }) => (
        <group key={i}>
          <mesh position={a}>
            <sphereGeometry args={[0.22, 24, 24]} />
            <meshStandardMaterial color={i % 3 === 0 ? brand : primary} roughness={0.25} metalness={0.35} />
          </mesh>
          <mesh position={b}>
            <sphereGeometry args={[0.22, 24, 24]} />
            <meshStandardMaterial color={i % 3 === 1 ? brand : primary} roughness={0.25} metalness={0.35} />
          </mesh>
          <mesh position={mid} rotation={rot}>
            <cylinderGeometry args={[0.05, 0.05, len, 12]} />
            <meshStandardMaterial color={light} roughness={0.5} metalness={0.1} transparent opacity={0.85} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function Particles() {
  const ref = React.useRef<THREE.Points>(null)
  const positions = React.useMemo(() => {
    const arr = new Float32Array(260 * 3)
    for (let i = 0; i < 260; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 14
      arr[i * 3 + 1] = (Math.random() - 0.5) * 14
      arr[i * 3 + 2] = (Math.random() - 0.5) * 8 - 2
    }
    return arr
  }, [])
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y -= delta * 0.04
  })
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#8fb8cc" transparent opacity={0.7} sizeAttenuation />
    </points>
  )
}

export function DnaHelix({ className }: { className?: string }) {
  return (
    <div className={className} aria-hidden>
      <Canvas camera={{ position: [0, 0, 9], fov: 42 }} dpr={[1, 1.75]} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[6, 8, 6]} intensity={1.4} />
        <directionalLight position={[-6, -4, -4]} intensity={0.5} color="#ffd9a3" />
        <Float speed={1.3} rotationIntensity={0.15} floatIntensity={0.6}>
          <Helix />
        </Float>
        <Particles />
        <Environment preset="city" />
      </Canvas>
    </div>
  )
}
