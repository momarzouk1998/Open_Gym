'use client'

import { useRef, useState, useEffect, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, ContactShadows, PresentationControls } from '@react-three/drei'
import * as THREE from 'three'
import { useTheme } from 'next-themes'

// 3D Dumbbell
function PremiumDumbbell({ isDark }: { isDark: boolean }) {
  const group = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!group.current) return
    const t = state.clock.getElapsedTime()
    group.current.rotation.y = Math.sin(t / 2) * 0.3
    group.current.rotation.z = Math.cos(t / 2) * 0.1
  })

  // Materials adapt to theme
  const metalColor = isDark ? '#333333' : '#E2E8F0'
  const metalness = isDark ? 0.9 : 0.8
  
  const metalMaterial = new THREE.MeshStandardMaterial({
    color: metalColor,
    metalness,
    roughness: 0.2,
  })
  
  const accentMaterial = new THREE.MeshStandardMaterial({
    color: '#22C55E',
    metalness: 0.5,
    roughness: 0.2,
    emissive: '#22C55E',
    emissiveIntensity: isDark ? 0.4 : 0.1
  })

  return (
    <group ref={group} position={[-1.5, 0.5, 0]} scale={0.8} rotation={[0.4, 0.4, 0]}>
      {/* Bar */}
      <mesh material={metalMaterial} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.12, 0.12, 3, 32]} />
      </mesh>
      
      {/* Weights Left */}
      <mesh material={accentMaterial} position={[-1.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.6, 0.6, 0.3, 32]} />
      </mesh>
      <mesh material={metalMaterial} position={[-0.8, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.45, 0.45, 0.25, 32]} />
      </mesh>

      {/* Weights Right */}
      <mesh material={accentMaterial} position={[1.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.6, 0.6, 0.3, 32]} />
      </mesh>
      <mesh material={metalMaterial} position={[0.8, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.45, 0.45, 0.25, 32]} />
      </mesh>
    </group>
  )
}

// 3D Chart
function PremiumChart({ isDark }: { isDark: boolean }) {
  const group = useRef<THREE.Group>(null)
  
  useFrame((state) => {
    if (!group.current) return
    const t = state.clock.getElapsedTime()
    group.current.position.y = Math.sin(t) * 0.1
  })

  const baseColor = isDark ? '#1a1a1a' : '#F1F5F9'
  const baseMaterial = new THREE.MeshStandardMaterial({
    color: baseColor,
    metalness: 0.6,
    roughness: 0.2,
  })

  const barMaterial = new THREE.MeshStandardMaterial({
    color: '#22C55E',
    metalness: 0.3,
    roughness: 0.1,
    emissive: '#22C55E',
    emissiveIntensity: isDark ? 0.3 : 0.05
  })

  return (
    <group ref={group} position={[1.5, -0.5, -1]} rotation={[0.2, -0.4, 0]} scale={0.9}>
      {/* Base */}
      <mesh material={baseMaterial} position={[0, -0.2, 0]}>
        <boxGeometry args={[3, 0.2, 1.5]} />
      </mesh>

      {/* Bars */}
      <mesh material={barMaterial} position={[-1, 0.6, 0]}>
        <boxGeometry args={[0.4, 1.2, 0.4]} />
      </mesh>
      <mesh material={barMaterial} position={[-0.2, 1, 0]}>
        <boxGeometry args={[0.4, 2, 0.4]} />
      </mesh>
      <mesh material={barMaterial} position={[0.6, 1.4, 0]}>
        <boxGeometry args={[0.4, 2.8, 0.4]} />
      </mesh>
    </group>
  )
}

export function Hero3D() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(true)
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

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

  if (!mounted) return null
  
  const isDark = resolvedTheme === 'dark'

  return (
    <div ref={containerRef} className="w-full h-full">
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [0, 0, 6], fov: 45 }}
        frameloop={isVisible ? 'always' : 'never'}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={isDark ? 0.8 : 1.2} />
          <directionalLight position={[5, 10, 5]} intensity={1.5} color="#ffffff" />
          <spotLight position={[-5, 5, 5]} intensity={1} angle={0.3} penumbra={1} color="#22C55E" />
          
          <PresentationControls
            global
            snap={true}
            rotation={[0, 0, 0]}
            polar={[-Math.PI / 6, Math.PI / 6]}
            azimuth={[-Math.PI / 4, Math.PI / 4]}
          >
            <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
              <PremiumDumbbell isDark={isDark} />
            </Float>
            
            <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.8} floatingRange={[-0.1, 0.1]}>
              <PremiumChart isDark={isDark} />
            </Float>
          </PresentationControls>

          <ContactShadows
            position={[0, -2, 0]}
            opacity={isDark ? 0.4 : 0.2}
            scale={20}
            blur={2}
            far={4}
            color={isDark ? "#000000" : "#64748b"}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}
