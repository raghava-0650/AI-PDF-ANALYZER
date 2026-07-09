"use client"
import React, { useMemo, useState } from 'react';

import {
  ConvexProvider,
  ConvexReactClient,
} from 'convex/react';
import { ThemeProvider } from 'next-themes';

import { FileSaveContext } from './_context/FileSaveContext';

function Provider({ children }) {
  // Memoize so the client (and its websocket) isn't recreated on every render
  const convex = useMemo(
    () => new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL),
    []
  );

  const [fileSave, setFileSave] = useState(0);
  const [saveStatus, setSaveStatus] = useState('idle');

  return (
    <ConvexProvider client={convex}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <FileSaveContext.Provider
          value={{ fileSave, setFileSave, saveStatus, setSaveStatus }}
        >
          {children}
        </FileSaveContext.Provider>
      </ThemeProvider>
    </ConvexProvider>
  );
}

export default Provider;
