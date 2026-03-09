'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bot, Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useLocale } from '@/contexts/locale';

type Message = { role: 'user' | 'assistant'; content: string };

export default function AskAIPage() {
  const { locale, t } = useLocale();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const streamBufferRef = useRef('');
  const streamEndedRef = useRef(false);
  const typewriterIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: streaming ? 'auto' : 'smooth' });
  }, [messages, streaming]);

  const startTypewriter = () => {
    const TYPEWRITER_MS = 24;
    const CHARS_PER_TICK = 2;
    typewriterIntervalRef.current = setInterval(() => {
      const buf = streamBufferRef.current;
      if (buf.length === 0) {
        if (streamEndedRef.current) {
          if (typewriterIntervalRef.current) {
            clearInterval(typewriterIntervalRef.current);
            typewriterIntervalRef.current = null;
          }
          setStreaming(false);
        }
        return;
      }
      const take = Math.min(CHARS_PER_TICK, buf.length);
      const toShow = buf.slice(0, take);
      streamBufferRef.current = buf.slice(take);
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last?.role === 'assistant') {
          next[next.length - 1] = { ...last, content: last.content + toShow };
        }
        return next;
      });
    }, TYPEWRITER_MS);
  };

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
          locale,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `${t('askAi.errorPrefix')}${data.error ?? res.statusText}` },
        ]);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setMessages((prev) => [...prev, { role: 'assistant', content: `${t('askAi.errorPrefix')}无响应体` }]);
        return;
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);
      setLoading(false);
      setStreaming(true);
      streamBufferRef.current = '';
      streamEndedRef.current = false;
      startTypewriter();

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
            if (obj.error) {
              if (typewriterIntervalRef.current) {
                clearInterval(typewriterIntervalRef.current);
                typewriterIntervalRef.current = null;
              }
              setMessages((prev) => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last?.role === 'assistant') {
                  next[next.length - 1] = { ...last, content: `${t('askAi.errorPrefix')}${obj.error}` };
                }
                return next;
              });
              setStreaming(false);
              return;
            }
            if (obj.content) {
              streamBufferRef.current += obj.content;
            }
          } catch {
            // ignore parse errors for partial lines
          }
        }
      }
      streamEndedRef.current = true;
      if (streamBufferRef.current.length === 0) {
        if (typewriterIntervalRef.current) {
          clearInterval(typewriterIntervalRef.current);
          typewriterIntervalRef.current = null;
        }
        setStreaming(false);
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `${t('askAi.errorPrefix')}${e instanceof Error ? e.message : 'Unknown error'}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 px-4 py-2 text-cyan-400 text-sm mb-4">
          <Sparkles className="h-4 w-4" />
          {t('askAi.badge')}
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{t('askAi.title')}</h1>
        <p className="text-slate-400 text-sm">
          {t('askAi.subtitle')}
        </p>
      </motion.div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-slate-700/50 py-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bot className="h-5 w-5 text-cyan-400" />
            {t('askAi.assistantTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div
            ref={listRef}
            className="chat-list-scrollbar h-[400px] overflow-y-auto overflow-x-hidden p-4 space-y-4"
          >
            {messages.length === 0 && (
              <div className="text-center text-slate-500 text-sm py-8">
                {t('askAi.emptyHint')}
              </div>
            )}
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  'flex',
                  m.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[85%] rounded-lg px-4 py-2 text-sm',
                    m.role === 'user'
                      ? 'bg-cyan-500/20 text-cyan-100 border border-cyan-500/30'
                      : 'bg-slate-700/50 text-slate-200 border border-slate-600/50'
                  )}
                >
                  <div className="whitespace-pre-wrap">
                    {m.content}
                    {m.role === 'assistant' && streaming && i === messages.length - 1 && (
                      <span className="inline-block w-2 h-4 bg-cyan-400/80 animate-pulse ml-0.5 align-middle" />
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
            {loading && !streaming && (
              <div className="flex justify-start">
                <div className="rounded-lg px-4 py-2 bg-slate-700/50 border border-slate-600/50 text-slate-400 text-sm">
                  {t('askAi.thinking')}
                </div>
              </div>
            )}
          </div>
          <div className="p-4 border-t border-slate-700/50 flex gap-2">
            <Input
              placeholder={t('askAi.placeholder')}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              disabled={loading}
              className="flex-1"
            />
            <Button onClick={handleSend} disabled={loading}>
              <Send className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">{t('askAi.send')}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-slate-500 text-center mt-4">
        {t('askAi.footer')}
      </p>
    </div>
  );
}
