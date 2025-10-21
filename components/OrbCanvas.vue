<template>
  <div 
    class="orb-container parallax" 
    ref="containerRef"
    :style="{ transform: `translate(${mouseX}px, ${mouseY}px)` }"
  >
    <canvas ref="canvasRef" :width="canvasSize" :height="canvasSize" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'

const props = withDefaults(
  defineProps<{
    state: 'idle' | 'starting' | 'thinking'
    size?: number
  }>(),
  {
    size: 280
  }
)

interface Particle {
  angle: number
  radius: number
  baseRadius: number
  speed: number
  size: number
  opacity: number
  noiseOffset: number
}

const canvasRef = ref<HTMLCanvasElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)
const canvasSize = computed(() => props.size * 1.2) // Add 20% padding to prevent clipping

// Parallax refs
const mouseX = ref(0)
const mouseY = ref(0)

let ctx: CanvasRenderingContext2D | null = null
let particles: Particle[] = []
let animationFrameId: number | null = null
let lastFrameTime = 0
let isVisible = true
let observer: IntersectionObserver | null = null

// State transition
let transitionStartTime = 0
let transitionPhase: 'gather' | 'release' | null = null
let sparkParticles: Particle[] = []

// Colors from CSS variables
const getColor = (varName: string) => {
  if (typeof window === 'undefined') return '#2F86D1'
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || '#2F86D1'
}

const initParticles = () => {
  particles = []
  const particleCount = props.size <= 20 ? 50 : 260
  
  for (let i = 0; i < particleCount; i++) {
    const angle = (Math.PI * 2 * i) / particleCount
    const baseRadius = props.size * 0.25 + Math.random() * props.size * 0.15
    
    particles.push({
      angle,
      radius: baseRadius,
      baseRadius,
      speed: 0.008 + Math.random() * 0.004,
      size: props.size <= 20 ? 0.8 + Math.random() * 0.8 : 1.5 + Math.random() * 1.5,
      opacity: 0.3 + Math.random() * 0.5,
      noiseOffset: Math.random() * 1000
    })
  }
}

const initSparkParticles = () => {
  sparkParticles = []
  for (let i = 0; i < 6; i++) {
    const angle = Math.random() * Math.PI * 2
    const baseRadius = props.size * 0.15
    
    sparkParticles.push({
      angle,
      radius: baseRadius,
      baseRadius,
      speed: 0.02 + Math.random() * 0.01,
      size: 2 + Math.random() * 2,
      opacity: 0.6 + Math.random() * 0.4,
      noiseOffset: Math.random() * 1000
    })
  }
}

// Simple noise function (pseudo-Perlin)
const noise = (x: number) => {
  const i = Math.floor(x)
  const f = x - i
  const u = f * f * (3 - 2 * f)
  const a = Math.sin(i * 12.9898 + 78.233) * 43758.5453
  const b = Math.sin((i + 1) * 12.9898 + 78.233) * 43758.5453
  return (a - Math.floor(a)) * (1 - u) + (b - Math.floor(b)) * u
}

const drawParticle = (p: Particle, time: number, color: string, additionalOpacity = 1) => {
  if (!ctx) return
  
  // Use the original display size for centering (accounting for 20% padding)
  const originalSize = props.size
  const centerX = originalSize / 2
  const centerY = originalSize / 2
  
  let currentRadius = p.radius
  
  // Apply state-specific effects
  if (props.state === 'starting' && transitionPhase) {
    const elapsed = time - transitionStartTime
    if (transitionPhase === 'gather' && elapsed < 250) {
      const progress = elapsed / 250
      const easeIn = progress * progress
      currentRadius = p.radius + (p.baseRadius * -0.1 - p.radius + p.baseRadius) * easeIn
    } else if (transitionPhase === 'release' && elapsed >= 250 && elapsed < 500) {
      const progress = (elapsed - 250) / 250
      const easeOut = 1 - Math.pow(1 - progress, 3)
      currentRadius = p.baseRadius * 0.9 + (p.baseRadius - p.baseRadius * 0.9) * easeOut
    }
  }
  
  // Add noise jitter
  const noiseAmplitude = props.size <= 20 ? 3 : 8
  const noiseValue = noise(p.noiseOffset + time * 0.001) * noiseAmplitude
  currentRadius += noiseValue

  
  const x = centerX + Math.cos(p.angle) * currentRadius
  const y = centerY + Math.sin(p.angle) * currentRadius
  
  // Use original particle size
  let particleSize = p.size
  
  ctx.beginPath()
  ctx.arc(x, y, particleSize, 0, Math.PI * 2)
  ctx.fillStyle = color
  
  // Use original opacity
  let finalOpacity = p.opacity * additionalOpacity
  
  ctx.globalAlpha = finalOpacity
  
  if (props.state === 'idle') {
    ctx.shadowBlur = props.size <= 20 ? 6 : 12
    ctx.shadowColor = color
  }
  
  ctx.fill()
  ctx.shadowBlur = 0
  ctx.globalAlpha = 1
}

const animate = (timestamp: number) => {
  if (!ctx || !isVisible) {
    animationFrameId = requestAnimationFrame(animate)
    return
  }
  
  // Cap to 60fps
  const deltaTime = timestamp - lastFrameTime
  if (deltaTime < 16) {
    animationFrameId = requestAnimationFrame(animate)
    return
  }
  lastFrameTime = timestamp
  
  // Clear canvas
  ctx.clearRect(0, 0, canvasSize.value, canvasSize.value)
  
  // Handle state transitions
  if (props.state === 'starting') {
    const elapsed = timestamp - transitionStartTime
    if (elapsed < 250) {
      transitionPhase = 'gather'
    } else if (elapsed < 500) {
      transitionPhase = 'release'
    } else {
      transitionPhase = null
    }
  }

  
  // Determine color based on state
  let baseColor = getColor('--blue-500')
  
  // Update and draw particles with smooth rotation
  particles.forEach((p) => {
    let rotationSpeed = p.speed
    
    if (props.state === 'idle') {
      rotationSpeed = p.speed * 0.8
    } else {
      rotationSpeed = p.speed
    }
    
    p.angle += rotationSpeed
    drawParticle(p, timestamp, baseColor)
  })
  
  // Add breathing effect for idle state
  if (props.state === 'idle' && ctx) {
    const breathingProgress = (timestamp % 15000) / 15000 // 15s cycle
    const breathingScale = 0.98 + Math.sin(breathingProgress * Math.PI * 2) * 0.02
    ctx.globalAlpha *= breathingScale
  }
  
  // Remove old pulse and spark effects - now using wave motion in particle update
  
  animationFrameId = requestAnimationFrame(animate)
}

const setupCanvas = () => {
  if (!canvasRef.value) return
  
  ctx = canvasRef.value.getContext('2d')
  if (!ctx) return
  
  // Handle devicePixelRatio for sharp rendering
  const dpr = window.devicePixelRatio || 1
  const displaySize = canvasSize.value
  
  canvasRef.value.width = displaySize * dpr
  canvasRef.value.height = displaySize * dpr
  canvasRef.value.style.width = `${displaySize}px`
  canvasRef.value.style.height = `${displaySize}px`
  
  ctx.scale(dpr, dpr)
  
  initParticles()
  animationFrameId = requestAnimationFrame(animate)
}

const setupIntersectionObserver = () => {
  if (!containerRef.value) return
  
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        isVisible = entry.isIntersecting
      })
    },
    { threshold: 0.1 }
  )
  
  observer.observe(containerRef.value)
}

// Mouse move handler with throttle
const handleMouseMove = (e: MouseEvent) => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  if (window.innerWidth < 768) return
  mouseX.value = (e.clientX / window.innerWidth - 0.5) * 4
  mouseY.value = (e.clientY / window.innerHeight - 0.5) * 4
}

// Pulse method for delight moments
const triggerPulse = () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  if (containerRef.value) {
    containerRef.value.animate([
      { transform: 'scale(1)' },
      { transform: 'scale(1.12)' },
      { transform: 'scale(1)' }
    ], {
      duration: 400,
      easing: 'cubic-bezier(.3,.7,.4,1)'
    })
  }
}

// Expose pulse method
defineExpose({ triggerPulse })

onMounted(() => {
  setupCanvas()
  setupIntersectionObserver()
  
  // Add mouse move listener
  window.addEventListener('mousemove', handleMouseMove)
})

onUnmounted(() => {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
  }
  if (observer) {
    observer.disconnect()
  }
  
  // Remove mouse move listener
  window.removeEventListener('mousemove', handleMouseMove)
})

watch(() => props.state, (newState) => {
  if (newState === 'starting') {
    transitionStartTime = performance.now()
    transitionPhase = 'gather'
  }
})
</script>

<style scoped>
.orb-container {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  height: auto;
  min-height: 0;
}

canvas {
  display: block;
}
</style>


