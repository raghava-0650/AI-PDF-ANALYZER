import { ConvexHttpClient } from 'convex/browser';

import { api } from '@/convex/_generated/api';
import { getGeminiModel } from '@/lib/gemini';

export const maxDuration = 60;

const SUMMARY_SYSTEM_PROMPT = `You are an expert note-taker. You will receive raw text extracted from a PDF.
Produce study-ready notes as clean HTML only (no markdown, no <html>/<body> tags, no code fences).
Structure exactly:
<h2>📄 Summary</h2> followed by 2-3 short <p> paragraphs,
<h2>🔑 Key Points</h2> followed by a <ul> of 5-8 concise points with <strong> on key terms,
<h2>💡 Takeaways</h2> followed by a <ul> of 2-3 actionable insights.`;

/**
 * Generates a structured summary of the whole document.
 * body: { fileId }
 */
export async function POST(req) {
  try {
    const { fileId } = await req.json();
    if (!fileId) {
      return Response.json({ error: 'fileId is required' }, { status: 400 });
    }

    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);
    const { text, totalChunks } = await convex.query(
      api.documents.GetFileChunks,
      { fileId, maxChars: 16000 }
    );

    if (!text?.trim()) {
      return Response.json(
        { error: 'No document text found. Try re-uploading the PDF.' },
        { status: 404 }
      );
    }

    const model = getGeminiModel(SUMMARY_SYSTEM_PROMPT);
    const result = await model.generateContent(
      `PDF TEXT (${totalChunks} chunks):\n${text}`
    );

    const html = result.response
      .text()
      .replace(/```html/gi, '')
      .replace(/```/g, '')
      .trim();

    return Response.json({ html });
  } catch (error) {
    console.error('/api/summary error:', error);
    return Response.json(
      { error: error.message || 'Summary generation failed' },
      { status: 500 }
    );
  }
}
