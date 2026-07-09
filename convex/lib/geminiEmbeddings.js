import { Embeddings } from '@langchain/core/embeddings';

/**
 * Custom LangChain embeddings adapter for Google's `gemini-embedding-001`.
 *
 * Why this exists:
 *  - `text-embedding-004` was shut down by Google on Jan 14, 2026.
 *  - The replacement (`gemini-embedding-001`) outputs 3072 dims by default,
 *    but our Convex vector index is 768-dim — so we request
 *    `outputDimensionality: 768` via the REST API (the LangChain helper
 *    class doesn't expose that option).
 *  - Truncated (non-3072) embeddings are not unit-normalized by Google,
 *    so we L2-normalize them ourselves for correct cosine similarity.
 */
const EMBEDDING_MODEL = 'gemini-embedding-001';
const DIMENSIONS = 768;
const BATCH_SIZE = 100; // API limit per batchEmbedContents call
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export class GeminiEmbeddings extends Embeddings {
  constructor({ apiKey }) {
    super({});
    if (!apiKey) throw new Error('GeminiEmbeddings: missing API key');
    this.apiKey = apiKey;
  }

  l2Normalize(vector) {
    const norm = Math.sqrt(vector.reduce((sum, x) => sum + x * x, 0)) || 1;
    return vector.map((x) => x / norm);
  }

  async callApi(texts, taskType) {
    const url = `${BASE_URL}/${EMBEDDING_MODEL}:batchEmbedContents?key=${this.apiKey}`;
    const body = {
      requests: texts.map((text) => ({
        model: `models/${EMBEDDING_MODEL}`,
        content: { parts: [{ text: String(text).slice(0, 8000) }] },
        taskType,
        outputDimensionality: DIMENSIONS,
      })),
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Gemini embeddings failed (${res.status}): ${detail}`);
    }

    const data = await res.json();
    return data.embeddings.map((e) => this.l2Normalize(e.values));
  }

  async embedDocuments(texts) {
    const vectors = [];
    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batch = texts.slice(i, i + BATCH_SIZE);
      vectors.push(...(await this.callApi(batch, 'RETRIEVAL_DOCUMENT')));
    }
    return vectors;
  }

  async embedQuery(text) {
    const [vector] = await this.callApi([text], 'RETRIEVAL_QUERY');
    return vector;
  }
}
