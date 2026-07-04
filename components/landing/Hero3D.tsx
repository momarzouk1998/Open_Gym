'use client'

import { useRef, useEffect, useState, Suspense, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, MeshDistortMaterial, MeshWobbleMaterial, Stars, PerspectiveCamera } from '@react-three/drei'
import { EffectComposer, Bloom, ChromaticAberration, Noise } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'

// Abstract 3D shape that looks premium and dynamic (representing infinite possibilities/strength)
function AbstractCore() {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.getElapsedTime()
    // Dynamic rotation
    meshRef.current.rotation.x = t * 0.2
    meshRef.current.rotation.y = t * 0.3
  })

  // Exact green from logo: #22C55E
  return (
    <group>
      {/* Outer abstract shape */}
      <mesh ref={meshRef}>
        <torusKnotGeometry args={[1.2, 0.4, 128, 32]} />
        <MeshDistortMaterial
          color="#0A0A0F"
          emissive="#22C55E"
          emissiveIntensity={0.8}
          distort={0.4}
          speed={2}
          roughness={0.2}
          metalness={0.8}
          wireframe={true}
        />
      </mesh>
      
      {/* Inner glowing core */}
      <Float speed={2} rotationIntensity={2} floatIntensity={2}>
        <mesh>
          <sphereGeometry args={[0.6, 64, 64]} />
          <MeshWobbleMaterial
            color="#22C55E"
            emissive="#22C55E"
            emissiveIntensity={1.5}
            factor={1}
            speed={2}
            roughness={0}
            metalness={1}
          />
        </mesh>
      </Float>
    </group>
  )
}

function FloatingParticles() {
  const count = 50
  const mesh = useRef<THREE.InstancedMesh>(null)
  
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const particles = useMemo(() => {
    const temp = []
    for (let i = 0; i < count; i++) {
      const t = Math.random() * 100
      const factor = 20 + Math.random() * 100
      const speed = 0.01 + Math.random() / 200
      const xFactor = -10 + Math.random() * 20
      const yFactor = -10 + Math.random() * 20
      const zFactor = -10 + Math.random() * 20
      temp.push({ t, factor, speed, xFactor, yFactor, zFactor, mx: 0, my: 0 })
    }
    return temp
  }, [count])

  useFrame((state) => {
    particles.forEach((particle, i) => {
      let { t, factor, speed, xFactor, yFactor, zFactor } = particle
      t = particle.t += speed / 2
      const a = Math.cos(t) + Math.sin(t * 1) / 10
      const b = Math.sin(t) + Math.cos(t * 2) / 10
      const s = Math.cos(t)
      
      dummy.position.set(
        (particle.mx / 10) * a + xFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 1) * factor) / 10,
        (particle.my / 10) * b + yFactor + Math.sin((t / 10) * factor) + (Math.cos(t * 2) * factor) / 10,
        (particle.my / 10) * b + zFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 3) * factor) / 10
      )
      dummy.scale.set(s * 0.1, s * 0.1, s * 0.1)
      dummy.rotation.set(s * 5, s * 5, s * 5)
      dummy.updateMatrix()
      mesh.current!.setMatrixAt(i, dummy.matrix)
    })
    mesh.current!.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.5, 16, 16]} />
      <meshStandardMaterial 
        color="#22C55E" 
        emissive="#22C55E"
        emissiveIntensity={2} 
        roughness={0} 
        metalness={1} 
      />
    </instancedMesh>
  )
}

export function Hero3D() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={containerRef} className="w-full h-full absolute inset-0 -z-10">
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
        frameloop={isVisible ? 'always' : 'never'}
        style={{ width: '100%', height: '100%' }}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={50} />
        <Suspense fallback={null}>
          <ambientLight intensity={0.2} />
          <directionalLight position={[10, 10, 10]} intensity={1} color="#ffffff" />
          <pointLight position={[-10, -10, -10]} intensity={0.5} color="#22C55E" />
          
          <Float speed={2} rotationIntensity={1} floatIntensity={1.5}>
            <AbstractCore />
          </Float>
          
          <FloatingParticles />
          <Stars radius={50} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />

          {/* Post processing for premium glowing effects */}
          <EffectComposer>
            <Bloom 
              luminanceThreshold={0.2} 
              mipmapBlur 
              intensity={1.5} 
            />
            <ChromaticAberration 
              blendFunction={BlendFunction.NORMAL} 
              offset={new THREE.Vector2(0.002, 0.002)} 
            />
            <Noise opacity={0.05} />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  )
}
