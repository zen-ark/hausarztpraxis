<template>
  <div class="typing-indicator" v-if="visible" :class="{ 'fade-out': !visible }">
    <div class="typing-dots">
      <span class="dot"></span>
      <span class="dot"></span>
      <span class="dot"></span>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  visible: boolean
}>()
</script>

<style scoped>
.typing-indicator {
  display: flex;
  align-items: center;
  padding: 0;
  margin: 8px 0;
  transition: opacity 150ms ease-out;
  background: transparent;
  border: none;
  box-shadow: none;
}

.typing-indicator.fade-out {
  opacity: 0;
}

.typing-dots {
  display: flex;
  gap: 4px;
  align-items: center;
}

.dot {
  width: 8px;
  height: 8px;
  background-color: var(--blue-500);
  border-radius: 50%;
  animation: typing-bounce 1.4s infinite ease-in-out;
}

.dot:nth-child(1) { animation-delay: 0ms; }
.dot:nth-child(2) { animation-delay: 150ms; }
.dot:nth-child(3) { animation-delay: 300ms; }

@keyframes typing-bounce {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.6;
  }
  40% {
    transform: scale(1.2);
    opacity: 1;
  }
}
</style>