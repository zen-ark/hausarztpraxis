<template>
  <form @submit.prevent="handleSubmit" class="composer-form">
    <div class="input-group">
      <!-- Input Field -->
      <input
        ref="inputRef"
        v-model="query"
        type="text"
        :placeholder="placeholder"
        class="chat-input"
        :disabled="disabled"
        aria-label="Frage eingeben"
      />
      
      <!-- Send/Stop Button -->
      <button
        v-if="!isResponding"
        type="submit"
        :disabled="!query.trim() || disabled"
        class="send-button-icon"
        aria-label="Senden"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 19V5M5 12L12 5L19 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      
      <!-- Stop Button -->
      <button
        v-else
        type="button"
        @click="handleStop"
        class="stop-button-icon"
        aria-label="Antwort stoppen"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="6" y="6" width="12" height="12" rx="2" stroke="currentColor" stroke-width="2"/>
        </svg>
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  placeholder?: string
  disabled?: boolean
  isResponding?: boolean
}

interface Emits {
  (e: 'submit', value: string): void
  (e: 'stop'): void
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Frage eingeben …',
  disabled: false,
  isResponding: false
})

const emit = defineEmits<Emits>()

const query = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

const handleSubmit = () => {
  if (!query.value.trim() || props.disabled) return
  
  emit('submit', query.value)
  query.value = ''
}

const handleStop = () => {
  emit('stop')
}

// Expose methods for parent components
defineExpose({
  focus: () => inputRef.value?.focus(),
  setValue: (value: string) => {
    query.value = value
  }
})
</script>

<style scoped>
.composer-form {
  width: 100%;
}

.input-group {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(0,0,0,0.02);
  border-radius: var(--r-input);
  padding: 16px 12px;
  box-shadow: var(--shadow-sm);
  transition: all 250ms cubic-bezier(.2,.8,.2,1);
  gap: 8px;
}

.input-group:focus-within {
  border-color: var(--blue-300);
  box-shadow: 
    0 0 0 1px rgba(59, 130, 246, 0.1),
    0 0 8px rgba(59, 130, 246, 0.2),
    0 0 16px rgba(59, 130, 246, 0.1);
}

.chat-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-family: Inter, system-ui, sans-serif;
  font-size: 16px;
  font-weight: 400;
  line-height: 1.5;
  color: #374151;
}

.chat-input::placeholder {
  color: #9ca3af;
}

/* Send Button */
.send-button-icon {
  width: 32px;
  height: 32px;
  border-radius: 400px;
  background: #fff;
  color: #6b7280;
  border: 1px solid rgba(0,0,0,0.02);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 250ms cubic-bezier(.2,.8,.2,1);
  flex-shrink: 0;
  box-shadow: var(--shadow-sm);
}

.send-button-icon svg {
  width: 16px;
  height: 16px;
}

.send-button-icon:not(:disabled) {
  background: #fff;
  color: #3b82f6;
  border: 1px solid rgba(0,0,0,0.02);
  box-shadow: var(--shadow-sm);
}

.send-button-icon:hover:not(:disabled) {
  background: #3b82f6;
  color: white;
  border: 1px solid #3b82f6;
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.send-button-icon:disabled {
  background: #fff;
  color: #6b7280;
  border: 1px solid rgba(0,0,0,0.02);
  cursor: not-allowed;
  box-shadow: var(--shadow-sm);
}

/* Stop Button */
.stop-button-icon {
  width: 32px;
  height: 32px;
  border-radius: 400px;
  background: #fff;
  color: #ef4444;
  border: 1px solid rgba(0,0,0,0.02);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 250ms cubic-bezier(.2,.8,.2,1);
  flex-shrink: 0;
  box-shadow: var(--shadow-sm);
}

.stop-button-icon svg {
  width: 16px;
  height: 16px;
}

.stop-button-icon:hover {
  background: #ef4444;
  color: white;
  border: 1px solid #ef4444;
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .send-button-icon,
  .stop-button-icon {
    width: 36px;
    height: 36px;
  }
  
  .input-group {
    padding: 6px 10px;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .input-group,
  .send-button-icon,
  .stop-button-icon {
    transition: opacity 120ms ease;
  }
  
  .input-group:focus-within {
    transform: none;
  }
  
  .send-button-icon:hover:not(:disabled),
  .stop-button-icon:hover {
    transform: none;
  }
}
</style>
