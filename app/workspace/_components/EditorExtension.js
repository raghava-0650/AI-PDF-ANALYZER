"use client"
import React, { useState } from 'react';

import { saveAs } from 'file-saver';
import htmlDocx from 'html-docx-js/dist/html-docx';
import {
  Bold,
  Code,
  Download,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  Italic,
  List,
  ListOrdered,
  LoaderCircle,
  Redo2,
  Sparkles,
  Strikethrough,
  TextAlignCenter,
  TextAlignEnd,
  TextAlignStart,
  TextQuote,
  Underline,
  Undo2,
  WandSparkles,
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';

function ToolbarButton({ onClick, active, title, disabled, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`rounded-md p-1.5 transition-colors disabled:opacity-40 ${
        active
          ? 'bg-primary/15 text-primary'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="mx-1 h-5 w-px self-center bg-border" />;
}

function EditorExtension({ editor, fileName }) {
  const { fileId } = useParams();
  const [aiLoading, setAiLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const readStream = async (res) => {
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let text = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value, { stream: true });
    }
    return text;
  };

  // Ask AI about the selected text; the answer is inserted below it
  const onAiClick = async () => {
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, ' ').trim();

    if (!selectedText) {
      toast.info('Select a question or phrase in your notes first');
      return;
    }

    setAiLoading(true);
    const toastId = toast.loading('AI is finding the answer…');
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: selectedText, fileId, mode: 'answer' }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'AI request failed');
      }

      const html = (await readStream(res))
        .replace(/```html/gi, '')
        .replace(/```/g, '')
        .trim();

      editor
        .chain()
        .focus()
        .insertContentAt(to, `<p><strong>✨ AI Answer:</strong></p>${html}<p></p>`)
        .run();

      toast.success('Answer added to your notes', { id: toastId });
    } catch (error) {
      toast.error(error.message, { id: toastId });
    } finally {
      setAiLoading(false);
    }
  };

  // Generate a structured summary of the whole PDF into the notes
  const onSummarize = async () => {
    setSummaryLoading(true);
    const toastId = toast.loading('Summarizing the document…');
    try {
      const res = await fetch('/api/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Summary failed');

      editor.chain().focus('end').insertContent(`${data.html}<p></p>`).run();
      toast.success('Summary added to your notes', { id: toastId });
    } catch (error) {
      toast.error(error.message, { id: toastId });
    } finally {
      setSummaryLoading(false);
    }
  };

  const download = () => {
    const htmlString = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${fileName ?? 'Notes'}</title></head><body>${editor.getHTML()}</body></html>`;
    const converted = htmlDocx.asBlob(htmlString);
    saveAs(converted, `${(fileName || 'notes').replace(/\.pdf$/i, '')}-notes.docx`);
    toast.success('Notes exported as Word document');
  };

  if (!editor) return null;

  const iconSize = 'h-4 w-4';

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b bg-background/95 px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <ToolbarButton title="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
        <Undo2 className={iconSize} />
      </ToolbarButton>
      <ToolbarButton title="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
        <Redo2 className={iconSize} />
      </ToolbarButton>

      <Divider />

      <ToolbarButton title="Heading 1" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })}>
        <Heading1 className={iconSize} />
      </ToolbarButton>
      <ToolbarButton title="Heading 2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })}>
        <Heading2 className={iconSize} />
      </ToolbarButton>
      <ToolbarButton title="Heading 3" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })}>
        <Heading3 className={iconSize} />
      </ToolbarButton>

      <Divider />

      <ToolbarButton title="Bold" onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')}>
        <Bold className={iconSize} />
      </ToolbarButton>
      <ToolbarButton title="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')}>
        <Italic className={iconSize} />
      </ToolbarButton>
      <ToolbarButton title="Underline" onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')}>
        <Underline className={iconSize} />
      </ToolbarButton>
      <ToolbarButton title="Strikethrough" onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')}>
        <Strikethrough className={iconSize} />
      </ToolbarButton>
      <ToolbarButton title="Highlight" onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')}>
        <Highlighter className={iconSize} />
      </ToolbarButton>
      <ToolbarButton title="Inline code" onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')}>
        <Code className={iconSize} />
      </ToolbarButton>

      <Divider />

      <ToolbarButton title="Bullet list" onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')}>
        <List className={iconSize} />
      </ToolbarButton>
      <ToolbarButton title="Numbered list" onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')}>
        <ListOrdered className={iconSize} />
      </ToolbarButton>
      <ToolbarButton title="Quote" onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')}>
        <TextQuote className={iconSize} />
      </ToolbarButton>

      <Divider />

      <ToolbarButton title="Align left" onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })}>
        <TextAlignStart className={iconSize} />
      </ToolbarButton>
      <ToolbarButton title="Align center" onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })}>
        <TextAlignCenter className={iconSize} />
      </ToolbarButton>
      <ToolbarButton title="Align right" onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })}>
        <TextAlignEnd className={iconSize} />
      </ToolbarButton>

      <div className="ml-auto flex items-center gap-0.5">
        <button
          type="button"
          onClick={onSummarize}
          disabled={summaryLoading}
          title="Insert an AI summary of the whole PDF"
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
        >
          {summaryLoading ? (
            <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <WandSparkles className="h-3.5 w-3.5" />
          )}
          Summarize
        </button>
        <button
          type="button"
          onClick={onAiClick}
          disabled={aiLoading}
          title="Ask AI about the selected text"
          className="flex items-center gap-1.5 rounded-md bg-gradient-to-r from-indigo-600 to-violet-600 px-2.5 py-1.5 text-xs font-medium text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {aiLoading ? (
            <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          Ask AI
        </button>

        <Divider />

        <ToolbarButton title="Export notes as Word (.docx)" onClick={download}>
          <Download className={iconSize} />
        </ToolbarButton>
      </div>
    </div>
  );
}

export default EditorExtension;
