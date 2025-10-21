<template>
  <div 
    class="intro-card" 
    :class="{ 'collapsed': isCollapsed }"
    :aria-live="isCollapsed ? 'off' : 'polite'"
  >
    <div class="intro-content" v-if="!isCollapsed">
      <div class="intro-icon">
        <OrbCanvas :size="20" state="idle" />
      </div>
      <div class="intro-text">
        <p class="intro-message">Antwortet nur aus Praxis-Dokumenten (MVP).</p>
      </div>
    </div>
    
    <div v-else class="pill-container">
      <button 
        class="intro-pill"
        @click="handleInfoClick"
        aria-label="Über diesen Assistenten"
      >
        <span class="pill-text">Nur Praxis-Dokumente</span>
      </button>
      
      <div class="demo-pill">
        <span class="pill-text">Demo</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  isCollapsed: boolean
}>()

const emit = defineEmits<{
  info: []
}>()

const handleInfoClick = () => {
  emit('info')
}
</script>

<style scoped>
.intro-card {
  max-width: 680px;
  margin: 0 auto 16px;
  transition: all 220ms var(--motion);
  overflow: hidden;
}

.intro-content {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fff;
  color: var(--blue-800);
  border: 1px solid var(--blue-100);
  border-radius: var(--r-assistant);
  box-shadow: var(--shadow-md);
  padding: 12px 14px;
  animation: introSlideIn 200ms var(--motion) ease-out;
}

.intro-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.intro-text {
  flex: 1;
}

.intro-message {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
  color: var(--blue-800);
}

.pill-container {
  display: flex;
  align-items: center;
  gap: 8px;
  animation: pillSlideIn 200ms var(--motion) ease-out;
}

.intro-pill {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  color: var(--blue-700);
  border: 1px solid rgba(0,0,0,0.02);
  border-radius: 400px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 250ms cubic-bezier(.2,.8,.2,1);
  box-shadow: var(--shadow-sm);
}

.demo-pill {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  color: var(--gray-600);
  border: 1px solid rgba(0,0,0,0.02);
  border-radius: 400px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 500;
  transition: all 250ms cubic-bezier(.2,.8,.2,1);
  box-shadow: var(--shadow-sm);
}

.intro-pill:hover {
  background: rgba(255, 255, 255, 1);
  border-color: var(--blue-300);
  box-shadow: 
    0 0 0 1px rgba(59, 130, 246, 0.1),
    0 0 8px rgba(59, 130, 246, 0.2),
    0 0 16px rgba(59, 130, 246, 0.1);
  transform: translateY(-1px);
}

.demo-pill:hover {
  background: rgba(255, 255, 255, 1);
  border-color: var(--gray-300);
  box-shadow: 
    0 0 0 1px rgba(107, 114, 128, 0.1),
    0 0 8px rgba(107, 114, 128, 0.2),
    0 0 16px rgba(107, 114, 128, 0.1);
  transform: translateY(-1px);
}

.intro-pill:focus-visible {
  outline: 2px solid var(--blue-500);
  outline-offset: 2px;
}


.pill-text {
  white-space: nowrap;
}

/* Collapse animation */
.intro-card.collapsed {
  opacity: 0.8;
  transform: translateY(-4px);
}

.intro-card.collapsed .intro-content {
  opacity: 0;
  height: 0;
  padding: 0;
  margin: 0;
  border: none;
  box-shadow: none;
}

.intro-card.collapsed .intro-pill {
  opacity: 1;
  height: auto;
}

/* Animations */
@keyframes introSlideIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pillSlideIn {
  from {
    opacity: 0;
    transform: translateY(4px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Mobile responsive */
@media (max-width: 768px) {
  .intro-card {
    margin: 0 16px 16px;
  }
  
  .intro-content {
    padding: 10px 12px;
  }
  
  .intro-message {
    font-size: 13px;
  }
  
  .intro-pill,
  .demo-pill {
    padding: 6px 10px;
    font-size: 11px;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .intro-card {
    transition: opacity 140ms ease;
  }
  
  .intro-content {
    animation: none;
  }
  
  .pill-container {
    animation: none;
  }
  
  .intro-pill,
  .demo-pill {
    transition: opacity 120ms ease;
  }
  
  .intro-card.collapsed {
    transform: none;
  }
  
  .intro-pill:hover {
    transform: none;
  }
}
</style>
