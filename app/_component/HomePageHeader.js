"use client"
import React from 'react';

import Link from 'next/link';

import Logo from '@/components/Logo';
import ModeToggle from '@/components/ModeToggle';
import { Button } from '@/components/ui/button';
import {
  Show,
  UserButton,
} from '@clerk/nextjs';

function HomePageHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Logo />

        <div className="hidden items-center gap-1 md:flex">
          <a
            href="#features"
            className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            How it works
          </a>
          <Link
            href="/dashboard/upgrade"
            className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Pricing
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <ModeToggle />
          <Show when="signed-out">
            <Link href="/sign-in">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="sm">Get started</Button>
            </Link>
          </Show>
          <Show when="signed-in">
            <Link href="/dashboard">
              <Button size="sm">Open dashboard</Button>
            </Link>
            <UserButton />
          </Show>
        </div>
      </nav>
    </header>
  );
}

export default HomePageHeader;
