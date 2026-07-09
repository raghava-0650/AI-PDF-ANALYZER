import './globals.css';

import { Outfit } from 'next/font/google';

import { Toaster } from '@/components/ui/sonner';
import { ClerkProvider } from '@clerk/nextjs';

import Provider from './provider';

export const metadata = {
  title: 'Papermind AI — Chat with your PDFs & take smart notes',
  description:
    'Upload any PDF, chat with it using AI (RAG + Gemini), generate summaries, and take rich notes side-by-side. Built with Next.js, Convex, Clerk and LangChain.',
};

const outfit = Outfit({ subsets: ['latin'] });

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={outfit.className}>
          <Provider>{children}</Provider>
          <Toaster position="bottom-right" richColors closeButton />
        </body>
      </html>
    </ClerkProvider>
  );
}
