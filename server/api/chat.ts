import { defineEventHandler, getMethod, createError, readBody, setHeader } from 'h3'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

export default defineEventHandler(async (event) => {
  console.log('[chat] route hit', getMethod(event))
  
  if (getMethod(event) === 'GET') {
    return { status: 'ready' }
  }
  
  if (getMethod(event) !== 'POST') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method Not Allowed'
    })
  }

  try {
    const body = await readBody(event)
    const { question, k = 12 } = body

    // Validate question
    if (!question || typeof question !== 'string' || !question.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Question is required'
      })
    }

    console.log('[chat] original question:', question)

    // @ts-ignore
    const config = useRuntimeConfig()
    const { supabaseUrl, supabaseServiceRoleKey, openaiApiKey } = config

    // Check if required config is available
    if (!supabaseUrl || !supabaseServiceRoleKey || !openaiApiKey) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Supabase URL/Key or OpenAI key not configured'
      })
    }

    // Create OpenAI client
    const openai = new OpenAI({ apiKey: openaiApiKey })

    // Embed question using text-embedding-3-small
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: question,
      dimensions: 1536
    })
    const queryVec = embeddingResponse.data[0].embedding

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Call Supabase RPC match_chunks
    const { data: chunks, error } = await supabase.rpc('match_chunks', {
      query_vec: queryVec,
      match_count: k
    })

    if (error) {
      console.error('[chat] Supabase RPC error:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to retrieve relevant chunks'
      })
    }

    console.log(`[chat] Retrieved ${chunks.length} chunks`)
    if (chunks.length > 0) {
      console.log(`[chat] First 2 distances: ${chunks.slice(0, 2).map(c => c.distance).join(', ')}`)
    }

    // Build context from chunks
    const context = chunks.map(chunk => `• ${chunk.content}`).join('\n')
    const sources = chunks.map(chunk => chunk.title || 'Unknown').slice(0, 3)

    // Build prompt
    const systemPrompt = `You answer strictly from the provided context.
Output must be visually structured and readable.

If information is missing, say politely: "Ich finde dazu keine Angabe in den Praxisunterlagen."
If a question has small spelling or phrasing errors, infer intent before deciding that information is missing.

Formatting rules (important):

Output clean, semantic Markdown only — no raw HTML.

Start every response with a clear title line including a relevant emoji (e.g. 📋, 🩺, ⚠️).

Use ## for section headings, with a blank line before and after each.

Emojis only in titles/subtitles (📋/🩺/⚠️/💡). Never place emojis before numbered lists or steps.

When explaining a procedure, render it as an ordered list with short, bolded step titles:

1. **Vorbereitung:** short description
2. **Durchführung:** short description

Do not use any emojis, symbols, or special characters in numbered lists or step sequences.

Listenregeln:
– Verwende geordnete Listen nur für Hauptschritte (1., 2., 3.).
– Unterpunkte innerhalb eines Schritts sind Aufzählungen mit „-" (keine 1.1, 1.2).
– NIEMALS Zahlen innerhalb von Hauptschritten verwenden (z.B. "1. 1. Text" ist verboten).
– Keine Emojis in Listen; Emojis nur in Titeln/Untertiteln.
– Zwischen Überschriften, Absätzen und Listen jeweils eine Leerzeile.

Separate paragraphs with a blank line; never mix headings inline with text.

Use short, scannable sentences — maximum 2–4 lines per paragraph.

Avoid long quotes; use short paragraphs.

Convert raw tables into short key:value lists when clearer.

Summarize long source passages; don't dump full paragraphs unless necessary.

Never concatenate multiple headings inline; preserve correct line breaks and spacing.

Cite short section titles when helpful.

Maintain a calm, professional tone suited to a Swiss medical assistant interface. Be concise but clear.

Do not add any frontend post-processing of text (no regex cleanups). The UI should simply render the model output as Markdown.`
    const userPrompt = `Question: ${question}\n\nContext:\n${context}`

    // Set headers for streaming
    setHeader(event, 'Content-Type', 'text/event-stream')
    setHeader(event, 'Cache-Control', 'no-cache')
    setHeader(event, 'Connection', 'keep-alive')

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send sources first
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ sources })}\n\n`))

          // Create OpenAI streaming completion
          const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            stream: true,
            temperature: 0.7
          })

          // Stream tokens
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content
            if (content) {
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ token: content })}\n\n`))
            }
          }

          // Send completion signal
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ done: true })}\n\n`))
          controller.close()
        } catch (error) {
          console.error('[chat] Streaming error:', error)
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ error: 'Streaming failed' })}\n\n`))
          controller.close()
        }
      }
    })

    return stream

  } catch (e) {
    console.error('[chat] failed', e)
    throw createError({
      statusCode: 500,
      statusMessage: e instanceof Error ? e.message : 'Unexpected server error'
    })
  }
})
