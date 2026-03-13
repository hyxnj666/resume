'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  /** Class for the scrollable content area (e.g. scrollbar styling) */
  contentClassName?: string;
  /** e.g. { 'data-dialog': 'project-explainer' } to target this dialog's content in CSS */
  dataAttributes?: Record<string, string>;
}

export function Dialog({ open, onOpenChange, title, children, className, contentClassName, dataAttributes }: DialogProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-hidden
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal
        aria-labelledby={title ? 'dialog-title' : undefined}
        className={cn(
          'relative z-10 w-full max-w-lg max-h-[85vh] flex flex-col rounded-xl border border-slate-600 bg-slate-900 shadow-xl',
          className
        )}
        {...(dataAttributes ?? {})}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
            <h2 id="dialog-title" className="text-base font-semibold text-white">
              {title}
            </h2>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-white"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className={cn('dialog-content overflow-y-auto flex-1 p-4', contentClassName)}>{children}</div>
      </div>
    </div>
  );
}
