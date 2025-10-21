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
    if (busy.value || !message.trim()) return

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
      console.log('Sending chat request:', message)
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: message,
          k: 12
        })
      })

      console.log('Response status:', response.status)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }

      console.log('Starting to read stream...')
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          console.log('Stream ended')
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              console.log('Received data:', data)
              
              if (data.sources) {
                assistantMessage.sources = data.sources
                console.log('Updated sources:', data.sources)
              } else if (data.token) {
                assistantMessage.content += data.token
                console.log('Added token:', data.token)
              } else if (data.done) {
                console.log('Streaming complete')
                break
              } else if (data.error) {
                throw new Error(data.error)
              }
            } catch (parseError) {
              console.warn('Failed to parse SSE data:', parseError)
            }
          }
        }
      }

    } catch (err: any) {
      console.error('Chat API error:', err)
      error.value = 'Ups — Anfrage fehlgeschlagen. Bitte erneut senden.'
      
      // Update assistant message with error
      assistantMessage.content = error.value
    } finally {
      busy.value = false
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

  const reset = () => {
    conversationId.value = null
    messages.value = []
    busy.value = false
    error.value = null
    
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
    reset
  }
}

