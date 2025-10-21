import { ref, onMounted } from 'vue'

export interface ChatMessage {
  localId: string
  id?: string
  role: 'user' | 'assistant'
  content: string
  citations?: string[]
  latency_ms?: number
  sources?: string[]
}

export const useChat = () => {
  const conversationId = ref<string | null>(null)
  const messages = ref<ChatMessage[]>([])
  const busy = ref(false)
  const error = ref<string | null>(null)
  const abortController = ref<AbortController | null>(null)

  // Load conversationId from sessionStorage on mount
  onMounted(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('conversationId')
      if (stored) {
        conversationId.value = stored
      }
    }
  })

  const send = async (message: string) => {
    if (busy.value || !message.trim()) { return }

    // Generate local ID for immediate UI update
    const localId = crypto.randomUUID()

    // Push user message immediately
    const userMessage: ChatMessage = {
      localId,
      role: 'user',
      content: message
    }
    messages.value.push(userMessage)

    // Create assistant message for streaming
    const assistantMessage: ChatMessage = {
      localId: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      sources: []
    }
    messages.value.push(assistantMessage)

    busy.value = true
    error.value = null

    try {
      // Create abort controller for this request
      abortController.value = new AbortController()
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question: message,
          k: 12
        }),
        signal: abortController.value.signal
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

              if (data.sources) {
                assistantMessage.sources = data.sources
              } else if (data.token) {
                assistantMessage.content += data.token
              } else if (data.done) {
                break
              } else if (data.error) {
                throw new Error(data.error)
              }
            } catch (parseError: unknown) {
              console.warn('Failed to parse SSE data:', parseError)
            }
          }
        }
      }
    } catch (err: unknown) {
      console.error('Chat API error:', err)
      
      // Check if it was aborted
      if (err instanceof Error && err.name === 'AbortError') {
        assistantMessage.content = 'Antwort abgebrochen.'
      } else {
        error.value = 'Ups — Anfrage fehlgeschlagen. Bitte erneut senden.'
        assistantMessage.content = error.value
      }
    } finally {
      busy.value = false
      abortController.value = null
    }
  }

  const sendFeedback = async (messageId: string, helpful: boolean) => {
    try {
      await $fetch('/api/feedback', {
        method: 'POST',
        body: {
          message_id: messageId,
          helpful
        }
      })
    } catch (err) {
      console.error('Feedback API error:', err)
      // Silently fail for feedback
    }
  }

  const clearError = () => {
    error.value = null
  }

  const stop = () => {
    if (abortController.value) {
      abortController.value.abort()
    }
  }

  const reset = () => {
    // Stop any ongoing request
    if (abortController.value) {
      abortController.value.abort()
    }
    
    conversationId.value = null
    messages.value = []
    busy.value = false
    error.value = null
    abortController.value = null

    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('conversationId')
      sessionStorage.removeItem('firstMessage')
    }
  }

  return {
    conversationId,
    messages,
    busy,
    error,
    send,
    sendFeedback,
    clearError,
    stop,
    reset
  }
}
