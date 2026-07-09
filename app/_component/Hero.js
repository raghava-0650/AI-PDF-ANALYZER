"use client"
import React from 'react';

import {
  BotMessageSquare,
  CloudUpload,
  FileDown,
  MessagesSquare,
  MoveRight,
  NotebookPen,
  ScanSearch,
  Sparkles,
  WandSparkles,
} from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

const FEATURES = [
  {
    icon: MessagesSquare,
    title: 'Chat with any PDF',
    description:
      'Ask questions in plain English and get streamed answers grounded in the document — powered by vector search (RAG) and Gemini.',
  },
  {
    icon: WandSparkles,
    title: 'One-click AI summaries',
    description:
      'Turn a 50-page PDF into structured, study-ready notes — summary, key points, and takeaways — in seconds.',
  },
  {
    icon: NotebookPen,
    title: 'Smart notes editor',
    description:
      'A rich text editor with autosave. Select any question in your notes and let AI answer it from the PDF, inline.',
  },
  {
    icon: FileDown,
    title: 'Export to Word',
    description:
      'Take your notes with you — download everything as a formatted .docx file with a single click.',
  },
];

const STEPS = [
  {
    icon: CloudUpload,
    step: '01',
    title: 'Upload your PDF',
    description: 'Drop in lecture slides, research papers, contracts, manuals — anything.',
  },
  {
    icon: ScanSearch,
    step: '02',
    title: 'AI indexes it',
    description: 'The text is extracted, chunked and embedded into a vector database.',
  },
  {
    icon: BotMessageSquare,
    step: '03',
    title: 'Chat & take notes',
    description: 'Ask questions, generate summaries, and build notes side-by-side with the PDF.',
  },
];

function Hero() {
  return (
    <div className="relative overflow-hidden">
      {/* Background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute -top-32 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-500/25 via-violet-500/20 to-sky-400/25 blur-3xl" />
        <div className="absolute top-64 -left-24 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute top-96 -right-24 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-5 pt-20 pb-16 text-center md:pt-28">
        <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          Powered by Gemini + RAG vector search
        </div>

        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold tracking-tight text-balance md:text-6xl">
          Stop reading PDFs.
          <br />
          Start <span className="gradient-text">talking to them.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground md:text-lg">
          Papermind AI turns any PDF into a conversation. Ask questions, generate
          summaries, and take rich notes — all in one split-screen workspace.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link href="/dashboard">
            <Button variant="gradient" size="lg" className="h-11 px-7 text-base">
              Get started free <MoveRight className="h-4 w-4" />
            </Button>
          </Link>
          <a href="#how-it-works">
            <Button variant="outline" size="lg" className="h-11 px-7 text-base">
              See how it works
            </Button>
          </a>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Free plan includes 5 PDFs — no credit card required
        </p>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-16">
        <h2 className="text-center text-3xl font-bold tracking-tight">
          Everything you need to <span className="gradient-text">master any document</span>
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
          Built for students, researchers, and professionals who live in PDFs.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border bg-card p-6 shadow-xs transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25 transition-transform group-hover:scale-110">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-20 border-y bg-muted/40 py-16">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="text-center text-3xl font-bold tracking-tight">
            From PDF to insights in <span className="gradient-text">three steps</span>
          </h2>

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            {STEPS.map((item) => (
              <div key={item.step} className="relative text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border bg-background shadow-sm">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <p className="mt-4 text-xs font-bold tracking-widest text-primary">
                  STEP {item.step}
                </p>
                <h3 className="mt-1 font-semibold">{item.title}</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-500 px-6 py-14 text-center text-white shadow-xl shadow-indigo-500/25">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Your PDFs have answers. Ask them.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-white/85">
            Join and upload your first document — chatting with it takes less
            than a minute.
          </p>
          <Link href="/dashboard" className="mt-8 inline-block">
            <Button
              size="lg"
              className="h-11 border-0 bg-white px-7 text-base font-semibold text-indigo-700 shadow-lg hover:bg-white/90"
            >
              Try Papermind AI free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 text-sm text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} Papermind AI</p>
          <p className="text-xs">
            Next.js · Convex · Clerk · Gemini · LangChain · Razorpay
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Hero;
