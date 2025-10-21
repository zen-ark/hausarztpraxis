<template>
  <div class="app-layout">
    <header class="top-bar" :class="{ 'scrolled': isScrolled }">
      <img src="/assets/Hausarzt_Logo.png" alt="Hausarztpraxis Thun" class="logo-large" />
      <button 
        @click="handleNewChat" 
        class="new-chat-btn"
        aria-label="Neuer Chat"
      >
        Neuer Chat
      </button>
    </header>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useChat } from '~/composables/useChat'

const { reset, busy } = useChat()
const isScrolled = ref(false)

const handleNewChat = () => {
  if (busy.value) {
    // Show toast for busy state
    // For now, just return
    return
  }
  
  reset()
  navigateTo('/landingpage')
}

onMounted(() => {
  const handleScroll = () => {
    isScrolled.value = window.scrollY > 10
  }
  window.addEventListener('scroll', handleScroll)
  onUnmounted(() => window.removeEventListener('scroll', handleScroll))
})
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.top-bar {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 4vw;
  background: #E5ECF7;
  backdrop-filter: blur(8px);
  transition: box-shadow 300ms ease;
}

.top-bar.scrolled {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.logo-large {
  height: 40px;
}

.new-chat-btn {
  padding: 10px 20px;
  background: #1E64B7;
  color: white;
  border: none;
  border-radius: 9999px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background 200ms ease;
}

.new-chat-btn:hover {
  background: #2F86D1;
}

.new-chat-btn:focus-visible {
  outline: var(--focus-ring);
}

/* Mobile responsive */
@media (max-width: 1024px) {
  .top-bar { padding: 16px 2vw; }
}

@media (max-width: 768px) {
  .top-bar { padding: 12px 1rem; }
  
  .logo-large {
    height: 36px;
  }
  
  .new-chat-btn {
    padding: 8px 16px;
    font-size: 13px;
  }
}
</style>
