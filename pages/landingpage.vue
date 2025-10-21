<template>
  <div class="landing-page">
    <!-- Background gradient -->
    <div class="background-gradient"></div>
    
    <!-- Main content -->
    <main class="hero-content">
      <!-- Greeting section -->
      <div class="greeting-section">
        <h1 class="greeting">{{ greeting }}</h1>
        <p class="subtitle fade-in">Ich bin Ihr Praxis-Assistent. Was möchten Sie wissen?</p>
      </div>
      
      <!-- Orb -->
      <div class="orb-container">
        <OrbCanvas :state="orbState" :size="200" />
      </div>
      
      <!-- Composer card -->
      <div class="composer-card" :class="{ morphing: isMorphing }">
        <ChatInput
          ref="chatInputRef"
          placeholder="Ask AI anything"
          :disabled="isSubmitting"
          @submit="handleSubmit"
        />
      </div>
      
      <!-- Example queries -->
      <div class="examples-section">
        <h3 class="examples-title">Beispiel-Anfragen:</h3>
        <div class="examples-list">
          <button 
            v-for="example in exampleQueries" 
            :key="example"
            @click="selectExample(example)"
            class="example-query"
          >
            <span class="example-text">{{ example }}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </main>
    
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import ChatInput from '../components/ChatInput.vue'

// State
const isSubmitting = ref(false)
const isMorphing = ref(false)
const chatInputRef = ref<InstanceType<typeof ChatInput> | null>(null)

// Example queries in German
const exampleQueries = ref([
  'Wie bestelle ich ein 24h-Blutdruckmessgerät?',
  'Was muss ich bei der Ergometrie beachten?',
  'Wie funktioniert die Langzeit-EKG Auswertung?',
  'Welche Vorbereitung braucht ein Patient für die Lungenfunktion?'
])

// Computed
const greeting = computed(() => {
  if (typeof window === 'undefined') return 'Guten Tag'
  const hour = new Date().getHours()
  if (hour >= 6 && hour < 11) return 'Guten Morgen'
  if (hour >= 11 && hour < 18) return 'Guten Tag'
  return 'Guten Abend'
})

const orbState = computed(() => {
  if (isSubmitting.value) return 'thinking'
  return 'idle'
})

// Methods
const handleSubmit = async (message: string) => {
  if (!message.trim() || isSubmitting.value) return
  
  // Start morphing animation
  isMorphing.value = true
  isSubmitting.value = true
  
  // Store message for chat page
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('firstMessage', message)
  }
  
  // Wait for morph animation, then navigate
  setTimeout(() => {
    // @ts-ignore
    navigateTo('/chat')
  }, 450)
}

const selectExample = (example: string) => {
  // Set the value in the ChatInput component
  if (chatInputRef.value) {
    // We need to access the internal query ref of ChatInput
    // For now, we'll focus the input
    chatInputRef.value.focus()
  }
}

onMounted(() => {
  if (chatInputRef.value) {
    chatInputRef.value.focus()
  }
})
</script>

<style scoped>
/* ===================================
   FLEXBOX LAYOUT STRUCTURE
   =================================== */

.landing-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.background-gradient {
  position: absolute;
  inset: 0;
  background: var(--bg-ambient);
  z-index: -1;
}

.background-gradient::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 200px;
  background: radial-gradient(ellipse at center bottom, rgba(17, 74, 126, 0.03) 0%, transparent 70%);
}

/* ===================================
   MAIN CONTENT - Centered with Flexbox
   =================================== */

.hero-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 24px;
  max-width: 640px;
  width: 100%;
  gap: 16px; /* 2 × 8pt - consistent spacing */
}

/* ===================================
   GREETING SECTION
   =================================== */

.greeting-section {
  display: flex;
  flex-direction: column;
  gap: 8px; /* 1 × 8pt between heading and subtitle */
  margin: 0;
}

.greeting {
  font-size: 32px; /* 4 × 8pt */
  font-weight: 700;
  color: var(--text-strong);
  margin: 0;
  line-height: 1.2;
}

.subtitle {
  font-size: 18px;
  color: var(--text-subtle);
  margin: 0;
  font-weight: 400;
  line-height: 1.5;
}

/* ===================================
   ORB CONTAINER
   =================================== */

.orb-container {
  margin: 8px 0; /* 1 × 8pt top/bottom */
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 200px;
  height: 200px;
}

/* ===================================
   COMPOSER CARD
   =================================== */

.composer-card {
  width: 100%;
  max-width: 640px;
  background: transparent;
  padding: 0;
  transition: all 250ms cubic-bezier(.2,.8,.2,1);
}

.composer-card.morphing {
  transform: scale(0.95);
  opacity: 0.8;
  border-radius: var(--r-pill);
  box-shadow: var(--shadow-subtle);
}

/* ===================================
   EXAMPLES SECTION
   =================================== */

.examples-section {
  margin: 8px 0 0 0; /* 1 × 8pt top spacing */
  width: 100%;
  max-width: 640px;
}

.examples-title {
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
  margin: 0 0 12px 0;
  text-align: left;
}

.examples-list {
  display: flex;
  flex-direction: column;
  gap: 8px; /* 1 × 8pt between examples */
}

.example-query {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 12px 0; /* 1.5 × 8pt vertical padding */
  background: transparent;
  border: none;
  border-radius: var(--r-input);
  cursor: pointer;
  transition: all 250ms cubic-bezier(.2,.8,.2,1);
  text-align: left;
  width: 100%;
  gap: 8px; /* 1 × 8pt between text and icon */
}

.example-query:hover {
  transform: translateX(2px);
}

.example-query:hover .example-text {
  color: var(--blue-700);
}

.example-query:hover svg {
  color: var(--blue-700);
}

.example-text {
  font-size: 14px;
  color: var(--text-subtle);
  font-weight: 400;
  line-height: 1.5;
  flex: 1;
}

.example-query svg {
  color: rgba(17, 74, 126, 0.5);
  flex-shrink: 0;
  transition: color 250ms cubic-bezier(.2,.8,.2,1);
}

/* ===================================
   ANIMATIONS
   =================================== */

.fade-in {
  animation: fadeIn 120ms ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* ===================================
   RESPONSIVE - Mobile
   =================================== */

@media (max-width: 768px) {
  .hero-content {
    padding: 16px;
    gap: 12px; /* 1.5 × 8pt on mobile */
  }
  
  .greeting {
    font-size: 28px; /* 3.5 × 8pt */
  }
  
  .subtitle {
    font-size: 16px; /* 2 × 8pt */
  }
  
  .orb-container {
    width: 160px;
    height: 160px;
    margin: 4px 0; /* Reduced on mobile */
  }
  
  .examples-title {
    font-size: 13px;
  }
  
  .example-text {
    font-size: 13px;
  }
}

/* ===================================
   RESPONSIVE - Small Height (Landscape)
   =================================== */

@media (max-height: 700px) {
  .hero-content {
    gap: 8px; /* 1 × 8pt on small screens */
    padding: 16px;
  }
  
  .greeting-section {
    gap: 4px;
  }
  
  .greeting {
    font-size: 24px; /* 3 × 8pt */
  }
  
  .subtitle {
    font-size: 15px;
  }
  
  .orb-container {
    width: 140px;
    height: 140px;
    margin: 4px 0;
  }
  
  .examples-section {
    margin: 4px 0 0 0;
  }
  
  .examples-list {
    gap: 6px;
  }
  
  .example-query {
    padding: 8px 0; /* 1 × 8pt */
  }
}

/* ===================================
   ACCESSIBILITY
   =================================== */

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  
  .example-query:hover {
    transform: none;
  }
  
  .composer-card.morphing {
    transform: none;
  }
}

/* Focus visible for keyboard navigation */
.example-query:focus-visible {
  outline: 2px solid var(--blue-500);
  outline-offset: 2px;
  border-radius: 8px;
}
</style>