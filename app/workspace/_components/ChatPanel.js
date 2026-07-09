"use client"
import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import { useConvex, useMutation } from 'convex/react';
import {
  Check,
  Copy,
  LoaderCircle,
  MessageSquarePlus,
  NotebookPen,
  Send,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import { api } from '@/convex/_generated/api';
import { useUser } from '@clerk/nextjs';

const SUGGESTIONS = [
  'Summarize this document in a few sentences',
  'What are the key points?',
  'Explain the main topic in simple terms',
];

/** Tiny markdown → HTML converter (bold, italics, code, lists, headings). */
function mdToHtml(md) {
  const escaped = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const withBlocks = escaped.replace(
    /```(\w*)\n?([\s\S]*?)```/g,
    (_, _lang, code) => `<pre><code>${code.trim()}</code></pre>`
  );

  const lines = withBlocks.split('\n');
  let html = '';
  let listType = null;

  const closeList = () => {
    if (listType) {
      html += listType === 'ul' ? '</ul>' : '</ol>';
      listType = null;
    }
  };

  const inline = (text) =>
    text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
      .replace(/`([^`\n]+)`/g, '<code>$1</code>');

  for (const line of lines) {
    if (line.startsWith('<pre>')) {
      closeList();
      html += line;
    } else if (/^#{1,6}\s/.test(line)) {
      closeList();
      html += `<h4>${inline(line.replace(/^#{1,6}\s/, ''))}</h4>`;
    } else if (/^\s*[-*]\s+/.test(line)) {
      if (listType !== 'ul') { closeList(); html += '<ul>'; listType = 'ul'; }
      html += `<li>${inline(line.replace(/^\s*[-*]\s+/, ''))}</li>`;
    } else if (/^\s*\d+\.\s+/.test(line)) {
      if (listType !== 'ol') { closeList(); html += '<ol>'; listType = 'ol'; }
      html += `<li>${inline(line.replace(/^\s*\d+\.\s+/, ''))}</li>`;
    } else if (line.trim() === '') {
      closeList();
    } else {
      closeList();
      html += `<p>${inline(line)}</p>`;
    }
  }
  closeList();
  return html;
}

function AssistantMessage({ content, streaming, onAddToNotes }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex gap-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-sm">
        <Sparkles className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div
          className="chat-prose rounded-xl rounded-tl-sm border bg-card px-3.5 py-2.5 text-sm shadow-xs"
          dangerouslySetInnerHTML={{
            __html: mdToHtml(content) + (streaming ? '<span class="animate-pulse">▍</span>' : ''),
          }}
        />
        {!streaming && content && (
          <div className="mt-1 flex gap-1">
            <button
              onClick={onAddToNotes}
              className="flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
              title="Insert this answer into your notes"
            >
              <NotebookPen className="h-3 w-3" /> Add to notes
            </button>
            <button
              onClick={copy}
              className="flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title="Copy answer"
            >
              {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * RAG chat over the current PDF — streaming answers, persistent history,
 * and one-click "add answer to notes".
 */
function ChatPanel({ fileId, editor }) {
  const convex = useConvex();
  const addMessage = useMutation(api.chats.AddMessage);
  const clearMessages = useMutation(api.chats.ClearMessages);
  const { user } = useUser();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const bottomRef = useRef(null);

  // One-shot history load (local state stays the source of truth while streaming)
  useEffect(() => {
    let cancelled = false;
    convex
      .query(api.chats.GetMessages, { fileId })
      .then((saved) => {
        if (!cancelled && saved) {
          setMessages(saved.map((m) => ({ role: m.role, content: m.content })));
        }
      })
      .finally(() => !cancelled && setHistoryLoaded(true));
    return () => { cancelled = true; };
  }, [fileId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text) => {
    const question = (text ?? input).trim();
    if (!question || busy) return;

    const email = user?.primaryEmailAddress?.emailAddress ?? 'unknown';
    const history = messages.slice(-10);

    setInput('');
    setBusy(true);
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: question },
      { role: 'assistant', content: '', streaming: true },
    ]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, fileId, history, mode: 'chat' }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Request failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let answer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        answer += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: 'assistant', content: answer, streaming: true };
          return next;
        });
      }

      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { role: 'assistant', content: answer };
        return next;
      });

      // Persist the exchange
      await addMessage({ fileId, role: 'user', content: question, createdBy: email });
      await addMessage({ fileId, role: 'assistant', content: answer, createdBy: email });
    } catch (error) {
      setMessages((prev) => prev.slice(0, -2));
      setInput(question);
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  const addToNotes = (content) => {
    if (!editor) {
      toast.error('Editor is not ready yet');
      return;
    }
    editor.chain().focus('end').insertContent(`<blockquote>${mdToHtml(content)}</blockquote><p></p>`).run();
    toast.success('Added to notes');
  };

  const clearChat = async () => {
    setMessages([]);
    await clearMessages({ fileId });
    toast.success('Chat cleared');
  };

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {!historyLoaded ? (
          <div className="flex h-full items-center justify-center">
            <LoaderCircle className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30">
              <MessageSquarePlus className="h-6 w-6" />
            </div>
            <h3 className="mt-4 font-semibold">Chat with this PDF</h3>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              Ask anything about the document — answers are grounded in its
              actual content.
            </p>
            <div className="mt-5 flex w-full max-w-sm flex-col gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => send(suggestion)}
                  className="rounded-xl border bg-card px-3.5 py-2.5 text-left text-sm text-muted-foreground shadow-xs transition-all hover:border-primary/40 hover:text-foreground hover:shadow-sm"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) =>
              message.role === 'user' ? (
                <div key={index} className="flex justify-end">
                  <div className="max-w-[85%] rounded-xl rounded-tr-sm bg-primary px-3.5 py-2.5 text-sm text-primary-foreground shadow-sm">
                    {message.content}
                  </div>
                </div>
              ) : (
                <AssistantMessage
                  key={index}
                  content={message.content}
                  streaming={message.streaming}
                  onAddToNotes={() => addToNotes(message.content)}
                />
              )
            )}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Composer */}
      <div className="border-t bg-background/95 p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex items-end gap-2"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder="Ask about this PDF…"
            className="max-h-32 min-h-10 flex-1 resize-none rounded-xl border border-input bg-transparent px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
          />
          {messages.length > 0 && (
            <button
              type="button"
              onClick={clearChat}
              title="Clear chat history"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          <button
            type="submit"
            disabled={busy || !input.trim()}
            title="Send"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25 transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChatPanel;
