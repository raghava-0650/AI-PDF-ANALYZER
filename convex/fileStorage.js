import { v } from 'convex/values';

import {
  mutation,
  query,
} from './_generated/server';

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

export const AddFileEntryToDb = mutation({
  args: {
    fileId: v.string(),
    storageId: v.id('_storage'),
    fileName: v.string(),
    createdBy: v.string(),
    fileUrl: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('pdfFiles', {
      fileId: args.fileId,
      fileName: args.fileName,
      storageId: args.storageId,
      fileUrl: args.fileUrl,
      createdBy: args.createdBy,
    });
    return 'Inserted';
  },
});

export const getFileUrl = mutation({
  args: { storageId: v.id('_storage') },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

export const GetFileRecord = query({
  args: { fileId: v.string() },
  handler: async (ctx, args) => {
    const result = await ctx.db
      .query('pdfFiles')
      .withIndex('byFileId', (q) => q.eq('fileId', args.fileId))
      .collect();
    return result[0] ?? null;
  },
});

export const GetUserFiles = query({
  args: { userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (!args?.userEmail) return;

    return await ctx.db
      .query('pdfFiles')
      .withIndex('byCreatedBy', (q) => q.eq('createdBy', args.userEmail))
      .order('desc')
      .collect();
  },
});

export const RenameFile = mutation({
  args: {
    fileId: v.string(),
    newName: v.string(),
  },
  handler: async (ctx, args) => {
    const name = args.newName.trim();
    if (!name) throw new Error('File name cannot be empty');

    const records = await ctx.db
      .query('pdfFiles')
      .withIndex('byFileId', (q) => q.eq('fileId', args.fileId))
      .collect();
    if (records.length === 0) throw new Error('File not found');

    await ctx.db.patch(records[0]._id, { fileName: name });
    return 'renamed';
  },
});

/**
 * Delete a PDF and everything attached to it:
 * storage blob, file record, notes, chat history, and vector chunks.
 */
export const DeleteFile = mutation({
  args: { fileId: v.string() },
  handler: async (ctx, args) => {
    const records = await ctx.db
      .query('pdfFiles')
      .withIndex('byFileId', (q) => q.eq('fileId', args.fileId))
      .collect();
    if (records.length === 0) throw new Error('File not found');

    for (const record of records) {
      try {
        await ctx.storage.delete(record.storageId);
      } catch (_) {
        // blob may already be gone — still clean up the rest
      }
      await ctx.db.delete(record._id);
    }

    const notes = await ctx.db
      .query('notes')
      .withIndex('byFileId', (q) => q.eq('fileId', args.fileId))
      .collect();
    for (const note of notes) await ctx.db.delete(note._id);

    const chats = await ctx.db
      .query('chats')
      .withIndex('byFileId', (q) => q.eq('fileId', args.fileId))
      .collect();
    for (const chat of chats) await ctx.db.delete(chat._id);

    const chunks = await ctx.db
      .query('documents')
      .filter((q) => q.eq(q.field('metadata.fileId'), args.fileId))
      .collect();
    for (const chunk of chunks) await ctx.db.delete(chunk._id);

    return 'deleted';
  },
});
