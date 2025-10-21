<template>
  <div 
    class="orb-container" 
    ref="containerRef"
    :style="{ transform: `translate(${mouseX}px, ${mouseY}px)` }"
  >
    <canvas ref="canvasRef" :width="canvasSize" :height="canvasSize" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'

const props = withDefaults(
  defineProps<{
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
const canvasSize = computed(() => props.size * 1.2) // Canvas is slightly larger to accommodate blur and movement

// Parallax refs
const mouseX = ref(0)
const mouseY = ref(0)

let ctx: CanvasRenderingContext2D | null = null
let particles: Particle[] = []
let animationFrameId: number | null = null
let lastFrameTime = 0
let isVisible = true
let observer: IntersectionObserver | null = null

// Simple pseudo-random noise function
const noise = (x: number) => {
  const i = Math.floor(x)
  const f = x - i
  const u = f * f * (3 - 2 * f)
  const a = Math.sin(i * 12.9898 + 78.233) * 43758.5453
  const b = Math.sin((i + 1) * 12.9898 + 78.233) * 43758.5453
  return (a - Math.floor(a)) * (1 - u) + (b - Math.floor(b)) * u
}

const initParticles = () => {
  particles = []
  // FIX: Make particle count proportional to size, with a minimum
  const particleCount = Math.max(40, Math.floor(props.size / 1.1))
  
  for (let i = 0; i < particleCount; i++) {
    const angle = (Math.PI * 2 * i) / particleCount
    const baseRadius = props.size * 0.25 + Math.random() * props.size * 0.15
    
    // FIX: Scale particle size proportionally, with a minimum
    const basePSize = Math.max(0.5, props.size / 180)
    const randPSize = Math.max(0.5, props.size / 180)
    
    particles.push({
      angle,
      radius: baseRadius,
      baseRadius,
      speed: 0.008 + Math.random() * 0.004,
      size: basePSize + Math.random() * randPSize, // Use proportional size
      opacity: 0.3 + Math.random() * 0.5,
      noiseOffset: Math.random() * 1000
    })
  }
}

const drawParticle = (p: Particle, time: number, color: string) => {
  if (!ctx) return
  
  // Center particles in the full canvasSize
  const centerX = canvasSize.value / 2
  const centerY = canvasSize.value / 2
  
  let currentRadius = p.radius
  
  // FIX: Scale noise amplitude proportionally
  const noiseAmplitude = Math.max(1, Math.floor(props.size / 35))
  const noiseValue = noise(p.noiseOffset + time * 0.001) * noiseAmplitude
  currentRadius += noiseValue
  
  // Apply breathing effect directly to radius
  const breathingProgress = (time % 15000) / 15000
  const breathingScale = 0.98 + Math.sin(breathingProgress * Math.PI * 2) * 0.02
  currentRadius *= breathingScale
  
  const x = centerX + Math.cos(p.angle) * currentRadius
  const y = centerY + Math.sin(p.angle) * currentRadius
  
  ctx.beginPath()
  ctx.arc(x, y, p.size, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.globalAlpha = p.opacity
  
  // FIX: Scale shadow blur proportionally
  const shadowBlur = Math.max(2, Math.floor(props.size / 25))
  ctx.shadowBlur = shadowBlur
  ctx.shadowColor = color
  
  ctx.fill()
  
  // Reset shadow and alpha for next particle
  ctx.shadowBlur = 0
  ctx.globalAlpha = 1
}

const animate = (timestamp: number) => {
  if (!ctx || !isVisible) {
    animationFrameId = requestAnimationFrame(animate)
    return
  }
  
  const deltaTime = timestamp - lastFrameTime
  if (deltaTime < 16) { // Cap frame rate
    animationFrameId = requestAnimationFrame(animate)
    return
  }
  lastFrameTime = timestamp
  
  // Clear with transparency
  ctx.clearRect(0, 0, canvasSize.value, canvasSize.value)
  
  const baseColor = '#2F86D1'
  
  particles.forEach((p) => {
    // Use idle rotation speed
    const rotationSpeed = p.speed * 0.8
    p.angle += rotationSpeed
    drawParticle(p, timestamp, baseColor)
  })
  
  animationFrameId = requestAnimationFrame(animate)
}

const setupCanvas = () => {
  if (!canvasRef.value) return
  
  ctx = canvasRef.value.getContext('2d', { alpha: true })
  if (!ctx) return
  
  const dpr = window.devicePixelRatio || 1
  const displaySize = canvasSize.value
  
  canvasRef.value.width = displaySize * dpr
  canvasRef.value.height = displaySize * dpr
  canvasRef.value.style.width = `${displaySize}px`
  canvasRef.value.style.height = `${displaySize}px`
  
  ctx.scale(dpr, dpr)
  ctx.clearRect(0, 0, canvasSize.value, canvasSize.value)
  
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

const handleMouseMove = (e: MouseEvent) => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  if (window.innerWidth < 768) return
  
  mouseX.value = (e.clientX / window.innerWidth - 0.5) * 4
  mouseY.value = (e.clientY / window.innerHeight - 0.5) * 4
}

onMounted(() => {
  setupCanvas()
  setupIntersectionObserver()
  window.addEventListener('mousemove', handleMouseMove)
})

onUnmounted(() => {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
  }
  if (observer) {
    observer.disconnect()
  }
  window.removeEventListener('mousemove', handleMouseMove)
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
  transition: transform 0.1s ease-out;
}

canvas {
  display: block;
  background: transparent; /* Ensures canvas element bg is transparent */
}
</style>


