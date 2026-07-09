import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Server-side Gemini helper (used by API routes only — the key is
 * never shipped to the browser).
 *
 * `gemini-1.5-flash` was retired by Google in 2025; `gemini-2.5-flash`
 * is the current stable flash model.
 */
export const CHAT_MODEL = process.env.GEMINI_CHAT_MODEL || 'gemini-2.5-flash';

export function getGeminiModel(systemInstruction) {
  // Server-only. Never fall back to a NEXT_PUBLIC_* var — those are
  // inlined into the browser bundle and will get the key flagged as leaked.
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: CHAT_MODEL,
    ...(systemInstruction ? { systemInstruction } : {}),
    generationConfig: {
      temperature: 0.4,
      topP: 0.95,
      maxOutputTokens: 4096,
    },
  });
}

/** Wrap an SDK streaming result into a plain-text web ReadableStream. */
export function streamToResponse(result) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) controller.enqueue(encoder.encode(text));
        }
      } catch (error) {
        controller.enqueue(
          encoder.encode(`\n\n[Generation error: ${error.message}]`)
        );
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  });
}
