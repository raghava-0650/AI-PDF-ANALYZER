import { NextResponse } from 'next/server';

import { PDFParse } from 'pdf-parse';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_CHUNKS = 400;

/**
 * Loads a PDF from Convex storage, extracts its text and splits it
 * into overlapping chunks sized for embedding + retrieval.
 *
 * NOTE: parsing is done with pdf-parse v2's `PDFParse` class directly.
 * We intentionally do NOT use LangChain's PDFLoader here — that loader
 * dynamically imports pdf-parse's v1-only internal build
 * (`pdf-parse/lib/pdf.js/v1.10.100/build/pdf.js`), which does not exist
 * in pdf-parse v2 and throws "Failed to load pdf-parse" (HTTP 500).
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const pdfUrl = searchParams.get('pdfUrl');

    if (!pdfUrl) {
      return NextResponse.json({ error: 'pdfUrl is required' }, { status: 400 });
    }

    // Only fetch from our own Convex storage
    const allowedHost = process.env.NEXT_PUBLIC_CONVEX_URL?.replace(
      'https://',
      ''
    );
    const urlHost = new URL(pdfUrl).host;
    if (allowedHost && urlHost !== allowedHost) {
      return NextResponse.json({ error: 'Invalid file URL' }, { status: 400 });
    }

    // 1. Fetch the PDF bytes from Convex storage
    const response = await fetch(pdfUrl);
    if (!response.ok) {
      return NextResponse.json(
        { error: `Could not fetch PDF (${response.status})` },
        { status: 502 }
      );
    }
    const buffer = Buffer.from(await response.arrayBuffer());

    // 2. Extract text with pdf-parse v2
    const parser = new PDFParse({ data: buffer });
    let parsed;
    try {
      parsed = await parser.getText();
    } finally {
      await parser.destroy();
    }

    // Join per-page text (avoids pdf-parse's default "-- page x of y --" markers)
    const pdfTextContent = parsed.pages
      .map((page) => page.text)
      .join(' ')
      .trim();

    if (!pdfTextContent) {
      return NextResponse.json(
        { error: 'No extractable text found — this PDF may be scanned images.' },
        { status: 422 }
      );
    }

    // 3. Split into chunks sized for good retrieval quality
    // (100-char chunks destroy context; ~1200 with overlap works well)
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1200,
      chunkOverlap: 200,
    });
    const output = await splitter.createDocuments([pdfTextContent]);

    const splitterList = output
      .slice(0, MAX_CHUNKS)
      .map((doc) => doc.pageContent);

    return NextResponse.json({
      result: splitterList,
      pages: parsed.total,
      chunks: splitterList.length,
    });
  } catch (error) {
    console.error('/api/pdf-loader error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process PDF' },
      { status: 500 }
    );
  }
}
