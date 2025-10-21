<template>
  <form class="composer-form" :class="{ large }" @submit.prevent="handleSubmit">
    <div class="input-wrapper">
      <textarea
        ref="textareaRef"
        :value="modelValue"
        @input="handleInput"
        @keydown.enter.exact.prevent="handleEnterKey"
        :placeholder="placeholder"
        :disabled="disabled"
        rows="3"
        aria-label="Message input"
      />
      <button
        type="submit"
        :disabled="disabled || !modelValue.trim()"
        class="send-button"
        aria-label="Senden"
      >
        <img src="~/assets/send.svg" alt="Send" width="20" height="20" />
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    disabled?: boolean
    placeholder?: string
    large?: boolean
  }>(),
  {
    disabled: false,
    placeholder: 'Type a message...',
    large: false
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'submit': []
}>()

const textareaRef = ref<HTMLTextAreaElement | null>(null)

const handleInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
}

const handleEnterKey = () => {
  if (!props.disabled && props.modelValue.trim()) {
    handleSubmit()
  }
}

const handleSubmit = () => {
  if (!props.disabled && props.modelValue.trim()) {
    emit('submit')
  }
}

onMounted(() => {
  if (props.large && textareaRef.value) {
    textareaRef.value.focus()
  }
})
</script>

<style scoped>
.composer-form {
  width: 100%;
  transition: all 0.45s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.composer-form.large {
  max-width: 720px;
  margin: 0 auto;
  padding: 24px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--r-xl);
  box-shadow: var(--shadow-glass);
}

.input-wrapper {
  display: flex;
  gap: 12px;
  align-items: center;
}

textarea {
  flex: 1;
  padding: 0.9rem 1.2rem;
  border: 1px solid #C5D6E8;
  border-radius: 12px;
  font-family: Inter, inherit;
  font-size: 15px;
  font-weight: 400;
  line-height: 1.5;
  color: var(--grey-900);
  background: white;
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.04);
  resize: vertical;
  min-height: 48px;
  max-height: 200px;
  outline: none;
  transition: all var(--dur) var(--motion);
}

textarea:focus {
  border-color: #2F86D1;
  box-shadow: var(--focus-ring), inset 0 1px 2px rgba(0,0,0,0.04);
  transform: translateY(-2px);
}

textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: var(--grey-200);
}

.send-button {
  padding: 12px 16px;
  background: var(--blue-700);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 48px;
  height: 48px;
  transition: all var(--dur) var(--motion);
  flex-shrink: 0;
}

.send-button:hover:not(:disabled) {
  background: var(--blue-900);
  filter: brightness(0.95);
}

.send-button:active:not(:disabled) {
  animation: buttonPulse 300ms cubic-bezier(.3,.7,.4,1);
}

.send-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.send-button:focus-visible {
  outline: var(--focus-ring);
}

@keyframes buttonPulse {
  0% { transform: scale(1); }
  50% { transform: scale(0.9); }
  80% { transform: scale(1.05); }
  100% { transform: scale(1); }
}
</style>

