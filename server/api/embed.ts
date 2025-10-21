import { defineEventHandler, getMethod, createError } from 'h3'
import { createClient } from '@supabase/supabase-js'
import { readFile, readdir } from 'fs/promises'
import { join } from 'path'
import { fileURLToPath } from 'url'
import OpenAI from 'openai'

const ORG_ID = '344a1d93-1527-40e2-a809-319d83ba0bda'

export default defineEventHandler(async (event) => {
  console.log('[embed] route hit', getMethod(event))
  
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
    const config = useRuntimeConfig()
    const SUPABASE_URL = config.supabaseUrl
    const SUPABASE_SERVICE_ROLE_KEY = config.supabaseServiceRoleKey
    const OPENAI_API_KEY = config.openaiApiKey
    
    // Check if required config is available
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !OPENAI_API_KEY) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Supabase URL/Key or OpenAI key not configured. Check .env.local and nuxt.config.ts runtimeConfig.'
      })
    }
    
    // Initialize Supabase client with service role key
    const supabase = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Log configuration status (non-secret)
    console.log('[embed] config', {
      supabaseUrlSet: !!SUPABASE_URL,
      serviceKeyLen: SUPABASE_SERVICE_ROLE_KEY?.length,
      openaiKeyLen: OPENAI_API_KEY?.length
    })
    console.log('[embed] inserting for org', ORG_ID)
    console.log('🚀 Starting document ingestion...')
    
    // Read all files from ./data/mpa_docs/
    const docsDir = join(process.cwd(), 'data', 'mpa_docs')
    const files = await readdir(docsDir)
    const markdownFiles = files.filter(file => 
      file.endsWith('.md') || file.endsWith('.txt')
    )

    console.log(`📁 Found ${markdownFiles.length} files to process`)

    for (const fileName of markdownFiles) {
      try {
        console.log(`\n📄 Processing: ${fileName}`)
        
        // Read file content
        const filePath = join(docsDir, fileName)
        const content = await readFile(filePath, 'utf-8')
        
        // Insert document record
        const { data: docData, error: docError } = await supabase
          .from('documents')
          .insert({
            org_id: ORG_ID,
            title: fileName,
            source: 'upload'
          })
          .select('id')
          .single()

        if (docError) {
          console.error(`❌ Error inserting document ${fileName}:`, docError.message)
          continue
        }

        const docId = docData.id
        console.log(`✅ Document inserted with ID: ${docId}`)

        // Split content into chunks (700-900 tokens with ~100 token overlap)
        const chunks = splitIntoChunks(content, 700, 100)
        console.log(`📝 Split into ${chunks.length} chunks`)

        // Process all chunks and get embeddings
        const chunkData = []
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i]
          
          try {
            // Get embedding from OpenAI
            const embedding = await getEmbedding(chunk, OPENAI_API_KEY)
            chunkData.push({
              org_id: ORG_ID,
              doc_id: docId,
              chunk_index: i,
              content: chunk,
              embedding: embedding
            })
            console.log(`  ✅ Chunk ${i + 1}/${chunks.length} processed`)
            
          } catch (chunkError) {
            console.error(`❌ Error processing chunk ${i} for ${fileName}:`, chunkError)
            continue
          }
        }

        // Insert all chunks at once
        if (chunkData.length > 0) {
          const { error: chunkError } = await supabase
            .from('doc_chunks')
            .insert(chunkData)

          if (chunkError) {
            console.error(`❌ Error inserting chunks for ${fileName}:`, chunkError.message)
          }
        }

        console.log(`✅ Completed processing ${fileName} (${chunks.length} chunks)`)
        
      } catch (fileError) {
        console.error(`❌ Error processing file ${fileName}:`, fileError)
        continue
      }
    }

    console.log('\n✅ Ingestion complete')
    
    return {
      success: true,
      message: 'Document ingestion completed successfully'
    }

  } catch (e) {
    console.error('[embed] failed', e)
    throw createError({
      statusCode: 500,
      statusMessage: e instanceof Error ? e.message : 'Unexpected server error'
    })
  }
})

// Simple word-based chunking (approximates token count)
function splitIntoChunks(text: string, targetTokens: number, overlapTokens: number): string[] {
  const words = text.split(/\s+/)
  const wordsPerToken = 0.75 // Rough approximation: 1 token ≈ 0.75 words
  const targetWords = Math.floor(targetTokens * wordsPerToken)
  const overlapWords = Math.floor(overlapTokens * wordsPerToken)
  
  const chunks: string[] = []
  let start = 0
  
  while (start < words.length) {
    const end = Math.min(start + targetWords, words.length)
    const chunk = words.slice(start, end).join(' ')
    
    if (chunk.trim()) {
      chunks.push(chunk.trim())
    }
    
    if (end >= words.length) break
    
    // Move start position with overlap
    start = end - overlapWords
  }
  
  return chunks
}

// Get embedding from OpenAI API
async function getEmbedding(text: string, apiKey: string): Promise<number[]> {
  const openai = new OpenAI({ apiKey })
  
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
    dimensions: 1536
  })
  
  return response.data[0].embedding
}
