'use client'

import Image from 'next/image'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

interface LogoProps {
  /** 'full' = full logo with text, 'icon' = icon mark only */
  variant?: 'full' | 'icon'
  /** Width of the logo in pixels */
  width?: number
  /** Height of the logo in pixels */
  height?: number
  /** Additional CSS classes */
  className?: string
  /** Priority loading */
  priority?: boolean
}

/**
 * Logo component that automatically switches between light and dark versions
 * based on the current theme.
 * 
 * - Dark theme → light logo (white text / light icon)
 * - Light theme → dark logo (black text / dark icon)
 */
export function Logo({
  variant = 'full',
  width,
  height,
  className = '',
  priority = false,
}: LogoProps) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  // Default sizes based on variant
  const defaultWidth = variant === 'full' ? 160 : 40
  const defaultHeight = variant === 'full' ? 50 : 40
  const w = width ?? defaultWidth
  const h = height ?? defaultHeight

  // Before mounting, show light version (dark theme is default)
  const isDark = !mounted || resolvedTheme === 'dark'

  const src = variant === 'full'
    ? isDark ? '/logo/logo-full-light.png' : '/logo/logo-full-dark.png'
    : isDark ? '/logo/icon-mark-light.png' : '/logo/icon-mark-dark.png'

  return (
    <Image
      src={src}
      alt="OpenGym"
      width={w}
      height={h}
      className={className}
      priority={priority}
    />
  )
}
