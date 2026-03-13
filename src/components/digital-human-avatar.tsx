'use client';

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X } from 'lucide-react';
import { useLocale } from '@/contexts/locale';
import { cn } from '@/lib/utils';

const DigitalHumanCanvas = dynamic(() => import('@/components/digital-human-canvas'), { ssr: false });

type ChatMessage = { role: 'user' | 'assistant'; content: string };

/** 语音识别结果事件（无全局类型时使用） */
type SpeechRecognitionResultEvent = {
  results: Iterable<{ item(i: number): { transcript: string } }>;
};

/** 语音识别实例类型（Web Speech API 在部分 tsconfig 下无全局类型） */
type SpeechRecognitionInstance = {
  start(): void;
  stop(): void;
  abort(): void;
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

const TYPEWRITER_MS = 24;
const CHARS_PER_TICK = 2;

export function DigitalHumanAvatar() {
  const { t, locale } = useLocale();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const streamBufferRef = useRef('');
  const streamEndedRef = useRef(false);
  const typewriterRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [isListening, setIsListening] = useState(false);
  const [isTtsSpeaking, setIsTtsSpeaking] = useState(false);
  const [voiceUnsupported, setVoiceUnsupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const lastSpokenContentRef = useRef('');
  const messagesRef = useRef<ChatMessage[]>([]);
  const handleSendRef = useRef<(text?: string) => void>(() => {});

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  useEffect(() => {
    handleSendRef.current = handleSend;
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (open) {
      closeButtonRef.current?.focus();
    } else {
      triggerRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const tid = window.setTimeout(() => {
      const rec = recognitionRef.current;
      if (!rec || voiceUnsupported) return;
      try {
        rec.lang = locale === 'zh' ? 'zh-CN' : 'en-US';
        rec.start();
        setIsListening(true);
      } catch {
        setVoiceUnsupported(true);
      }
    }, 500);
    return () => window.clearTimeout(tid);
  }, [open, locale, voiceUnsupported]);

  useEffect(() => {
    if (!open) {
      if (typewriterRef.current) {
        clearInterval(typewriterRef.current);
        typewriterRef.current = null;
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        setIsTtsSpeaking(false);
      }
    }
    return () => {
      if (typewriterRef.current) {
        clearInterval(typewriterRef.current);
        typewriterRef.current = null;
      }
    };
  }, [open]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const Win = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionInstance;
      webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
    };
    const SR = Win.SpeechRecognition || Win.webkitSpeechRecognition;
    if (!SR) {
      setVoiceUnsupported(true);
      return;
    }
    recognitionRef.current = new SR() as SpeechRecognitionInstance;
    const rec = recognitionRef.current;
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = locale === 'zh' ? 'zh-CN' : 'en-US';
    rec.onresult = (e: SpeechRecognitionResultEvent) => {
      const transcript = Array.from(e.results)
        .map((r) => r.item(0).transcript)
        .join(' ')
        .trim();
      if (transcript) handleSendRef.current(transcript);
    };
    rec.onend = () => setIsListening(false);
    rec.onerror = () => setIsListening(false);
    return () => {
      try {
        rec.abort();
      } catch {
        // ignore
      }
    };
  }, [locale]);

  useEffect(() => {
    if (streaming || messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last?.role !== 'assistant' || !last.content || last.content === lastSpokenContentRef.current) return;
    lastSpokenContentRef.current = last.content;
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(last.content);
      u.lang = locale === 'zh' ? 'zh-CN' : 'en-US';
      u.rate = 0.95;
      u.onstart = () => setIsTtsSpeaking(true);
      u.onend = () => setIsTtsSpeaking(false);
      u.onerror = () => setIsTtsSpeaking(false);
      window.speechSynthesis.speak(u);
    }
  }, [messages, streaming]);

  const startTypewriter = () => {
    typewriterRef.current = setInterval(() => {
      const buf = streamBufferRef.current;
      if (buf.length === 0) {
        if (streamEndedRef.current && typewriterRef.current) {
          clearInterval(typewriterRef.current);
          typewriterRef.current = null;
        }
        setStreaming(false);
        return;
      }
      const take = Math.min(CHARS_PER_TICK, buf.length);
      streamBufferRef.current = buf.slice(take);
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last?.role === 'assistant') {
          next[next.length - 1] = { ...last, content: last.content + buf.slice(0, take) };
        }
        return next;
      });
    }, TYPEWRITER_MS);
  };

  async function handleSend(overrideText?: string) {
    const text = (overrideText ?? '').trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const listToSend = [...messagesRef.current, userMsg];
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: listToSend.map((m) => ({ role: m.role, content: m.content })),
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
              if (typewriterRef.current) {
                clearInterval(typewriterRef.current);
                typewriterRef.current = null;
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
            if (obj.content) streamBufferRef.current += obj.content;
          } catch {
            // ignore
          }
        }
      }
      streamEndedRef.current = true;
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `${t('askAi.errorPrefix')}${e instanceof Error ? e.message : 'Request failed'}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <motion.button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full',
          'bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 shadow-lg shadow-cyan-500/10',
          'px-4 py-3 hover:bg-cyan-500/25 hover:border-cyan-500/60 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-cyan-500/50'
        )}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8, duration: 0.3 }}
        aria-label={t('home.digitalHumanLabel')}
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/20">
          <Bot className="h-5 w-5 text-cyan-400" />
        </span>
        <span className="text-sm font-medium hidden sm:inline">{t('home.digitalHumanLabel')}</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 bg-slate-950"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className="absolute inset-0"
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <div className="absolute inset-0 pointer-events-none flex flex-col">
              <div className="absolute top-3 right-3 z-20 pointer-events-auto">
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  aria-label={t('digitalHuman.close')}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 min-h-0 pointer-events-none">
                <div className="absolute inset-0 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                  <DigitalHumanCanvas
                    isListening={isListening}
                    isSpeaking={isTtsSpeaking}
                    loadingLabel={t('digitalHuman.loadingAvatar')}
                    fullScreen
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
