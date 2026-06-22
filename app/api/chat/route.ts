import { NextRequest } from 'next/server'
import { groq, CHAT_MODEL, DISCOVERY_SYSTEM_PROMPT } from '@/lib/groq'
import type { ChatRequest } from '@/types'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json()
    const { messages, context_repos = [] } = body

    if (!messages?.length) {
      return new Response(JSON.stringify({ error: 'Messages required' }), { status: 400 })
    }

    // Build context string from repos currently in view
    let repoContext = ''
    if (context_repos.length > 0) {
      repoContext = `\n\nCurrently visible repositories in the user's search results:\n` +
        context_repos.slice(0, 5).map(r =>
          `- ${r.full_name}: ${r.description ?? 'No description'} (⭐ ${r.stars.toLocaleString()}, health: ${r.health_label})`
        ).join('\n')
    }

    const systemPrompt = DISCOVERY_SYSTEM_PROMPT + repoContext

    // Stream response from Groq
    const stream = await groq.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      stream: true,
      max_tokens: 1024,
      temperature: 0.7
    })

    // Convert Groq stream to Web ReadableStream
    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content ?? ''
            if (delta) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: delta })}\n\n`))
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (err) {
          controller.error(err)
        }
      }
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    })
  } catch (err) {
    console.error('Chat API error:', err)
    return new Response(JSON.stringify({ error: 'Chat failed' }), { status: 500 })
  }
}
