<template>
  <div 
    class="status-chip"
    :class="[`status-${status}`, { 'reduced-motion': prefersReducedMotion }]"
    role="status"
    aria-live="polite"
    aria-atomic="true"
    :aria-label="ariaLabel"
  >
    <span class="status-icon">{{ icon }}</span>
    <span class="status-text">{{ text }}</span>
    <span v-if="showDots" class="status-dots">{{ animatedDots }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

export interface StatusChipProps {
  status: 'idle' | 'thinking' | 'answering' | 'error' | 'offline'
  errorMessage?: string
  lastUpdate?: Date
}

const props = withDefaults(defineProps<StatusChipProps>(), {
  errorMessage: '',
  lastUpdate: () => new Date()
})

// Animation state
const animatedDots = ref('')
const dotAnimationId = ref<number | null>(null)
const prefersReducedMotion = ref(false)

// Status configurations
const statusConfig = {
  idle: {
    text: 'Fertig',
    icon: '✅',
    bgClass: 'bg-ready',
    borderClass: 'border-ready'
  },
  thinking: {
    text: 'Ich überlege …',
    icon: '💭',
    bgClass: 'bg-thinking',
    borderClass: 'border-thinking'
  },
  answering: {
    text: 'Am Antworten …',
    icon: '✍️',
    bgClass: 'bg-answering',
    borderClass: 'border-answering'
  },
  error: {
    text: 'Da ging etwas schief',
    icon: '⚠️',
    bgClass: 'bg-error',
    borderClass: 'border-error'
  },
  offline: {
    text: 'Keine Verbindung',
    icon: '📴',
    bgClass: 'bg-offline',
    borderClass: 'border-offline'
  }
}

// Computed properties
const currentConfig = computed(() => statusConfig[props.status])
const text = computed(() => currentConfig.value.text)
const icon = computed(() => currentConfig.value.icon)
const ariaLabel = computed(() => {
  const baseText = currentConfig.value.text
  if (props.status === 'error' && props.errorMessage) {
    return `${baseText}: ${props.errorMessage}`
  }
  return baseText
})

const showDots = computed(() => 
  props.status === 'thinking' || props.status === 'answering'
)

// Animation functions
const startDotAnimation = () => {
  if (dotAnimationId.value) return
  
  let dotCount = 1
  const maxDots = 3
  
  const animate = () => {
    animatedDots.value = '.'.repeat(dotCount)
    dotCount = dotCount >= maxDots ? 1 : dotCount + 1
    dotAnimationId.value = setTimeout(animate, 500)
  }
  
  animate()
}

const stopDotAnimation = () => {
  if (dotAnimationId.value) {
    clearTimeout(dotAnimationId.value)
    dotAnimationId.value = null
  }
  animatedDots.value = ''
}

// Watch for status changes
watch(() => props.status, (newStatus) => {
  if (newStatus === 'thinking' || newStatus === 'answering') {
    startDotAnimation()
  } else {
    stopDotAnimation()
  }
}, { immediate: true })

// Check for reduced motion preference
onMounted(() => {
  if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    prefersReducedMotion.value = mediaQuery.matches
    
    const handleChange = (e: MediaQueryListEvent) => {
      prefersReducedMotion.value = e.matches
    }
    
    mediaQuery.addEventListener('change', handleChange)
    
    onUnmounted(() => {
      mediaQuery.removeEventListener('change', handleChange)
    })
  }
})

onUnmounted(() => {
  stopDotAnimation()
})
</script>

<style scoped>
.status-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 12px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
  line-height: 1;
  transition: all 200ms ease-in-out;
  border: 1px solid;
  position: relative;
  overflow: hidden;
}

/* Background colors */
.bg-ready {
  background-color: var(--blue-50, #E6F1FB);
  color: var(--text-strong, #1E3A8A);
}

.bg-thinking {
  background-color: var(--blue-100, #E6F1FB);
  color: var(--text-strong, #1E3A8A);
}

.bg-answering {
  background-color: var(--blue-200, #DBEAFE);
  color: var(--text-strong, #1E3A8A);
}

.bg-error {
  background-color: var(--red-100, #FEE2E2);
  color: var(--text-strong, #DC2626);
}

.bg-offline {
  background-color: var(--gray-100, #E5E7EB);
  color: var(--text-strong, #6B7280);
}

/* Border colors */
.border-ready {
  border-color: var(--blue-200, #DBEAFE);
}

.border-thinking {
  border-color: var(--blue-300, #BFDBFE);
}

.border-answering {
  border-color: var(--blue-300, #BFDBFE);
}

.border-error {
  border-color: var(--red-200, #FECACA);
}

.border-offline {
  border-color: var(--gray-200, #D1D5DB);
}

/* Status elements */
.status-icon {
  font-size: 12px;
  line-height: 1;
  flex-shrink: 0;
}

.status-text {
  white-space: nowrap;
  flex-shrink: 0;
}

.status-dots {
  font-family: monospace;
  font-size: 12px;
  line-height: 1;
  min-width: 12px;
  text-align: left;
}

/* Animations */
.status-thinking:not(.reduced-motion) {
  animation: thinkingPulse 1.4s ease-in-out infinite;
}

.status-answering:not(.reduced-motion) {
  animation: answeringGlide 900ms ease-in-out infinite;
}

.status-error:not(.reduced-motion) {
  animation: errorShake 200ms ease-in-out;
}

.status-offline:not(.reduced-motion) {
  animation: offlineBreathing 2s ease-in-out infinite;
}

/* Keyframe animations */
@keyframes thinkingPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@keyframes answeringGlide {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(4px); }
}

@keyframes errorShake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
}

@keyframes offlineBreathing {
  0%, 100% { opacity: 0.8; }
  50% { opacity: 1; }
}

/* Reduced motion overrides */
.reduced-motion .status-thinking,
.reduced-motion .status-answering,
.reduced-motion .status-error,
.reduced-motion .status-offline {
  animation: none;
}

/* Focus styles for accessibility */
.status-chip:focus-visible {
  outline: 2px solid var(--blue-500, #3B82F6);
  outline-offset: 2px;
}

/* Mobile adjustments */
@media (max-width: 768px) {
  .status-chip {
    height: 32px;
    padding: 0 10px;
    font-size: 12px;
  }
  
  .status-icon {
    font-size: 11px;
  }
  
  .status-dots {
    font-size: 11px;
  }
}
</style>
