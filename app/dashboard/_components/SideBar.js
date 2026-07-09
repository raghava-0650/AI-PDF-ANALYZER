"use client"
import React from 'react';

import { useQuery } from 'convex/react';
import {
  Crown,
  LayoutGrid,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { api } from '@/convex/_generated/api';
import { useUser } from '@clerk/nextjs';

import UploadPdfDialog from './UploadPdfDialog';

function NavItem({ href, active, icon: Icon, children }) {
  return (
    <Link href={href}>
      <div
        className={`mt-1 flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
          active
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        }`}
      >
        <Icon className="h-4 w-4" />
        {children}
      </div>
    </Link>
  );
}

function SideBar() {
  const { user } = useUser();
  const path = usePathname();
  const email = user?.primaryEmailAddress?.emailAddress;

  const userInfo = useQuery(api.user.GetUserInfo, { userEmail: email });
  const fileList = useQuery(api.fileStorage.GetUserFiles, { userEmail: email });

  const fileCount = fileList?.length ?? 0;
  const isMaxFile = fileCount >= 5 && !userInfo?.upgrade;

  return (
    <div className="flex h-screen flex-col border-r bg-sidebar p-5">
      <Logo />

      <div className="mt-8">
        <UploadPdfDialog isMaxFile={isMaxFile} />

        <nav className="mt-6">
          <p className="px-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Menu
          </p>
          <div className="mt-2">
            <NavItem href="/dashboard" active={path === '/dashboard'} icon={LayoutGrid}>
              Workspace
            </NavItem>
            <NavItem
              href="/dashboard/upgrade"
              active={path === '/dashboard/upgrade'}
              icon={Crown}
            >
              Upgrade
            </NavItem>
          </div>
        </nav>
      </div>

      <div className="mt-auto">
        {userInfo?.upgrade ? (
          <div className="rounded-2xl border bg-gradient-to-br from-indigo-500/10 to-violet-500/10 p-4">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-500" />
              <p className="text-sm font-semibold">Unlimited plan</p>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Upload as many PDFs as you like. Happy studying!
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border bg-card p-4 shadow-xs">
            <Progress value={Math.min((fileCount / 5) * 100, 100)} />
            <p className="mt-2 text-sm font-medium">
              {fileCount} of 5 PDFs used
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Upgrade for unlimited uploads
            </p>
            <Link href="/dashboard/upgrade" className="mt-3 block">
              <Button variant="gradient" size="sm" className="w-full">
                <Zap className="h-3.5 w-3.5" /> Upgrade
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default SideBar;
