<template>
  <div 
    class="typing-indicator" 
    v-if="visible" 
    :class="{ 'fade-out': !visible }"
    role="status"
    aria-live="polite"
    :aria-label="displayedText"
  >
    <div class="typing-bubble">
      <span class="typing-text">{{ displayedText }}</span>
      <span class="typing-cursor" v-if="isTyping">|</span>
    </div>
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
const displayedText = ref('')
const isTyping = ref(false)
const currentPhrase = ref('')

// Computed current phrase
const currentPhraseComputed = computed(() => phrases[currentPhraseIndex.value])

// Typewriter effect for current phrase
const startTypewriter = (phrase: string) => {
  if (!phrase) return
  
  displayedText.value = ''
  isTyping.value = true
  
  if (prefersReducedMotion.value) {
    // Show text immediately for reduced motion
    displayedText.value = phrase
    isTyping.value = false
    return
  }
  
  let currentIndex = 0
  
  const typeNextChar = () => {
    if (currentIndex < phrase.length && props.visible) {
      displayedText.value = phrase.substring(0, currentIndex + 1)
      currentIndex++
      setTimeout(typeNextChar, 36) // 36ms per character (20% slower than 30ms)
    } else {
      isTyping.value = false
    }
  }
  
  typeNextChar()
}

// Rotate phrases for variety
const startPhraseRotation = () => {
  if (phraseRotationInterval.value) return
  
  phraseRotationInterval.value = setInterval(() => {
    currentPhraseIndex.value = (currentPhraseIndex.value + 1) % phrases.length
    const newPhrase = phrases[currentPhraseIndex.value]
    currentPhrase.value = newPhrase
    startTypewriter(newPhrase)
  }, 3000) // Change phrase every 3 seconds
}

const stopPhraseRotation = () => {
  if (phraseRotationInterval.value) {
    clearInterval(phraseRotationInterval.value)
    phraseRotationInterval.value = null
  }
}

// Watch for phrase changes to trigger typewriter effect
watch(() => currentPhrase.value, (newPhrase) => {
  if (newPhrase && props.visible) {
    startTypewriter(newPhrase)
  }
})

// Watch for visibility changes
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    // Reset to first phrase when becoming visible
    currentPhraseIndex.value = 0
    currentPhrase.value = phrases[0]
    
    // Start rotation after a short delay
    setTimeout(() => {
      if (props.visible && !prefersReducedMotion.value) {
        startPhraseRotation()
      }
    }, 2000)
  } else {
    stopPhraseRotation()
    displayedText.value = ''
    isTyping.value = false
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
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  max-width: 680px;
  margin-bottom: 16px;
  transition: opacity 200ms ease-in-out;
  background: transparent;
  border: none;
  box-shadow: none;
}

.typing-indicator.fade-out {
  opacity: 0;
}

.typing-bubble {
  background: #FFFFFF;
  color: var(--text);
  border-radius: 400px;
  box-shadow: var(--shadow-md);
  padding: 1rem 1.5rem;
  line-height: 1.6;
  max-width: 700px;
  margin-bottom: 0.75rem;
  transition: box-shadow 220ms var(--motion-smooth);
  display: flex;
  align-items: center;
  gap: 4px;
}

.typing-text {
  font-size: 14px;
  color: var(--text-subtle);
  font-weight: 400;
  line-height: 1.5;
  opacity: 0.8;
  transition: opacity 200ms ease-in-out;
}

.typing-cursor {
  color: var(--blue-500);
  font-weight: bold;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

/* Mobile responsive */
@media (max-width: 768px) {
  .typing-indicator {
    max-width: 90%;
  }
  
  .typing-bubble {
    padding: 0.75rem 1rem;
  }
  
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
  
  .typing-cursor {
    animation: none;
  }
}
</style>