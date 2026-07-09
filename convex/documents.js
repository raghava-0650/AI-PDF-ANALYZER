import { v } from 'convex/values';

import { query } from './_generated/server';

/**
 * Return the raw text chunks of a file (used for full-document
 * summarization, where vector search isn't the right tool).
 */
export const GetFileChunks = query({
  args: {
    fileId: v.string(),
    maxChars: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.maxChars ?? 16000;

    const docs = await ctx.db
      .query('documents')
      .filter((q) => q.eq(q.field('metadata.fileId'), args.fileId))
      .collect();

    let text = '';
    for (const doc of docs) {
      if (text.length >= limit) break;
      text += doc.text + '\n';
    }

    return { text: text.slice(0, limit), totalChunks: docs.length };
  },
});
