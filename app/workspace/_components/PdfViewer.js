"use client"
import React, { useState } from 'react';

import { LoaderCircle } from 'lucide-react';

function PdfViewer({ fileUrl }) {
  const [loaded, setLoaded] = useState(false);

  if (!fileUrl) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoaderCircle className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="relative h-full bg-muted/40">
      {!loaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <LoaderCircle className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading PDF…</p>
        </div>
      )}
      <iframe
        src={fileUrl + '#toolbar=0&navpanes=0'}
        title="PDF preview"
        onLoad={() => setLoaded(true)}
        className="h-full w-full border-0"
      />
    </div>
  );
}

export default PdfViewer;
