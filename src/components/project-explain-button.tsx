'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useLocale } from '@/contexts/locale';

type Project = { name: string; desc: string; points?: string[] };

export function ProjectExplainButton({ project }: { project: Project }) {
  const { locale, t } = useLocale();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamBufferRef = useRef('');
  const typewriterRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endedRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    setContent('');
    setError(null);
    setLoading(true);
    streamBufferRef.current = '';
    endedRef.current = false;

    (async () => {
      try {
        const res = await fetch('/api/explain-project', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectName: project.name,
            projectDesc: project.desc,
            points: project.points,
            locale,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? res.statusText);
        }
        const reader = res.body?.getReader();
        if (!reader) throw new Error('No body');
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try {
              const obj = JSON.parse(trimmed) as { content?: string; error?: string };
              if (obj.error) throw new Error(obj.error);
              if (obj.content) streamBufferRef.current += obj.content;
            } catch (_) {}
          }
        }
        endedRef.current = true;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Request failed');
      } finally {
        setLoading(false);
      }
    })();
  }, [open, project.name, project.desc, project.points, locale]);

  useEffect(() => {
    if (!open || loading) return;
    const TICK = 20;
    const CHARS = 2;
    typewriterRef.current = setInterval(() => {
      const buf = streamBufferRef.current;
      if (buf.length === 0) {
        if (endedRef.current && typewriterRef.current) {
          clearInterval(typewriterRef.current);
          typewriterRef.current = null;
        }
        return;
      }
      const take = Math.min(CHARS, buf.length);
      streamBufferRef.current = buf.slice(take);
      setContent((prev) => prev + buf.slice(0, take));
    }, TICK);
    return () => {
      if (typewriterRef.current) {
        clearInterval(typewriterRef.current);
        typewriterRef.current = null;
      }
    };
  }, [open, loading]);

  const btnLabel = locale === 'zh' ? t('projectExplainer.btn') : t('projectExplainer.btnEn');

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1.5 border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10"
      >
        <Sparkles className="h-3.5 w-3.5" />
        {btnLabel}
      </Button>
      <Dialog open={open} onOpenChange={setOpen} title={t('projectExplainer.title')}>
        <div className="space-y-3">
          {loading && !content && (
            <p className="text-slate-400 text-sm">{t('projectExplainer.loading')}</p>
          )}
          {error && (
            <p className="text-red-400 text-sm">{t('projectExplainer.error')}: {error}</p>
          )}
          {content && (
            <div
              className={cn(
                'text-slate-300 text-sm leading-relaxed whitespace-pre-wrap prose prose-invert prose-sm max-w-none',
                'prose-p:my-2 prose-ul:my-2 prose-li:my-0.5'
              )}
            >
              {content}
              {loading && (
                <span className="inline-block w-2 h-4 bg-cyan-400/80 animate-pulse ml-0.5 align-middle" />
              )}
            </div>
          )}
        </div>
      </Dialog>
    </>
  );
}
