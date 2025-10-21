<template>
  <header class="app-bar" role="banner">
    <div class="app-bar-content">
      <!-- Left side: Mini Orb + Title + Subtitle -->
      <div class="app-bar-left">
        <div class="mini-orb-container" :class="{ 'pulsing': isThinking }">
          <OrbCanvas :size="32" />
        </div>
        <div class="app-bar-titles">
          <h1 class="app-bar-title">Praxis-Assistent</h1>
          <h2 class="app-bar-subtitle">Hausarztpraxis Thun</h2>
        </div>
      </div>
      
      <!-- Right side: Mode chips -->
      <div class="app-bar-right">
        <div class="mode-chip">
          <span class="chip-text">Nur Praxis-Dokumente</span>
        </div>
        <div class="mode-chip">
          <span class="chip-text">Demo</span>
        </div>
      </div>
    </div>
    
    <!-- Divider -->
    <div class="header-divider"></div>
  </header>
</template>

<script setup lang="ts">
import OrbCanvas from './OrbCanvas.vue'

const props = defineProps<{
  isThinking?: boolean
}>()
</script>

<style scoped>
.app-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 20;
  background: var(--bg);
  border-bottom: 1px solid var(--blue-100);
  height: 60px;
  display: flex;
  flex-direction: column;
}

.app-bar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 60px;
  flex: 1;
}

.app-bar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mini-orb-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  transition: transform var(--dur) var(--motion);
}

.mini-orb-container.pulsing {
  animation: miniPulse 400ms var(--motion) infinite;
}

@keyframes miniPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.app-bar-titles {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.app-bar-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-strong);
  margin: 0;
  line-height: 1;
}

.app-bar-subtitle {
  font-size: 14px;
  font-weight: 400;
  color: var(--grey-600);
  margin: 0;
  line-height: 1;
}

.app-bar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mode-chip {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  color: #000;
  border: 1px solid rgba(0,0,0,0.02);
  border-radius: 400px;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 500;
  box-shadow: var(--shadow-sm);
  height: 24px;
}

.chip-text {
  white-space: nowrap;
}

.header-divider {
  height: 1px;
  background: var(--blue-100);
  width: 100%;
  flex-shrink: 0;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .app-bar-content {
    padding: 0 16px;
  }
  
  .app-bar-title {
    font-size: 16px;
  }
  
  .app-bar-subtitle {
    font-size: 12px;
  }
  
  .mode-chip {
    padding: 3px 8px;
    font-size: 11px;
    height: 20px;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .mini-orb-container.pulsing {
    animation: none;
  }
  
  .mini-orb-container {
    transition: none;
  }
}
</style>