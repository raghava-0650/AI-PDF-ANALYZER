# 📄 Papermind AI — Chat with your PDFs & take smart notes

Turn any PDF into a conversation. Upload a document, **chat with it** (RAG-powered, streamed answers), generate **one-click AI summaries**, and take rich notes side-by-side with the PDF — with autosave, dark mode, and Word export.

## ✨ Features

- **Chat with PDF (RAG)** — questions are embedded, matched against the document's vector index (cosine similarity, top-k retrieval), and answered by Gemini *grounded in the actual document*. Answers stream token-by-token, chat history is persisted per file, and any answer can be inserted into your notes with one click.
- **One-click AI summary** — generates structured, study-ready notes (summary, key points, takeaways) from the whole document.
- **Smart notes editor** — Tiptap rich-text editor with headings, lists, highlights, alignment. Select any question inside your notes and hit **Ask AI** — the answer is written inline, sourced from the PDF.
- **Autosave** — notes save automatically (debounced) with a live *Saving… / Saved* indicator. Manual save also available.
- **File management** — upload with validation + progress steps, rename, and delete (cleans up storage blob, notes, chat history *and* vector embeddings).
- **Freemium + payments** — 5 free PDFs; Razorpay checkout with server-side HMAC signature verification unlocks unlimited.
- **Polished UI** — modern SaaS design with dark/light mode, dashboard stats, search, empty/loading states, and a responsive split-screen workspace.

## 🏗️ Architecture

```
Next.js 16 (App Router)
├── app/api/pdf-loader   → fetch PDF → extract text → chunk (1200 chars, 200 overlap)
├── app/api/chat         → Convex vector search → Gemini (streamed RAG answers)
├── app/api/summary      → full-document chunks → Gemini (structured HTML notes)
├── Convex               → database + file storage + 768-dim vector index + actions
├── Clerk                → authentication (middleware-protected routes)
└── Razorpay             → order creation + signature verification
```

**Stack:** Next.js 16 · React 18 · Convex (DB, storage, vector search) · Clerk · Google Gemini (`gemini-2.5-flash` + `gemini-embedding-001`) · LangChain · Tiptap · Tailwind CSS v4 · Razorpay

### Interesting implementation details

- **Custom embeddings adapter** (`convex/lib/geminiEmbeddings.js`): Google retired `text-embedding-004` (Jan 2026). The replacement `gemini-embedding-001` defaults to 3072 dims, but the Convex index is 768-dim — so the adapter calls the REST API with `outputDimensionality: 768`, then **L2-normalizes** the vectors (truncated Gemini embeddings aren't unit-normalized, which would skew cosine similarity). Batches 100 texts per request.
- **Streaming responses**: `/api/chat` returns a `ReadableStream`; the client renders tokens as they arrive.
- **Retrieval quality**: the vector store holds chunks from *all* files, so search over-fetches (k=20), filters by `fileId`, and keeps the top 8 to build the prompt context.
- **Server-side AI**: all generation happens in API routes — the Gemini key is not shipped to the browser.

## 🚀 Getting started

```bash
# 1. Install
npm install

# 2. Configure — copy .env.example → .env.local and fill in keys
#    (Convex, Clerk, Gemini, Razorpay)

# 3. Give Convex actions the Gemini key
npx convex env set GEMINI_API_KEY <your-key>

# 4. Run (two terminals)
npx convex dev     # syncs schema + functions
npm run dev        # Next.js on http://localhost:3000
```

> **Note:** PDFs uploaded before the embedding-model migration were indexed with the retired `text-embedding-004` — re-upload them so chat/search works against the new vector space.

## 📁 Key folders

| Path | Purpose |
|---|---|
| `app/dashboard` | File grid, stats, search, upload/rename/delete |
| `app/workspace/[fileId]` | Split-screen: notes editor ⟷ PDF / chat tabs |
| `app/api` | RAG chat, summary, PDF ingestion, payments |
| `convex/` | Schema, queries/mutations, vector search action, embeddings adapter |
