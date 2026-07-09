import { v } from 'convex/values';

import { ConvexVectorStore } from '@langchain/community/vectorstores/convex';

import { action } from './_generated/server.js';
import { GeminiEmbeddings } from './lib/geminiEmbeddings.js';

// Provided via the Convex deployment env, NOT .env.local:
//   npx convex env set GEMINI_API_KEY <your-key>
const getApiKey = () => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error(
      'GEMINI_API_KEY is not set on the Convex deployment. ' +
        'Run: npx convex env set GEMINI_API_KEY <your-key>'
    );
  }
  return key;
};

/**
 * Embed the split PDF chunks and store them in the Convex vector index.
 */
export const ingest = action({
  args: {
    splitText: v.array(v.string()),
    fileId: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.splitText?.length) {
      throw new Error('No text chunks to ingest — is the PDF empty or scanned?');
    }

    await ConvexVectorStore.fromTexts(
      args.splitText,
      { fileId: args.fileId }, // metadata applied to every chunk
      new GeminiEmbeddings({ apiKey: getApiKey() }),
      { ctx }
    );

    return { chunks: args.splitText.length };
  },
});

/**
 * Semantic search over a single file's chunks.
 * We over-fetch (k=20) then filter by fileId, because the vector index
 * stores chunks from every file.
 */
export const search = action({
  args: {
    query: v.string(),
    fileId: v.string(),
  },
  handler: async (ctx, args) => {
    const vectorStore = new ConvexVectorStore(
      new GeminiEmbeddings({ apiKey: getApiKey() }),
      { ctx }
    );

    const results = (await vectorStore.similaritySearch(args.query, 20))
      .filter((doc) => doc.metadata?.fileId === args.fileId)
      .slice(0, 8)
      .map((doc) => ({ pageContent: doc.pageContent }));

    return JSON.stringify(results);
  },
});
