"use client"
import React, {
  useContext,
  useEffect,
  useRef,
} from 'react';

import { useMutation, useQuery } from 'convex/react';
import { toast } from 'sonner';

import { FileSaveContext } from '@/app/_context/FileSaveContext';
import { api } from '@/convex/_generated/api';
import { useUser } from '@clerk/nextjs';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import {
  EditorContent,
  useEditor,
} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

import EditorExtension from './EditorExtension';

const AUTOSAVE_DELAY = 1500;

function TextEditor({ fileId, fileName, onEditorReady }) {
  const notes = useQuery(api.notes.GetNotes, { fileId });
  const saveNotes = useMutation(api.notes.AddNotes);
  const { user } = useUser();
  const { fileSave, setSaveStatus } = useContext(FileSaveContext);

  const saveTimer = useRef(null);
  const notesLoaded = useRef(false);

  const persist = async (html) => {
    if (!user?.primaryEmailAddress?.emailAddress) return;
    try {
      setSaveStatus('saving');
      await saveNotes({
        notes: html,
        fileId,
        createdBy: user.primaryEmailAddress.emailAddress,
      });
      setSaveStatus('saved');
    } catch (error) {
      setSaveStatus('idle');
      toast.error('Could not save notes: ' + error.message);
    }
  };

  const editor = useEditor({
    // Required in Next.js — avoids SSR hydration mismatches with tiptap v3
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder:
          'Start taking notes… Select any text and hit ✨ to ask AI about it.',
      }),
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-full px-6 py-5',
      },
    },
    onUpdate: ({ editor }) => {
      // Debounced autosave
      setSaveStatus('saving');
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => persist(editor.getHTML()), AUTOSAVE_DELAY);
    },
  });

  // Load saved notes once (don't clobber the user's cursor on later query updates)
  useEffect(() => {
    if (editor && notes !== undefined && !notesLoaded.current) {
      notesLoaded.current = true;
      if (notes) editor.commands.setContent(notes);
      setSaveStatus('saved');
    }
  }, [notes, editor]);

  // Manual save from the workspace header
  useEffect(() => {
    if (fileSave && editor) {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      persist(editor.getHTML()).then(() => toast.success('Notes saved'));
    }
  }, [fileSave]);

  // Expose the editor instance (chat panel inserts answers into notes)
  useEffect(() => {
    if (editor && onEditorReady) onEditorReady(editor);
  }, [editor]);

  // Cleanup pending timer
  useEffect(() => () => saveTimer.current && clearTimeout(saveTimer.current), []);

  return (
    <div className="flex h-full flex-col">
      <EditorExtension editor={editor} fileName={fileName} />
      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} className="h-full" />
      </div>
    </div>
  );
}

export default TextEditor;
