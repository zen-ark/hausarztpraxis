<template>
  <div class="message-wrapper" :data-role="role" v-if="(displayedContent && displayedContent.trim()) || role === 'user'">
    <div class="bubble" :class="role">
      <div v-if="role === 'assistant'" class="markdown-content">
        <EnhancedMarkdown :content="displayedContent" />
      </div>
      <div v-else class="user-message-content">{{ displayedContent }}</div>
    </div>
    
    <!-- Citations for assistant messages -->
    <div v-if="role === 'assistant' && citations && citations.length > 0" class="citations">
      <span
        v-for="(citation, index) in citations"
        :key="index"
        class="citation-chip"
      >
        {{ citation }}
      </span>
    </div>
    
    <!-- Feedback buttons for assistant messages -->
    <div v-if="role === 'assistant' && messageId" class="feedback">
      <span class="feedback-label">War das hilfreich?</span>
      <button
        class="feedback-button"
        @click="handleFeedback(true)"
        title="Hilfreich"
        aria-label="Antwort hilfreich"
      >
        👍
      </button>
      <button
        class="feedback-button"
        @click="handleFeedback(false)"
        title="Nicht hilfreich"
        aria-label="Antwort nicht hilfreich"
      >
        👎
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import EnhancedMarkdown from './EnhancedMarkdown.vue'

const props = defineProps<{
  role: 'user' | 'assistant'
  content: string
  citations?: string[]
  messageId?: string
}>()

const emit = defineEmits<{
  feedback: [messageId: string, helpful: boolean]
}>()

// Typewriter effect for assistant messages
const displayedContent = ref('')
const isTyping = ref(false)
const fullContent = ref('')

const handleFeedback = (helpful: boolean) => {
  if (props.messageId) {
    emit('feedback', props.messageId, helpful)
  }
}

// Define startTypewriter function first
const startTypewriter = () => {
  if (props.role !== 'assistant' || !fullContent.value) return
  
  isTyping.value = true
  displayedContent.value = ''
  let currentIndex = 0
  
  const typeNextChar = () => {
    if (currentIndex < fullContent.value.length) {
      displayedContent.value = fullContent.value.substring(0, currentIndex + 1)
      currentIndex++
      setTimeout(typeNextChar, 15) // 15ms per character for faster typing
    } else {
      isTyping.value = false
    }
  }
  
  typeNextChar()
}

// Watch for content changes and implement typewriter effect
watch(() => props.content, (newContent) => {
  if (props.role === 'assistant') {
    if (newContent && newContent.trim()) {
      fullContent.value = newContent
      startTypewriter()
    } else {
      displayedContent.value = ''
    }
  } else {
    displayedContent.value = newContent
  }
}, { immediate: true })

</script>

<style scoped>
.message-wrapper {
  display: flex;
  flex-direction: column;
  max-inline-size: min(var(--bubble-ch), calc(100% - 2 * var(--gutter)));
  margin-bottom: 0.75rem;
  background: transparent;
  border: none;
  box-shadow: none;
  box-sizing: border-box;
}

.message-wrapper[data-role="assistant"] {
  align-self: flex-start;
  align-items: flex-start;
}

.message-wrapper[data-role="user"] {
  align-self: flex-end;
  align-items: flex-end;
}

.message-wrapper[data-role="user"] + .message-wrapper[data-role="assistant"],
.message-wrapper[data-role="assistant"] + .message-wrapper[data-role="user"] {
  margin-top: var(--space-2);
}

.bubble {
  word-wrap: break-word;
}

.bubble.user {
  background: #1E64B7;
  color: #FFFFFF;
  border-radius: 18px;
  padding: 1rem 1.25rem;
  line-height: 1.5;
  max-width: 100%;
  margin-left: auto;
  margin-bottom: 0;
}

.user-message-content {
  color: #FFFFFF;
  font-size: 1rem;
  line-height: 1.5;
  word-wrap: break-word;
  word-break: break-word;
  white-space: pre-wrap;
  overflow-wrap: break-word;
}


.bubble.assistant {
  background: #FFFFFF;
  color: var(--text);
  border-radius: 18px;
  box-shadow: var(--shadow-md);
  padding: 1rem 1.5rem;
  line-height: 1.6;
  max-width: 100%;
  margin-bottom: 0;
  transition: box-shadow 220ms var(--motion-smooth);
}

.markdown-content {
  width: 100%;
  background: transparent;
  border: none;
  box-shadow: none;
}

.message-wrapper {
  animation: bubbleReveal 200ms var(--motion) ease-out;
}

@keyframes bubbleReveal {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.citations {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.citation-chip {
  background: var(--blue-100);
  color: var(--blue-700);
  padding: 4px 10px;
  border-radius: var(--r-pill);
  font-size: 14px;
  font-weight: 500;
}

.feedback {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  font-size: 14px;
  color: var(--grey-600);
}

.feedback-label {
  font-size: 14px;
}

.feedback-button {
  background: none;
  border: 1px solid var(--grey-200);
  border-radius: 8px;
  padding: 4px 8px;
  cursor: pointer;
  transition: all var(--dur) var(--motion);
  font-size: 16px;
  color: var(--grey-600);
}

.feedback-button:hover {
  background: var(--blue-100);
  border-color: var(--blue-500);
  transform: scale(1.02);
}

.feedback-button:focus-visible {
  outline: 2px solid var(--blue-500);
  outline-offset: 2px;
}

/* Hover effects removed as requested */




/* Mobile responsive */
@media (max-width: 640px) {
  .message-wrapper {
    max-inline-size: 100%;
  }
  
  .bubble.user,
  .bubble.assistant {
    padding: 0.75rem 1rem;
    hyphens: auto;
    word-break: break-word;
  }
}

/* Tablet and desktop - maintain readable width */
@media (min-width: 641px) {
  .message-wrapper {
    max-inline-size: min(var(--bubble-ch), calc(100% - 2 * var(--gutter)));
  }
}
</style>
