import React from 'react';

import { FileText, Sparkles } from 'lucide-react';
import Link from 'next/link';

import { cn } from '@/lib/utils';

/**
 * App brand mark. `size` = 'sm' | 'md'
 */
function Logo({ size = 'md', href = '/', className }) {
  const iconBox = size === 'sm' ? 'h-7 w-7 rounded-lg' : 'h-9 w-9 rounded-xl';
  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  const text = size === 'sm' ? 'text-base' : 'text-lg';

  return (
    <Link
      href={href}
      className={cn('flex items-center gap-2 select-none', className)}
    >
      <div
        className={cn(
          'relative flex items-center justify-center bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-400 text-white shadow-md shadow-indigo-500/30',
          iconBox
        )}
      >
        <FileText className={iconSize} strokeWidth={2.2} />
        <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-amber-300 fill-amber-300" />
      </div>
      <span className={cn('font-bold tracking-tight', text)}>
        Papermind
        <span className="gradient-text"> AI</span>
      </span>
    </Link>
  );
}

export default Logo;
