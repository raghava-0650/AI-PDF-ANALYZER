"use client"
import React, { useContext } from 'react';

import {
  Check,
  ChevronLeft,
  FileText,
  LoaderCircle,
  Save,
} from 'lucide-react';
import Link from 'next/link';

import { FileSaveContext } from '@/app/_context/FileSaveContext';
import Logo from '@/components/Logo';
import ModeToggle from '@/components/ModeToggle';
import { Button } from '@/components/ui/button';
import { UserButton } from '@clerk/nextjs';

function SaveIndicator({ status }) {
  if (status === 'saving') {
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <LoaderCircle className="h-3 w-3 animate-spin" /> Saving…
      </span>
    );
  }
  if (status === 'saved') {
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Check className="h-3 w-3 text-green-500" /> Saved
      </span>
    );
  }
  return null;
}

function WorkspaceHeader({ fileName }) {
  const { setFileSave, saveStatus } = useContext(FileSaveContext);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b bg-background px-4">
      <div className="flex min-w-0 items-center gap-2">
        <Link
          href="/dashboard"
          title="Back to dashboard"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <Logo size="sm" href="/dashboard" className="hidden sm:flex" />
        <div className="mx-2 hidden h-5 w-px bg-border sm:block" />
        <div className="flex min-w-0 items-center gap-1.5">
          <FileText className="h-4 w-4 shrink-0 text-primary" />
          <h2 className="truncate text-sm font-semibold">{fileName ?? 'Loading…'}</h2>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <SaveIndicator status={saveStatus} />
        <Button size="sm" variant="outline" onClick={() => setFileSave(Date.now())}>
          <Save className="h-3.5 w-3.5" /> Save
        </Button>
        <ModeToggle />
        <UserButton />
      </div>
    </header>
  );
}

export default WorkspaceHeader;
