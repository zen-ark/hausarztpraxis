<template>
  <Transition name="toast">
    <div 
      v-if="show" 
      class="toast" 
      role="alert" 
      aria-live="polite"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
    >
      <div class="toast-content">
        <svg class="toast-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
        <span class="toast-message">{{ message }}</span>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { watch, ref, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  show: boolean
  message: string
}>()

const emit = defineEmits<{
  hide: []
}>()

let dismissTimeout: NodeJS.Timeout | null = null

const handleMouseEnter = () => {
  if (dismissTimeout) clearTimeout(dismissTimeout)
}

const handleMouseLeave = () => {
  dismissTimeout = setTimeout(() => emit('hide'), 3500)
}

// Auto-hide after 3.5 seconds
watch(() => props.show, (newShow) => {
  if (newShow) {
    dismissTimeout = setTimeout(() => {
      emit('hide')
    }, 3500)
  } else {
    if (dismissTimeout) clearTimeout(dismissTimeout)
  }
})
</script>

<style scoped>
.toast {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 1000;
  max-width: 360px;
  animation: slideInFromTop 300ms cubic-bezier(.3,.7,.4,1);
}

@keyframes slideInFromTop {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: white;
  color: #1F2937;
  border: 1px solid #C5D6E8;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  font-size: var(--text-base);
  font-weight: 500;
}

.toast-icon {
  flex-shrink: 0;
  stroke: currentColor;
}

.toast-message {
  flex: 1;
  line-height: 1.4;
}

/* Transition animations */
.toast-enter-active {
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.toast-leave-active {
  transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(20px) scale(0.95);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px) scale(0.95);
}
</style>
