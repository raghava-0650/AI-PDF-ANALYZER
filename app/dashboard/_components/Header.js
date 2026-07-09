"use client"
import React from 'react';

import Logo from '@/components/Logo';
import ModeToggle from '@/components/ModeToggle';
import { UserButton } from '@clerk/nextjs';

function Header() {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-background/95 px-5 backdrop-blur supports-[backdrop-filter]:bg-background/75 md:justify-end">
      {/* Brand shows on mobile where the sidebar is hidden */}
      <div className="md:hidden">
        <Logo size="sm" href="/dashboard" />
      </div>
      <div className="flex items-center gap-2">
        <ModeToggle />
        <UserButton />
      </div>
    </header>
  );
}

export default Header;
