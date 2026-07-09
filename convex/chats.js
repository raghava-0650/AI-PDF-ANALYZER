import { v } from 'convex/values';

import {
  mutation,
  query,
} from './_generated/server';

export const AddMessage = mutation({
  args: {
    fileId: v.string(),
    role: v.string(),
    content: v.string(),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('chats', {
      fileId: args.fileId,
      role: args.role,
      content: args.content,
      createdBy: args.createdBy,
    });
  },
});

export const GetMessages = query({
  args: { fileId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('chats')
      .withIndex('byFileId', (q) => q.eq('fileId', args.fileId))
      .collect();
  },
});

export const ClearMessages = mutation({
  args: { fileId: v.string() },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query('chats')
      .withIndex('byFileId', (q) => q.eq('fileId', args.fileId))
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }
    return messages.length;
  },
});
