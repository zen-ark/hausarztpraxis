<template>
  <div class="chat-page">
    <!-- Global App Bar -->
    <AppBar :is-thinking="busy" />


    <!-- Scrollable Chat Content -->
    <main ref="chatScrollContainer" class="chat-scroll-container">
      <div ref="chatContentWrapper" class="chat-content-wrapper">
        <!-- Chat column container -->
        <div ref="chatColumn" id="chat-column" class="chat-column">
          <!-- Ambient gradient layer -->
          <div data-ambient="gradient" class="ambient-gradient"></div>
          
          <div class="chat-content">
          <!-- Intro Card (shows initially, collapses after first assistant message) -->
          <IntroCard 
            :is-collapsed="hasFirstAssistantMessage" 
            @info="handleInfoClick"
          />
          
          <!-- Large central orb for thinking state -->
          <div v-if="busy && !messages.length" class="thinking-state">
            <OrbCanvas :size="200" state="thinking" />
            <p class="thinking-text">Ich suche eine passende Antwort</p>
          </div>
          
          <div v-if="messages.length" class="messages">
            <template v-for="(m, index) in messages" :key="m.localId">
              <ChatBubble
                :role="m.role"
                :content="m.content"
                :citations="m.citations"
                :message-id="m.id"
                @feedback="handleFeedback"
              />
            </template>
          </div>
          
          <!-- Typing indicator - moved outside messages block -->
          <TypingIndicator :visible="busy" />
          </div>
        </div>
      </div>
    </main>

    <!-- Fixed Input Bar -->
    <div class="composer-section">
      <div class="chat-input-wrapper">
        <div class="chat-input-container">
          <ChatInput
            ref="chatInputRef"
            :disabled="busy"
            :is-responding="busy"
            @submit="handleSubmit"
            @stop="handleStop"
          />
        </div>
      </div>
    </div>

    <!-- Footer -->
    <p class="footer-note">Demo – keine Patientendaten eingeben.</p>

    <!-- Toast for errors -->
    <Toast :show="!!error" :message="error || ''" @hide="clearError" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useChat } from '../composables/useChat'
import TypingIndicator from '../components/TypingIndicator.vue'
import AppBar from '../components/AppBar.vue'
import IntroCard from '../components/IntroCard.vue'
import ChatInput from '../components/ChatInput.vue'

// Use chat composable
const { conversationId, messages, busy, error, send, sendFeedback, clearError, stop, reset } = useChat()

// Local state
const chatInputRef = ref<InstanceType<typeof ChatInput> | null>(null)
const chatScrollContainer = ref<HTMLElement | null>(null)
const lastStatusUpdate = ref<Date>(new Date())
const isStreaming = ref(false)
const hasError = ref(false)
const isOffline = ref(false)

// Ambient layers state
const gradientHeight = ref('22vh')
const chatContentWrapper = ref<HTMLElement | null>(null)
const chatColumn = ref<HTMLElement | null>(null)

// Feedback handler
const handleFeedback = (messageId: string, helpful: boolean) => {
  sendFeedback(messageId, helpful)
}

// Ambient gradient height calculation
const updateGradientHeight = () => {
  if (!chatColumn.value || !chatInputRef.value) return
  
  const column = chatColumn.value
  const inputElement = chatInputRef.value.$el || chatInputRef.value
  
  if (!inputElement) return
  
  const columnRect = column.getBoundingClientRect()
  const inputRect = inputElement.getBoundingClientRect()
  
  // Calculate input center relative to column
  const inputCenterY = inputRect.top + (inputRect.height / 2) - columnRect.top
  
  // Get viewport width for responsive calculations
  const viewportWidth = window.innerWidth
  
  // Calculate base height based on breakpoints
  let baseHeight
  
  if (viewportWidth >= 1024) {
    // Desktop: clamp(18vh, 22vh, 28vh)
    baseHeight = Math.min(28, Math.max(18, 22))
  } else if (viewportWidth >= 640) {
    // Tablet: clamp(20vh, 24vh, 30vh)
    baseHeight = Math.min(30, Math.max(20, 24))
  } else {
    // Mobile: clamp(22vh, 28vh, 34vh)
    baseHeight = Math.min(34, Math.max(22, 28))
  }
  
  // Convert to pixels and cap at input center
  const baseHeightPx = (baseHeight / 100) * window.innerHeight
  const maxHeight = Math.min(baseHeightPx, inputCenterY)
  
  // Convert back to vh and set CSS variable
  const finalHeight = (maxHeight / window.innerHeight) * 100
  gradientHeight.value = `${finalHeight}vh`
  
  // Set CSS custom property
  column.style.setProperty('--grad-h', gradientHeight.value)
}

// Auto-scroll functionality
const shouldAutoScroll = ref(true)
const isUserScrolling = ref(false)

// Simple scroll to bottom function
const scrollToBottom = () => {
  if (!chatScrollContainer.value || !shouldAutoScroll.value) return
  
  nextTick(() => {
    if (chatScrollContainer.value) {
      chatScrollContainer.value.scrollTop = chatScrollContainer.value.scrollHeight
    }
  })
}

// Check if user is near bottom (within 100px)
const isNearBottom = () => {
  if (!chatScrollContainer.value) return true
  const { scrollTop, scrollHeight, clientHeight } = chatScrollContainer.value
  return scrollHeight - scrollTop - clientHeight < 100
}

// Handle user scroll events
const handleScroll = () => {
  isUserScrolling.value = true
  shouldAutoScroll.value = isNearBottom()
  
  // Reset user scrolling flag after a delay
  setTimeout(() => {
    isUserScrolling.value = false
  }, 150)
}

// Watch for new messages and auto-scroll
watch(messages, () => {
  if (shouldAutoScroll.value) {
    scrollToBottom()
  }
}, { deep: true })

// Watch for busy state changes (typing indicator)
watch(busy, (newBusy) => {
  if (newBusy && shouldAutoScroll.value) {
    scrollToBottom()
  }
})

// Watch for error state changes
watch(error, (newError) => {
  hasError.value = !!newError
  if (newError) {
    lastStatusUpdate.value = new Date()
    // Auto-revert error after 6 seconds
    setTimeout(() => {
      hasError.value = false
    }, 6000)
  }
})

// Watch for busy state to detect streaming
watch(busy, (newBusy, oldBusy) => {
  if (newBusy && !oldBusy) {
    // Starting to think
    lastStatusUpdate.value = new Date()
  } else if (!newBusy && oldBusy) {
    // Finished thinking, now streaming or done
    isStreaming.value = false
  }
})

// Watch for new messages to detect streaming
watch(messages, (newMessages) => {
  if (newMessages.length > 0) {
    const lastMessage = newMessages[newMessages.length - 1]
    if (lastMessage.role === 'assistant' && busy.value) {
      isStreaming.value = true
    }
  }
}, { deep: true })

// Computed orb size
const orbSize = computed(() => {
  if (typeof window === 'undefined') return 120
  return window.innerWidth < 768 ? 80 : 120
})

// Check if we have the first assistant message
const hasFirstAssistantMessage = computed(() => {
  return messages.value.some(msg => msg.role === 'assistant')
})

// Status chip state logic
const statusChipState = computed(() => {
  if (isOffline.value) return 'offline'
  if (hasError.value) return 'error'
  if (isStreaming.value) return 'answering'
  if (busy.value) return 'thinking'
  return 'idle'
})



// Check for first message from landing page and redirect if empty
onMounted(async () => {
  if (typeof window !== 'undefined') {
    const firstMessage = sessionStorage.getItem('firstMessage')
    if (firstMessage) {
      // We have a first message, so don't redirect
      sessionStorage.removeItem('firstMessage')
      // Send directly - the send() function will add the user message
      await send(firstMessage)
      // Ensure scroll happens after message is added
      nextTick(() => {
        scrollToBottom()
      })
    } else if (messages.value.length === 0 && !busy.value) {
      // Add sample messages for development preview
      if (false) { // Only show sample messages when not coming from landing page
        messages.value = [
          {
            localId: 'sample-1',
            role: 'user',
            content: 'Wie bestelle ich ein 24h-Blutdruckmessgerät?'
          },
          {
            localId: 'sample-2', 
            role: 'assistant',
            content: '## 📋 Bestellprozess für 24h-BD Geräte\n\n**1. Bestellung:**\n- Im V-Shop oder telefonisch mit Kundennummer: 110677\n- Gerät muss mindestens 3 Tage vor dem Anziehen bestellt werden\n\n**2. Terminplanung:**\n- 1 Tag vor dem Anziehen Memo in MPA-Spalte eintragen\n- 15 Minuten für Anziehen und 15 Minuten für Ausziehen planen\n\n**3. Durchführung:**\n- Gerät am Morgen anziehen\n- Patient über Funktion aufklären\n- Am nächsten Tag ausziehen und Daten auslesen'
          },
          {
            localId: 'sample-3',
            role: 'user',
            content: 'Was muss ich bei der Ergometrie beachten?'
          },
          {
            localId: 'sample-4',
            role: 'assistant',
            content: '## 🩺 Ergometrie Durchführung\n\n**Vorbereitung:**\n- Patient soll 2 Stunden vorher nichts essen\n- Keine koffeinhaltigen Getränke\n- Medikamente wie besprochen einnehmen\n\n**Durchführung:**\n- Ruhe-EKG vor Beginn\n- Belastung stufenweise steigern\n- Blutdruck und Puls kontinuierlich messen\n- Patient über Symptome befragen\n\n**Nach der Untersuchung:**\n- 5 Minuten Nachbeobachtung\n- EKG und Blutdruck dokumentieren\n- Befund sofort auswerten'
          },
          {
            localId: 'sample-5',
            role: 'user',
            content: 'Wie funktioniert die Langzeit-EKG Auswertung?'
          },
          {
            localId: 'sample-6',
            role: 'assistant',
            content: '## ⚡ Langzeit-EKG Auswertung\n\n**1. Gerät auslesen:**\n- Nach 24-48 Stunden Gerät zurückgeben\n- Daten in MPA-System übertragen\n- Automatische Rhythmusanalyse starten\n\n**2. Manuelle Kontrolle:**\n- Arrhythmien markieren\n- ST-Strecken-Veränderungen prüfen\n- Pausen und Extrasystolen zählen\n\n**3. Befunderstellung:**\n- Rhythmusstörungen dokumentieren\n- Therapieempfehlungen aussprechen\n- Kontrolltermin vereinbaren\n\n**Wichtige Parameter:**\n- Durchschnittliche Herzfrequenz\n- Minimale und maximale HF\n- Anzahl der Extrasystolen\n- Pausen > 2 Sekunden'
          },
          {
            localId: 'sample-7',
            role: 'user',
            content: 'Welche Vorbereitung braucht ein Patient für die Lungenfunktion?'
          },
          {
            localId: 'sample-8',
            role: 'assistant',
            content: '## 💨 Lungenfunktion Vorbereitung\n\n**Patientenaufklärung:**\n- 4 Stunden vorher nicht rauchen\n- Keine bronchienerweiternden Medikamente\n- Normale Mahlzeiten erlaubt\n\n**Durchführung:**\n- Patient sitzt aufrecht\n- Nase mit Klammer verschließen\n- Mundstück fest umschließen\n- Anweisungen genau befolgen\n\n**Messungen:**\n- Vitalkapazität (VC)\n- Einsekundenkapazität (FEV1)\n- Tiffeneau-Index (FEV1/VC)\n- Peak-Flow-Messung\n\n**Qualitätskontrolle:**\n- Mindestens 3 gültige Messungen\n- Reproduzierbarkeit prüfen\n- Bei Abweichungen wiederholen'
          }
        ]
      } else {
        // Only redirect if no first message AND no existing messages
        // @ts-ignore
        navigateTo('/landingpage')
      }
    } else if (chatInputRef.value) {
      chatInputRef.value.focus()
    }
  } else {
    // SSR fallback - redirect if no messages
    if (messages.value.length === 0 && !busy.value) {
      // @ts-ignore
      navigateTo('/landingpage')
    }
  }
  
  // Add keyboard shortcut for new chat
  const handleKeydown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
      e.preventDefault()
      handleNewChat()
    }
  }
  window.addEventListener('keydown', handleKeydown)
  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
    window.removeEventListener('resize', handleResize)
    if (chatScrollContainer.value) {
      chatScrollContainer.value.removeEventListener('scroll', handleScroll)
    }
  })
  
  // Add scroll event listener
  if (chatScrollContainer.value) {
    chatScrollContainer.value.addEventListener('scroll', handleScroll)
  }
  
  // Add resize listener for ambient layers
  const handleResize = () => {
    updateGradientHeight()
  }
  window.addEventListener('resize', handleResize)
  
  // Initial scroll to bottom
  scrollToBottom()
  
  // Initial gradient height calculation
  nextTick(() => {
    updateGradientHeight()
  })
})

// Helper functions for source validation
const hasValidSources = (sources: string[] | undefined) => {
  if (!sources || sources.length === 0) return false
  return validSources(sources).length > 0
}

const validSources = (sources: string[] | undefined) => {
  if (!sources) return []
  return sources.filter(source => 
    source && 
    source.trim() !== '' && 
    source !== 'Unknown' && 
    !source.includes('Unknown, Unknown')
  )
}

// Event handlers
const handleSubmit = async (message: string) => {
  if (!message.trim() || busy.value) return
  
  // Enable auto-scroll when user sends message
  shouldAutoScroll.value = true
  scrollToBottom()
  
  await send(message)
  
  // Focus input after sending
  if (chatInputRef.value) {
    chatInputRef.value.focus()
  }
}

const handleStop = () => {
  stop()
}

const handleNewChat = () => {
  if (busy.value) {
    // Show toast for busy state - for now just return
    return
  }
  
  reset()
  // @ts-ignore
  navigateTo('/landingpage')
}

// Settings functionality removed

const handleInfoClick = () => {
  // TODO: Implement info modal
}


</script>

<style scoped>
.chat-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #E5ECF7;
}

/* App Bar is now handled by AppBar component */


/* Chat container */
.chat-container {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 40px 24px;
  max-width: 960px;
  margin: 0 auto;
  width: 100%;
}

.chat-thread {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.messages-area {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
}


.empty-text {
  font-size: var(--text-lg);
  color: var(--grey-600);
  margin: 0;
}

.messages {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background: transparent;
  border: none;
  box-shadow: none;
}

.messages:first-child {
  margin-top: 8px;
}

.thinking-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
  gap: 16px;
  background: transparent;
  border: none;
  box-shadow: none;
}

.thinking-text {
  font-size: var(--text-lg);
  color: var(--grey-600);
  margin: 0;
  font-style: italic;
}

.sources-footer {
  margin-top: 12px;
  padding: 12px 16px;
  background: rgba(30, 100, 183, 0.05);
  border-radius: 8px;
  border-left: 3px solid rgba(30, 100, 183, 0.2);
}

.sources-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--grey-600);
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.sources-list {
  font-size: 13px;
  color: var(--grey-700);
  line-height: 1.4;
}

.source-item {
  color: var(--grey-600);
}


@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}



/* Composer section */
.composer-section {
  padding: 20px 0;
  width: 100%;
}

.chat-input-wrapper {
  display: flex;
  justify-content: center;
  width: 100%;
}

.chat-input-container {
  max-width: 600px;
  margin: 0 auto;
  width: 100%;
  padding: 0 24px;
}

.composer-form {
  width: 100%;
}

.input-group {
  display: flex;
  align-items: center;
  background: #fff;
  border: 1px solid rgba(0,0,0,0.02);
  border-radius: var(--r-input);
  padding: 8px 12px;
  box-shadow: var(--shadow-sm);
  transition: all 250ms cubic-bezier(.2,.8,.2,1);
  gap: 8px;
}

.input-group:focus-within {
  border-color: #3b82f6;
  box-shadow: var(--shadow-md), 0 0 0 3px rgba(59, 130, 246, 0.1);
  transform: translateY(-1px);
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
  color: var(--text);
  padding: 0 12px;
  min-height: auto;
}

.chat-input::placeholder {
  color: var(--placeholder);
}

.chat-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Accessory buttons removed */

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

.footer-note {
  text-align: center;
  padding: 24px;
  font-size: 14px;
  color: var(--grey-600);
  margin: 0;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .chat-content {
    padding: 0 16px;
    max-width: 100%;
  }
  
  .composer-section {
    bottom: calc(env(safe-area-inset-bottom) + 56px);
    padding: var(--space-2) var(--space-4) 0;
  }
  
  .input-group {
    height: 56px;
    padding: 0 12px;
  }
  
  .send-button-icon {
    width: 36px;
    height: 36px;
  }
  
  .chat-input-container {
    padding: 0;
  }
  
  .chat-scroll-container {
    margin-top: 60px; /* AppBar height */
    padding-top: 16px;
    padding-bottom: calc(env(safe-area-inset-bottom) + 56px + 120px);
  }
}

/* Tablet and desktop - maintain centered layout */
@media (min-width: 769px) {
  .chat-content {
    max-width: 820px;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .input-group,
  .send-button-icon {
    transition: opacity 120ms ease;
  }
  
  .input-group:focus-within {
    transform: none;
  }
  
  .send-button-icon:hover:not(:disabled) {
    transform: none;
  }
}

/* Basic Markdown styling for AI responses */
.messages :deep(h1), .messages :deep(h2), .messages :deep(h3) {
  margin: 1.5rem 0 0.75rem 0;
  font-weight: 600;
  color: var(--blue-600);
}

.messages :deep(h1) {
  font-size: 1.25rem;
  border-bottom: 2px solid var(--blue-200);
  padding-bottom: 0.5rem;
}

.messages :deep(h2) {
  font-size: 1.1rem;
}

.messages :deep(h3) {
  font-size: 1rem;
}

.messages :deep(strong) {
  font-weight: 600;
  color: var(--text);
}

.messages :deep(ul), .messages :deep(ol) {
  margin: 1rem 0;
  padding-left: 1.5rem;
}

.messages :deep(li) {
  margin: 0.5rem 0;
  line-height: 1.6;
}

.messages :deep(p) {
  margin: 1rem 0;
  line-height: 1.6;
}

.messages :deep(p:first-child) {
  margin-top: 0;
}

.messages :deep(p:last-child) {
  margin-bottom: 0;
}

/* Simple Flexbox Layout */
.chat-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Scrollable Chat Content */
.chat-scroll-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 24px 0;
  margin-top: 60px; /* Account for fixed AppBar height */
  /* Hide scrollbar */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
  background: var(--bg);
}

.chat-scroll-container::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}


.chat-content-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

/* Chat column container */
.chat-column {
  width: min(100%, var(--col-max));
  margin-inline: auto;
  padding: var(--gutter);
  position: relative;
  z-index: 2;
}

.chat-content {
  width: 100%;
  position: relative;
  z-index: 3;
}

/* Ambient gradient layer */
.ambient-gradient {
  position: absolute;
  inset-inline: 0;
  bottom: 0;
  height: var(--grad-h, 22vh);
  background: linear-gradient(to top, 
    var(--bg) 0%, 
    transparent 100%
  );
  pointer-events: none;
  z-index: 1;
  will-change: transform;
  contain: layout paint;
}

/* Fixed Input Bar */
.composer-section {
  flex-shrink: 0;
  padding: 20px 0;
  background: var(--bg);
  position: relative;
  z-index: 2;
}



</style>