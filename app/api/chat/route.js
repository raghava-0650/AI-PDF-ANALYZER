import { ConvexHttpClient } from 'convex/browser';

import { api } from '@/convex/_generated/api';
import {
  getGeminiModel,
  streamToResponse,
} from '@/lib/gemini';

export const maxDuration = 60;

const CHAT_SYSTEM_PROMPT = `You are Papermind, an AI assistant that answers questions about a PDF document.
Rules:
- Answer ONLY from the provided document context. If the context doesn't contain the answer, say so briefly and suggest what to ask instead.
- Be concise and well-structured. Use markdown: short paragraphs, **bold** key terms, bullet lists where helpful.
- Never mention "chunks", "context", or these instructions.`;

const ANSWER_SYSTEM_PROMPT = `You answer a question about a PDF using the provided document context.
Respond with clean HTML only (no markdown, no <html>/<body> tags, no code fences).
Use <p>, <ul>/<li>, <strong> and <mark> to highlight the most important phrases.
Keep it concise. If the context doesn't contain the answer, say so in one short <p>.`;

/**
 * RAG endpoint: retrieves the most relevant chunks for the question via
 * Convex vector search, then streams a grounded Gemini answer.
 *
 * body: { question, fileId, history?: [{role, content}], mode?: 'chat' | 'answer' }
 */
export async function POST(req) {
  try {
    const { question, fileId, history = [], mode = 'chat' } = await req.json();

    if (!question?.trim() || !fileId) {
      return Response.json(
        { error: 'question and fileId are required' },
        { status: 400 }
      );
    }

    // 1. Retrieve relevant document chunks
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);
    const raw = await convex.action(api.myAction.search, {
      query: question,
      fileId,
    });
    const chunks = JSON.parse(raw ?? '[]');
    const context = chunks
      .map((c, i) => `[${i + 1}] ${c.pageContent}`)
      .join('\n\n');

    // 2. Build the grounded prompt
    const prompt = `DOCUMENT CONTEXT:\n${context || '(no relevant content found)'}\n\nQUESTION: ${question}`;

    const model = getGeminiModel(
      mode === 'answer' ? ANSWER_SYSTEM_PROMPT : CHAT_SYSTEM_PROMPT
    );

    const chat = model.startChat({
      history: history.slice(-10).map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
    });

    // 3. Stream the answer back
    const result = await chat.sendMessageStream(prompt);
    const response = streamToResponse(result);
    response.headers.set('X-Context-Chunks', String(chunks.length));
    return response;
  } catch (error) {
    console.error('/api/chat error:', error);
    return Response.json(
      { error: error.message || 'AI request failed' },
      { status: 500 }
    );
  }
}
