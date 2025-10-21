<template>
  <div 
    class="typing-indicator" 
    v-if="visible" 
    :class="{ 'fade-out': !visible }"
    role="status"
    aria-live="polite"
    :aria-label="currentPhrase"
  >
    <span class="typing-text">{{ currentPhrase }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  visible: boolean
}>()

// German contextual phrases
const phrases = [
  'Ich lese die Dokumente …',
  'Antwort wird vorbereitet …',
  'Ich fasse die wichtigsten Punkte zusammen …',
  'Einen Moment …',
  'Ich prüfe die Angaben …'
]

const currentPhraseIndex = ref(0)
const phraseRotationInterval = ref<number | null>(null)
const prefersReducedMotion = ref(false)

// Computed current phrase
const currentPhrase = computed(() => phrases[currentPhraseIndex.value])

// Rotate phrases for variety
const startPhraseRotation = () => {
  if (phraseRotationInterval.value) return
  
  phraseRotationInterval.value = setInterval(() => {
    currentPhraseIndex.value = (currentPhraseIndex.value + 1) % phrases.length
  }, 2000) // Change phrase every 2 seconds
}

const stopPhraseRotation = () => {
  if (phraseRotationInterval.value) {
    clearInterval(phraseRotationInterval.value)
    phraseRotationInterval.value = null
  }
}

// Watch for visibility changes
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    // Reset to first phrase when becoming visible
    currentPhraseIndex.value = 0
    // Start rotation after a short delay
    setTimeout(() => {
      if (props.visible && !prefersReducedMotion.value) {
        startPhraseRotation()
      }
    }, 1000)
  } else {
    stopPhraseRotation()
  }
})

// Check for reduced motion preference
onMounted(() => {
  if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    prefersReducedMotion.value = mediaQuery.matches
    
    const handleChange = (e: MediaQueryListEvent) => {
      prefersReducedMotion.value = e.matches
      if (e.matches) {
        stopPhraseRotation()
      }
    }
    
    mediaQuery.addEventListener('change', handleChange)
    
    onUnmounted(() => {
      mediaQuery.removeEventListener('change', handleChange)
    })
  }
})

onUnmounted(() => {
  stopPhraseRotation()
})
</script>

<style scoped>
.typing-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 0;
  margin: 8px 0;
  transition: opacity 200ms ease-in-out;
  background: transparent;
  border: none;
  box-shadow: none;
}

.typing-indicator.fade-out {
  opacity: 0;
}

.typing-text {
  font-size: 14px;
  color: var(--text-subtle);
  font-weight: 400;
  line-height: 1.5;
  text-align: center;
  transition: opacity 200ms ease-in-out;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .typing-text {
    font-size: 13px;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .typing-indicator {
    transition: opacity 150ms ease-out;
  }
  
  .typing-text {
    transition: opacity 150ms ease-out;
  }
}
</style>