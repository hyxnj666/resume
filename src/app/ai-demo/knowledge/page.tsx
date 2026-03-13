'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Database, ExternalLink, Library, RefreshCcw, Search, Send, Sparkles, ThumbsDown, ThumbsUp } from 'lucide-react';
import { buttonVariants, Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useLocale } from '@/contexts/locale';
import { getKnowledgeBase, getKnowledgeBaseStats } from '@/data/knowledge-demo';

type RetrievedSource = {
  id: string;
  title: string;
  category: string;
  summary: string;
  content: string;
  tags: string[];
  updatedAt: string;
  score: number;
  snippets: string[];
};

type RetrievalTrace = {
  originalQuery: string;
  rewrittenQuery: string;
  keywords: string[];
  retrievedCount: number;
  recallCount?: number;
  strategy: string[];
  notes: string[];
  topSources: Array<{
    label: string;
    id: string;
    title: string;
    score: number;
  }>;
  config?: {
    topK: number;
    rewriteEnabled: boolean;
    rerankEnabled: boolean;
    groundedMode: boolean;
  };
  stages?: Array<{
    id: 'rewrite' | 'recall' | 'rerank' | 'answer';
    title: string;
    summary: string;
    items: string[];
  }>;
};

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: RetrievedSource[];
  query?: string;
  trace?: RetrievalTrace;
  feedback?: 'up' | 'down' | null;
};

type StreamEvent =
  | { type: 'trace'; trace: RetrievalTrace }
  | { type: 'sources'; query: string; sources: RetrievedSource[] }
  | { type: 'answer_chunk'; content: string }
  | { type: 'done' }
  | { type: 'error'; error: string };

type RAGPreset = {
  id: 'balanced' | 'accurate' | 'fast' | 'flexible';
  config: {
    topK: number;
    rewriteEnabled: boolean;
    rerankEnabled: boolean;
    groundedMode: boolean;
  };
};

function getCitationIndex(part: string) {
  const match = part.match(/\[S(\d+)\]/);
  if (!match) return null;
  const index = Number(match[1]) - 1;
  return Number.isNaN(index) ? null : index;
}

function renderAnswerWithCitations(
  content: string,
  sources: RetrievedSource[] | undefined,
  onCitationClick: (source: RetrievedSource) => void,
  onCitationHover?: (source: RetrievedSource | null) => void
) {
  const parts = content.split(/(\[S\d+\])/g);
  return parts.map((part, index) =>
    /\[S\d+\]/.test(part) ? (() => {
      const citationIndex = getCitationIndex(part);
      const source = typeof citationIndex === 'number' ? sources?.[citationIndex] : null;

      return (
        <button
          key={`${part}-${index}`}
          type="button"
          disabled={!source}
          onClick={() => {
            if (source) onCitationClick(source);
          }}
          onMouseEnter={() => onCitationHover?.(source ?? null)}
          onMouseLeave={() => onCitationHover?.(null)}
          className={cn(
            'mx-0.5 inline-flex rounded-md border px-1.5 py-0.5 text-[11px] font-medium transition-colors',
            source
              ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:border-cyan-400/50 hover:bg-cyan-500/15'
              : 'border-slate-700 bg-slate-900/70 text-slate-500'
          )}
        >
          {part}
        </button>
      );
    })() : (
      <span key={`${part}-${index}`}>{part}</span>
    )
  );
}

export default function KnowledgeChatPage() {
  const { locale, t } = useLocale();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [sourcePanelQuery, setSourcePanelQuery] = useState('');
  const [sourcePanelSources, setSourcePanelSources] = useState<RetrievedSource[]>([]);
  const [activeSourceId, setActiveSourceId] = useState<string | null>(null);
  const [sourceCategoryFilter, setSourceCategoryFilter] = useState('all');
  const [sourceTagFilter, setSourceTagFilter] = useState('all');
  const [sourceKeywordFilter, setSourceKeywordFilter] = useState('');
  const [highlightedSourceId, setHighlightedSourceId] = useState<string | null>(null);
  const [hoveredCitation, setHoveredCitation] = useState<{ messageId: string; source: RetrievedSource } | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryKeyword, setLibraryKeyword] = useState('');
  const [libraryCategory, setLibraryCategory] = useState('all');
  const [selectedLibraryDocId, setSelectedLibraryDocId] = useState<string | null>(null);
  const [currentTrace, setCurrentTrace] = useState<RetrievalTrace | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ragConfig, setRagConfig] = useState({
    topK: 4,
    rewriteEnabled: true,
    rerankEnabled: true,
    groundedMode: true,
  });
  const presets: RAGPreset[] = useMemo(
    () => [
      {
        id: 'balanced',
        config: { topK: 4, rewriteEnabled: true, rerankEnabled: true, groundedMode: true },
      },
      {
        id: 'accurate',
        config: { topK: 6, rewriteEnabled: true, rerankEnabled: true, groundedMode: true },
      },
      {
        id: 'fast',
        config: { topK: 3, rewriteEnabled: false, rerankEnabled: false, groundedMode: true },
      },
      {
        id: 'flexible',
        config: { topK: 4, rewriteEnabled: true, rerankEnabled: true, groundedMode: false },
      },
    ],
    []
  );

  const listRef = useRef<HTMLDivElement>(null);
  const sourceDetailRef = useRef<HTMLDivElement>(null);
  const sourceCardRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const stickToBottomRef = useRef(true);
  const streamBufferRef = useRef('');
  const streamEndedRef = useRef(false);
  const typewriterIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const examples = useMemo(
    () => [
      t('aiDemo.knowledgeExample1'),
      t('aiDemo.knowledgeExample2'),
      t('aiDemo.knowledgeExample3'),
    ],
    [t]
  );
  const stats = useMemo(() => getKnowledgeBaseStats(locale), [locale]);
  const knowledgeDocs = useMemo(() => getKnowledgeBase(locale), [locale]);
  const sourceCategories = useMemo(
    () => Array.from(new Set(sourcePanelSources.map((item) => item.category))),
    [sourcePanelSources]
  );
  const sourceTags = useMemo(
    () => Array.from(new Set(sourcePanelSources.flatMap((item) => item.tags))),
    [sourcePanelSources]
  );
  const libraryCategories = useMemo(
    () => Array.from(new Set(knowledgeDocs.map((item) => item.category))),
    [knowledgeDocs]
  );
  const filteredSources = useMemo(() => {
    const keyword = sourceKeywordFilter.trim().toLowerCase();

    return sourcePanelSources.filter((source) => {
      const matchesCategory = sourceCategoryFilter === 'all' || source.category === sourceCategoryFilter;
      const matchesTag = sourceTagFilter === 'all' || source.tags.includes(sourceTagFilter);
      const matchesKeyword =
        !keyword ||
        `${source.title} ${source.summary} ${source.category} ${source.tags.join(' ')} ${source.content}`.toLowerCase().includes(keyword);

      return matchesCategory && matchesTag && matchesKeyword;
    });
  }, [sourceCategoryFilter, sourceKeywordFilter, sourcePanelSources, sourceTagFilter]);
  const filteredLibraryDocs = useMemo(() => {
    const keyword = libraryKeyword.trim().toLowerCase();
    return knowledgeDocs.filter((doc) => {
      const matchesCategory = libraryCategory === 'all' || doc.category === libraryCategory;
      const matchesKeyword =
        !keyword ||
        `${doc.title} ${doc.summary} ${doc.content} ${doc.category} ${doc.tags.join(' ')}`.toLowerCase().includes(keyword);
      return matchesCategory && matchesKeyword;
    });
  }, [knowledgeDocs, libraryCategory, libraryKeyword]);
  const activeSource = filteredSources.find((item) => item.id === activeSourceId) ?? filteredSources[0] ?? null;
  const selectedLibraryDoc =
    filteredLibraryDocs.find((doc) => doc.id === selectedLibraryDocId) ?? filteredLibraryDocs[0] ?? null;
  const feedbackStats = useMemo(() => {
    const assistantMessages = messages.filter((message) => message.role === 'assistant');
    const helpful = assistantMessages.filter((message) => message.feedback === 'up').length;
    const needsWork = assistantMessages.filter((message) => message.feedback === 'down').length;
    const totalFeedback = helpful + needsWork;
    const recent = [...assistantMessages]
      .reverse()
      .filter((message) => message.feedback)
      .slice(0, 6);

    return {
      assistantCount: assistantMessages.length,
      helpful,
      needsWork,
      totalFeedback,
      helpfulRate: totalFeedback > 0 ? Math.round((helpful / totalFeedback) * 100) : 0,
      recent,
    };
  }, [messages]);
  const activePresetId = useMemo(() => {
    const matched = presets.find(
      (preset) =>
        preset.config.topK === ragConfig.topK &&
        preset.config.rewriteEnabled === ragConfig.rewriteEnabled &&
        preset.config.rerankEnabled === ragConfig.rerankEnabled &&
        preset.config.groundedMode === ragConfig.groundedMode
    );
    return matched?.id ?? null;
  }, [presets, ragConfig]);
  const comparisonRuns = useMemo(() => {
    return [...messages]
      .filter((message) => message.role === 'assistant' && message.trace)
      .reverse()
      .slice(0, 2);
  }, [messages]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (typewriterIntervalRef.current) {
        clearInterval(typewriterIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (sourceCategoryFilter !== 'all' && !sourceCategories.includes(sourceCategoryFilter)) {
      setSourceCategoryFilter('all');
    }
    if (sourceTagFilter !== 'all' && !sourceTags.includes(sourceTagFilter)) {
      setSourceTagFilter('all');
    }
  }, [sourceCategories, sourceCategoryFilter, sourceTagFilter, sourceTags]);

  useEffect(() => {
    if (!filteredSources.length) {
      setActiveSourceId(null);
      return;
    }

    if (!activeSourceId || !filteredSources.some((source) => source.id === activeSourceId)) {
      setActiveSourceId(filteredSources[0].id);
    }
  }, [activeSourceId, filteredSources]);

  useEffect(() => {
    if (!filteredLibraryDocs.length) {
      setSelectedLibraryDocId(null);
      return;
    }

    if (!selectedLibraryDocId || !filteredLibraryDocs.some((doc) => doc.id === selectedLibraryDocId)) {
      setSelectedLibraryDocId(filteredLibraryDocs[0].id);
    }
  }, [filteredLibraryDocs, selectedLibraryDocId]);

  useEffect(() => {
    const element = listRef.current;
    if (!element || !stickToBottomRef.current) return;
    element.scrollTo({ top: element.scrollHeight, behavior: streaming ? 'auto' : 'smooth' });
  }, [messages, streaming]);

  const handleListScroll = () => {
    const element = listRef.current;
    if (!element) return;
    const nearBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 40;
    stickToBottomRef.current = nearBottom;
  };

  const startTypewriter = () => {
    if (typewriterIntervalRef.current) {
      clearInterval(typewriterIntervalRef.current);
    }

    typewriterIntervalRef.current = setInterval(() => {
      const buffer = streamBufferRef.current;
      if (!buffer.length) {
        if (streamEndedRef.current) {
          if (typewriterIntervalRef.current) {
            clearInterval(typewriterIntervalRef.current);
            typewriterIntervalRef.current = null;
          }
          setStreaming(false);
        }
        return;
      }

      const take = Math.min(3, buffer.length);
      const content = buffer.slice(0, take);
      streamBufferRef.current = buffer.slice(take);

      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last?.role === 'assistant') {
          next[next.length - 1] = { ...last, content: last.content + content };
        }
        return next;
      });
    }, 22);
  };

  const clearConversation = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setMessages([]);
    setInput('');
    setError(null);
    setSourcePanelQuery('');
    setSourcePanelSources([]);
    setActiveSourceId(null);
    setSourceCategoryFilter('all');
    setSourceTagFilter('all');
    setSourceKeywordFilter('');
    setHighlightedSourceId(null);
    setHoveredCitation(null);
    setCurrentTrace(null);
    setStreaming(false);
    setLoading(false);
    streamBufferRef.current = '';
    streamEndedRef.current = false;
    if (typewriterIntervalRef.current) {
      clearInterval(typewriterIntervalRef.current);
      typewriterIntervalRef.current = null;
    }
  };

  const focusSource = (source: RetrievedSource, options?: { query?: string; sources?: RetrievedSource[]; resetFilters?: boolean }) => {
    if (options?.query) setSourcePanelQuery(options.query);
    if (options?.sources) setSourcePanelSources(options.sources);
    if (options?.resetFilters) {
      setSourceCategoryFilter('all');
      setSourceTagFilter('all');
      setSourceKeywordFilter('');
    }

    setActiveSourceId(source.id);
    setHighlightedSourceId(source.id);
    window.setTimeout(() => setHighlightedSourceId((current) => (current === source.id ? null : current)), 1800);

    window.requestAnimationFrame(() => {
      sourceCardRefs.current[source.id]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      sourceDetailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  };

  const setMessageFeedback = (messageId: string, feedback: 'up' | 'down') => {
    setMessages((prev) =>
      prev.map((message) =>
        message.id === messageId
          ? {
              ...message,
              feedback: message.feedback === feedback ? null : feedback,
            }
          : message
      )
    );
  };

  const openDocFromLibrary = (docId: string) => {
    const source = sourcePanelSources.find((item) => item.id === docId);
    if (source) {
      focusSource(source, { resetFilters: true });
    } else {
      const doc = knowledgeDocs.find((item) => item.id === docId);
      if (doc) {
        const librarySource: RetrievedSource = {
          ...doc,
          score: 0,
          snippets: doc.content.split(/\n{2,}/).slice(0, 2),
        };
        setSourcePanelQuery(t('aiDemo.knowledgeLibraryTitle'));
        setSourcePanelSources([librarySource]);
        focusSource(librarySource, { resetFilters: true });
      }
    }
    setLibraryOpen(false);
  };

  async function handleSend(overrideText?: string) {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;

    const userMessage: Message = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: text,
    };
    const assistantMessage: Message = {
      id: `${Date.now()}-assistant`,
      role: 'assistant',
      content: '',
      sources: [],
      query: text,
    };

    const nextMessages = [...messages, userMessage];
    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput('');
    setError(null);
    setLoading(true);
    setStreaming(true);
    stickToBottomRef.current = true;
    streamBufferRef.current = '';
    streamEndedRef.current = false;
    startTypewriter();

    try {
      const controller = new AbortController();
      abortRef.current = controller;
      const response = await fetch('/api/knowledge-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          messages: nextMessages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
          locale,
          config: ragConfig,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? response.statusText);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error(locale === 'en' ? 'No response body' : '无响应体');
      }

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

          const event = JSON.parse(trimmed) as StreamEvent;

          if (event.type === 'trace') {
            setCurrentTrace(event.trace);
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (last?.role === 'assistant') {
                next[next.length - 1] = {
                  ...last,
                  trace: event.trace,
                };
              }
              return next;
            });
          }

          if (event.type === 'sources') {
            setSourcePanelQuery(event.query);
            setSourcePanelSources(event.sources);
            setSourceCategoryFilter('all');
            setSourceTagFilter('all');
            setSourceKeywordFilter('');
            setActiveSourceId(event.sources[0]?.id ?? null);
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (last?.role === 'assistant') {
                next[next.length - 1] = {
                  ...last,
                  sources: event.sources,
                  query: event.query,
                };
              }
              return next;
            });
          }

          if (event.type === 'answer_chunk' && event.content) {
            streamBufferRef.current += event.content;
          }

          if (event.type === 'error') {
            throw new Error(event.error);
          }
        }
      }

      streamEndedRef.current = true;
      if (!streamBufferRef.current.length && typewriterIntervalRef.current) {
        clearInterval(typewriterIntervalRef.current);
        typewriterIntervalRef.current = null;
        setStreaming(false);
      }
    } catch (requestError) {
      if (requestError instanceof Error && requestError.name === 'AbortError') {
        return;
      }
      if (typewriterIntervalRef.current) {
        clearInterval(typewriterIntervalRef.current);
        typewriterIntervalRef.current = null;
      }
      setStreaming(false);
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last?.role === 'assistant') {
          next[next.length - 1] = {
            ...last,
            content: `${t('aiDemo.knowledgeErrorPrefix')}${requestError instanceof Error ? requestError.message : 'Unknown error'}`,
          };
        }
        return next;
      });
      setError(requestError instanceof Error ? requestError.message : 'Request failed');
    } finally {
      abortRef.current = null;
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <Link href="/ai-demo" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'mb-3 -ml-2')}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          {t('aiDemo.backToDemos')}
        </Link>
        <div className="ai-hero-panel p-5 sm:p-6">
          <div className="ai-pill-badge relative z-[1]">
            <Sparkles className="h-3.5 w-3.5" />
            {t('aiDemo.knowledgeBadge')}
          </div>
          <h1 className="relative z-[1] mt-4 flex items-center gap-2 text-2xl font-bold text-white md:text-3xl">
            <BookOpen className="h-8 w-8 text-cyan-400" />
            {t('aiDemo.knowledgePageTitle')}
          </h1>
          <p className="relative z-[1] mt-2 max-w-3xl text-sm leading-7 text-slate-300">{t('aiDemo.knowledgePageSubtitle')}</p>
          <div className="relative z-[1] mt-5 grid gap-3 md:grid-cols-3">
            <div className="ai-stat-card p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{t('aiDemo.knowledgeHeroStat1Label')}</p>
              <p className="mt-2 text-sm font-medium text-white">{t('aiDemo.knowledgeHeroStat1Value')}</p>
            </div>
            <div className="ai-stat-card p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{t('aiDemo.knowledgeHeroStat2Label')}</p>
              <p className="mt-2 text-sm font-medium text-white">{t('aiDemo.knowledgeHeroStat2Value')}</p>
            </div>
            <div className="ai-stat-card p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{t('aiDemo.knowledgeHeroStat3Label')}</p>
              <p className="mt-2 text-sm font-medium text-white">{t('aiDemo.knowledgeHeroStat3Value')}</p>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.18fr)_minmax(320px,0.82fr)]">
        <div className="min-w-0 space-y-4">
          <Card className="border-cyan-500/20">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-2">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{t('aiDemo.knowledgeHeroStat1Label')}</p>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Search className="h-5 w-5 text-cyan-400" />
                    {t('aiDemo.knowledgeChatTitle')}
                  </CardTitle>
                  <p className="text-sm text-slate-400">{t('aiDemo.knowledgeChatDesc')}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] text-emerald-300">
                    {t('aiDemo.knowledgeStrictMode')}
                  </span>
                  <button
                    type="button"
                    onClick={clearConversation}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-900/70 px-2.5 py-1.5 text-xs text-slate-300 transition-colors hover:border-cyan-500/40 hover:text-cyan-300"
                  >
                    <RefreshCcw className="h-3.5 w-3.5" />
                    {t('aiDemo.knowledgeClear')}
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{t('aiDemo.knowledgeConfigTitle')}</p>
                    <p className="mt-1 text-xs text-slate-500">{t('aiDemo.knowledgeConfigDesc')}</p>
                  </div>
                  <span className="rounded-full border border-cyan-500/25 bg-cyan-500/10 px-2.5 py-1 text-[11px] text-cyan-300">
                    topK {ragConfig.topK}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {presets.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setRagConfig(preset.config)}
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-xs transition-colors',
                        activePresetId === preset.id
                          ? 'border-cyan-400/30 bg-cyan-500/10 text-cyan-300'
                          : 'border-slate-700 bg-slate-950/70 text-slate-400 hover:text-slate-200'
                      )}
                    >
                      {t(`aiDemo.knowledgePreset${preset.id.charAt(0).toUpperCase()}${preset.id.slice(1)}`)}
                    </button>
                  ))}
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-[140px_1fr]">
                  <label className="text-xs text-slate-400">{t('aiDemo.knowledgeConfigTopK')}</label>
                  <input
                    type="range"
                    min={2}
                    max={6}
                    step={1}
                    value={ragConfig.topK}
                    onChange={(event) => setRagConfig((prev) => ({ ...prev, topK: Number(event.target.value) }))}
                    className="accent-cyan-400"
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    { key: 'rewriteEnabled', label: t('aiDemo.knowledgeConfigRewrite') },
                    { key: 'rerankEnabled', label: t('aiDemo.knowledgeConfigRerank') },
                    { key: 'groundedMode', label: t('aiDemo.knowledgeConfigGrounded') },
                  ].map((item) => {
                    const enabled = ragConfig[item.key as keyof typeof ragConfig] as boolean;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() =>
                          setRagConfig((prev) => ({
                            ...prev,
                            [item.key]: !prev[item.key as keyof typeof prev],
                          }))
                        }
                        className={cn(
                          'rounded-full border px-3 py-1.5 text-xs transition-colors',
                          enabled
                            ? 'border-cyan-400/30 bg-cyan-500/10 text-cyan-300'
                            : 'border-slate-700 bg-slate-950/70 text-slate-400'
                        )}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div
                ref={listRef}
                onScroll={handleListScroll}
                className="chat-list-scrollbar h-[520px] overflow-y-auto overflow-x-hidden rounded-lg border border-slate-700 bg-slate-950/60 p-4"
              >
                {messages.length === 0 ? (
                  <div className="flex h-full flex-col justify-center">
                    <div className="mx-auto max-w-xl space-y-5 text-center">
                      <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300">
                        <Database className="h-3.5 w-3.5" />
                        {stats.totalDocs} {t('aiDemo.knowledgeStatsDocs')} · {stats.totalCategories} {t('aiDemo.knowledgeStatsCategories')}
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-white">{t('aiDemo.knowledgeEmptyTitle')}</h2>
                        <p className="mt-2 text-sm leading-7 text-slate-400">{t('aiDemo.knowledgeEmptyDesc')}</p>
                      </div>
                      <div className="flex flex-wrap justify-center gap-2">
                        {examples.map((example) => (
                          <button
                            key={example}
                            type="button"
                            onClick={() => handleSend(example)}
                            className="rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-slate-300 transition-colors hover:border-cyan-500/40 hover:bg-cyan-500/10 hover:text-cyan-300"
                          >
                            {example}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          'flex',
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        )}
                      >
                        <div
                          className={cn(
                            'max-w-[88%] rounded-2xl border px-4 py-3',
                            message.role === 'user'
                              ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-50'
                              : 'border-slate-700 bg-slate-900/80 text-slate-200'
                          )}
                        >
                          <div className="whitespace-pre-wrap break-words text-sm leading-7">
                            {message.role === 'assistant'
                              ? renderAnswerWithCitations(message.content || ' ', message.sources, (source) =>
                                  focusSource(source, {
                                    query: message.query ?? '',
                                    sources: message.sources ?? [],
                                    resetFilters: true,
                                  })
                                , (source) => {
                                  setHoveredCitation(source ? { messageId: message.id, source } : null);
                                  if (source && message.trace) setCurrentTrace(message.trace);
                                })
                              : message.content}
                          </div>
                          {message.role === 'assistant' && hoveredCitation?.messageId === message.id && (
                            <div className="mt-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3">
                              <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-xs text-cyan-300">{hoveredCitation.source.category}</p>
                                  <p className="truncate text-sm font-medium text-white">{hoveredCitation.source.title}</p>
                                </div>
                                <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[11px] text-slate-400">
                                  {t('aiDemo.knowledgeHoverPreview')}
                                </span>
                              </div>
                              <p className="mt-2 text-xs leading-6 text-slate-300">
                                {hoveredCitation.source.snippets[0] || hoveredCitation.source.summary}
                              </p>
                            </div>
                          )}
                          {message.role === 'assistant' && Boolean(message.sources?.length) && (
                            <div className="mt-3 space-y-2">
                              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">
                                {t('aiDemo.knowledgeReferencesLabel')} · {message.sources?.length}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {message.sources?.map((source, index) => (
                                  <button
                                    key={`${message.id}-${source.id}`}
                                    type="button"
                                    onClick={() =>
                                      {
                                        if (message.trace) setCurrentTrace(message.trace);
                                        focusSource(source, {
                                          query: message.query ?? '',
                                          sources: message.sources ?? [],
                                          resetFilters: true,
                                        });
                                      }
                                    }
                                    className={cn(
                                      'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] transition-colors',
                                      source.id === activeSourceId && sourcePanelQuery === (message.query ?? '')
                                        ? 'border-cyan-400/40 bg-cyan-500/10 text-cyan-300'
                                        : 'border-slate-700 bg-slate-950/70 text-slate-400 hover:text-slate-200'
                                    )}
                                  >
                                    <span>[S{index + 1}]</span>
                                    <span className="max-w-[160px] truncate">{source.title}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                          {message.role === 'assistant' && (
                            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80 pt-3">
                              <div className="text-[11px] text-slate-500">{t('aiDemo.knowledgeFeedbackPrompt')}</div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setMessageFeedback(message.id, 'up')}
                                  className={cn(
                                    'inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-[11px] transition-colors',
                                    message.feedback === 'up'
                                      ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300'
                                      : 'border-slate-700 bg-slate-950/70 text-slate-400 hover:text-slate-200'
                                  )}
                                >
                                  <ThumbsUp className="h-3.5 w-3.5" />
                                  {t('aiDemo.knowledgeFeedbackHelpful')}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setMessageFeedback(message.id, 'down')}
                                  className={cn(
                                    'inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-[11px] transition-colors',
                                    message.feedback === 'down'
                                      ? 'border-amber-400/30 bg-amber-500/10 text-amber-300'
                                      : 'border-slate-700 bg-slate-950/70 text-slate-400 hover:text-slate-200'
                                  )}
                                >
                                  <ThumbsDown className="h-3.5 w-3.5" />
                                  {t('aiDemo.knowledgeFeedbackNeedsWork')}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {streaming && (
                      <div className="flex justify-start">
                        <div className="rounded-2xl border border-cyan-500/20 bg-slate-900/80 px-4 py-3 text-sm text-cyan-300">
                          {t('aiDemo.knowledgeStreaming')}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-3">
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      void handleSend();
                    }
                  }}
                  rows={4}
                  disabled={loading}
                  placeholder={t('aiDemo.knowledgeInputPlaceholder')}
                  className="chat-list-scrollbar min-h-[112px] w-full resize-none rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                />
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-slate-500">{error ? `${t('aiDemo.knowledgeErrorPrefix')}${error}` : t('aiDemo.knowledgeHelper')}</p>
                  <Button onClick={() => handleSend()} disabled={loading || !input.trim()}>
                    <Send className="h-4 w-4" />
                    {loading ? t('aiDemo.knowledgeSending') : t('aiDemo.knowledgeSend')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="min-w-0 space-y-4">
          <Card className="border-cyan-500/20">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-2">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{t('aiDemo.knowledgeHeroStat2Label')}</p>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Database className="h-5 w-5 text-cyan-400" />
                    {t('aiDemo.knowledgeSourcesTitle')}
                  </CardTitle>
                  <p className="text-sm text-slate-400">{t('aiDemo.knowledgeSourcesDesc')}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setLibraryOpen(true)}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-900/70 px-2.5 py-1.5 text-xs text-slate-300 transition-colors hover:border-cyan-500/40 hover:text-cyan-300"
                >
                  <Library className="h-3.5 w-3.5" />
                  {t('aiDemo.knowledgeBrowseLibrary')}
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-3">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{t('aiDemo.knowledgeStatsDocs')}</p>
                  <p className="mt-2 text-lg font-semibold text-white">{stats.totalDocs}</p>
                </div>
                <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-3">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{t('aiDemo.knowledgeStatsCategories')}</p>
                  <p className="mt-2 text-lg font-semibold text-white">{stats.totalCategories}</p>
                </div>
                <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-3">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{t('aiDemo.knowledgeStatsMode')}</p>
                  <p className="mt-2 text-sm font-semibold text-cyan-300">{t('aiDemo.knowledgeStatsModeValue')}</p>
                </div>
              </div>

              <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{t('aiDemo.knowledgeMatchedFor')}</p>
                <p className="mt-2 text-sm text-slate-300">{sourcePanelQuery || t('aiDemo.knowledgeNoQuery')}</p>
                <p className="mt-2 text-xs text-slate-500">{t('aiDemo.knowledgeCitationJumpHint')}</p>
              </div>

              {sourcePanelSources.length > 0 && (
                <div className="grid gap-2 sm:grid-cols-3">
                  <select
                    value={sourceCategoryFilter}
                    onChange={(event) => setSourceCategoryFilter(event.target.value)}
                    className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                  >
                    <option value="all">{t('aiDemo.knowledgeAllCategories')}</option>
                    {sourceCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  <select
                    value={sourceTagFilter}
                    onChange={(event) => setSourceTagFilter(event.target.value)}
                    className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                  >
                    <option value="all">{t('aiDemo.knowledgeAllTags')}</option>
                    {sourceTags.map((tag) => (
                      <option key={tag} value={tag}>
                        {tag}
                      </option>
                    ))}
                  </select>
                  <input
                    value={sourceKeywordFilter}
                    onChange={(event) => setSourceKeywordFilter(event.target.value)}
                    placeholder={t('aiDemo.knowledgeFilterPlaceholder')}
                    className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                  />
                </div>
              )}

              {sourcePanelSources.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-700 bg-slate-950/40 p-4 text-sm text-slate-500">
                  {t('aiDemo.knowledgeSourcesEmpty')}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-xs text-slate-500">
                    {filteredSources.length} / {sourcePanelSources.length} {t('aiDemo.knowledgeFilteredCount')}
                  </div>
                  <div className="chat-list-scrollbar max-h-[280px] space-y-3 overflow-y-auto pr-1">
                  {filteredSources.length > 0 ? filteredSources.map((source, index) => (
                    <button
                      key={source.id}
                      ref={(element) => {
                        sourceCardRefs.current[source.id] = element;
                      }}
                      type="button"
                      onClick={() => focusSource(source)}
                      className={cn(
                        'w-full rounded-xl border p-3 text-left transition-colors',
                        source.id === activeSourceId
                          ? 'border-cyan-400/30 bg-cyan-500/10'
                          : highlightedSourceId === source.id
                            ? 'border-cyan-500/25 bg-cyan-500/5'
                          : 'border-slate-700 bg-slate-950/50 hover:border-slate-600'
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs text-cyan-300">[S{index + 1}] {source.category}</p>
                          <p className="mt-1 truncate text-sm font-medium text-white">{source.title}</p>
                        </div>
                        <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[11px] text-slate-400">
                          {t('aiDemo.knowledgeScoreLabel')} {source.score}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-xs leading-6 text-slate-400">{source.summary}</p>
                    </button>
                  )) : (
                    <div className="rounded-lg border border-dashed border-slate-700 bg-slate-950/40 p-4 text-sm text-slate-500">
                      {t('aiDemo.knowledgeFilteredEmpty')}
                    </div>
                  )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-cyan-500/20">
            <CardHeader className="pb-3">
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{t('aiDemo.knowledgeConfigActive')}</p>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-5 w-5 text-cyan-400" />
                  {t('aiDemo.knowledgeTraceTitle')}
                </CardTitle>
                <p className="text-sm text-slate-400">{t('aiDemo.knowledgeTraceDesc')}</p>
              </div>
            </CardHeader>
            <CardContent>
              {!currentTrace ? (
                <div className="rounded-lg border border-dashed border-slate-700 bg-slate-950/40 p-4 text-sm text-slate-500">
                  {t('aiDemo.knowledgeTraceEmpty')}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-3">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{t('aiDemo.knowledgeTraceOriginalQuery')}</p>
                      <p className="mt-2 text-sm text-slate-200">{currentTrace.originalQuery}</p>
                    </div>
                    <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-3">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{t('aiDemo.knowledgeTraceRecallCount')}</p>
                      <p className="mt-2 text-lg font-semibold text-white">{currentTrace.recallCount ?? currentTrace.retrievedCount}</p>
                    </div>
                    <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-3">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{t('aiDemo.knowledgeTraceRetrieved')}</p>
                      <p className="mt-2 text-lg font-semibold text-white">{currentTrace.retrievedCount}</p>
                    </div>
                  </div>

                  {currentTrace.config && (
                    <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-3">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{t('aiDemo.knowledgeConfigActive')}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="rounded-full border border-cyan-500/25 bg-cyan-500/10 px-2.5 py-1 text-[11px] text-cyan-300">
                          topK {currentTrace.config.topK}
                        </span>
                        <span className="rounded-full border border-slate-700 bg-slate-900/70 px-2.5 py-1 text-[11px] text-slate-300">
                          {currentTrace.config.rewriteEnabled ? t('aiDemo.knowledgeConfigRewrite') : `${t('aiDemo.knowledgeConfigRewrite')} · ${t('aiDemo.knowledgeConfigOff')}`}
                        </span>
                        <span className="rounded-full border border-slate-700 bg-slate-900/70 px-2.5 py-1 text-[11px] text-slate-300">
                          {currentTrace.config.rerankEnabled ? t('aiDemo.knowledgeConfigRerank') : `${t('aiDemo.knowledgeConfigRerank')} · ${t('aiDemo.knowledgeConfigOff')}`}
                        </span>
                        <span className="rounded-full border border-slate-700 bg-slate-900/70 px-2.5 py-1 text-[11px] text-slate-300">
                          {currentTrace.config.groundedMode ? t('aiDemo.knowledgeConfigGrounded') : t('aiDemo.knowledgeConfigFlexible')}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{t('aiDemo.knowledgeTraceFlow')}</p>
                    {currentTrace.stages?.map((stage, index) => (
                      <div key={stage.id} className="rounded-xl border border-slate-700 bg-slate-950/60 p-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-cyan-500/10 text-[11px] text-cyan-300">
                            {index + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <p className="text-sm font-medium text-white">{stage.title}</p>
                              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-300">
                                {t('aiDemo.knowledgeTraceDone')}
                              </span>
                            </div>
                            <p className="mt-2 text-sm leading-6 text-slate-400">{stage.summary}</p>
                            <div className="mt-3 space-y-2">
                              {stage.items.map((item, itemIndex) => (
                                <div
                                  key={`${stage.id}-${itemIndex}`}
                                  className="rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm text-slate-300"
                                >
                                  {item}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-3">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{t('aiDemo.knowledgeTraceKeywords')}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {currentTrace.keywords.length > 0 ? currentTrace.keywords.map((keyword) => (
                        <span
                          key={keyword}
                          className="rounded-full border border-cyan-500/25 bg-cyan-500/10 px-2.5 py-1 text-[11px] text-cyan-300"
                        >
                          {keyword}
                        </span>
                      )) : (
                        <span className="text-xs text-slate-500">{t('aiDemo.knowledgeTraceKeywordsEmpty')}</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{t('aiDemo.knowledgeTraceTopSources')}</p>
                    {currentTrace.topSources.map((source) => (
                      <button
                        key={source.id}
                        type="button"
                        onClick={() => {
                          const matched = sourcePanelSources.find((item) => item.id === source.id);
                          if (matched) focusSource(matched);
                        }}
                        className="flex w-full items-center justify-between rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-left transition-colors hover:border-cyan-500/30"
                      >
                        <div className="min-w-0">
                          <p className="text-xs text-cyan-300">{source.label}</p>
                          <p className="truncate text-sm text-slate-200">{source.title}</p>
                        </div>
                        <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[11px] text-slate-400">
                          {t('aiDemo.knowledgeScoreLabel')} {source.score}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{t('aiDemo.knowledgeTraceNotes')}</p>
                    {currentTrace.notes.map((note, index) => (
                      <div key={`${note}-${index}`} className="rounded-lg border border-slate-700 bg-slate-950/60 p-3 text-sm leading-7 text-slate-300">
                        {note}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-cyan-500/20">
            <CardHeader className="pb-3">
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{t('aiDemo.knowledgeHeroStat3Label')}</p>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ThumbsUp className="h-5 w-5 text-cyan-400" />
                  {t('aiDemo.knowledgeFeedbackLogTitle')}
                </CardTitle>
                <p className="text-sm text-slate-400">{t('aiDemo.knowledgeFeedbackDesc')}</p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-3">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{t('aiDemo.knowledgeFeedbackTotalAnswers')}</p>
                  <p className="mt-2 text-lg font-semibold text-white">{feedbackStats.assistantCount}</p>
                </div>
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-300/80">{t('aiDemo.knowledgeFeedbackHelpful')}</p>
                  <p className="mt-2 text-lg font-semibold text-emerald-300">{feedbackStats.helpful}</p>
                </div>
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-amber-300/80">{t('aiDemo.knowledgeFeedbackNeedsWork')}</p>
                  <p className="mt-2 text-lg font-semibold text-amber-300">{feedbackStats.needsWork}</p>
                </div>
                <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3 sm:col-span-3">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-300/80">{t('aiDemo.knowledgeFeedbackRate')}</p>
                  <p className="mt-2 text-lg font-semibold text-cyan-300">{feedbackStats.helpfulRate}%</p>
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-slate-700 bg-slate-950/60 p-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{t('aiDemo.knowledgeFeedbackRecent')}</p>
                {feedbackStats.recent.length > 0 ? (
                  <div className="mt-3 space-y-3">
                    {feedbackStats.recent.map((message) => (
                      <div key={`${message.id}-feedback-log`} className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <span
                            className={cn(
                              'rounded-full border px-2 py-0.5 text-[11px]',
                              message.feedback === 'up'
                                ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300'
                                : 'border-amber-400/30 bg-amber-500/10 text-amber-300'
                            )}
                          >
                            {message.feedback === 'up'
                              ? t('aiDemo.knowledgeFeedbackHelpful')
                              : t('aiDemo.knowledgeFeedbackNeedsWork')}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {message.sources?.length ?? 0} {t('aiDemo.knowledgeFilteredCount')}
                          </span>
                        </div>
                        {message.query && <p className="mt-2 text-xs text-slate-400">{message.query}</p>}
                        <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-300">{message.content || t('aiDemo.knowledgeFeedbackNoAnswer')}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 rounded-lg border border-dashed border-slate-700 bg-slate-950/40 p-4 text-sm text-slate-500">
                    {t('aiDemo.knowledgeFeedbackEmpty')}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-cyan-500/20">
            <CardHeader className="pb-3">
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{t('aiDemo.knowledgeTraceFlow')}</p>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Database className="h-5 w-5 text-cyan-400" />
                  {t('aiDemo.knowledgeComparisonTitle')}
                </CardTitle>
                <p className="text-sm text-slate-400">{t('aiDemo.knowledgeComparisonDesc')}</p>
              </div>
            </CardHeader>
            <CardContent>
              {comparisonRuns.length >= 2 ? (
                <div className="grid gap-3 lg:grid-cols-2">
                  {comparisonRuns.map((message, index) => (
                    <div key={`${message.id}-comparison`} className="rounded-xl border border-slate-700 bg-slate-950/60 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-white">
                          {t('aiDemo.knowledgeComparisonRun')} {comparisonRuns.length - index}
                        </p>
                        <span
                          className={cn(
                            'rounded-full border px-2 py-0.5 text-[11px]',
                            message.feedback === 'up'
                              ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300'
                              : message.feedback === 'down'
                                ? 'border-amber-400/30 bg-amber-500/10 text-amber-300'
                                : 'border-slate-700 bg-slate-900/70 text-slate-400'
                          )}
                        >
                          {message.feedback === 'up'
                            ? t('aiDemo.knowledgeFeedbackHelpful')
                            : message.feedback === 'down'
                              ? t('aiDemo.knowledgeFeedbackNeedsWork')
                              : t('aiDemo.knowledgeComparisonNoFeedback')}
                        </span>
                      </div>
                      {message.query && <p className="mt-2 line-clamp-2 text-xs leading-6 text-slate-400">{message.query}</p>}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full border border-cyan-500/25 bg-cyan-500/10 px-2 py-0.5 text-[11px] text-cyan-300">
                          topK {message.trace?.config?.topK ?? '--'}
                        </span>
                        <span className="rounded-full border border-slate-700 bg-slate-900/70 px-2 py-0.5 text-[11px] text-slate-300">
                          {message.trace?.config?.groundedMode ? t('aiDemo.knowledgeConfigGrounded') : t('aiDemo.knowledgeConfigFlexible')}
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                          <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{t('aiDemo.knowledgeTraceRecallCount')}</p>
                          <p className="mt-2 text-lg font-semibold text-white">{message.trace?.recallCount ?? '--'}</p>
                        </div>
                        <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                          <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{t('aiDemo.knowledgeTraceRetrieved')}</p>
                          <p className="mt-2 text-lg font-semibold text-white">{message.trace?.retrievedCount ?? '--'}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (message.trace?.config) {
                            setRagConfig(message.trace.config);
                          }
                          if (message.trace) {
                            setCurrentTrace(message.trace);
                          }
                        }}
                        className="mt-3 inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-900/70 px-2.5 py-1.5 text-xs text-slate-300 transition-colors hover:border-cyan-500/40 hover:text-cyan-300"
                      >
                        {t('aiDemo.knowledgeComparisonApply')}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-700 bg-slate-950/40 p-4 text-sm text-slate-500">
                  {t('aiDemo.knowledgeComparisonEmpty')}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-cyan-500/20">
            <CardHeader className="pb-3">
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{t('aiDemo.knowledgeReferencesLabel')}</p>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ExternalLink className="h-5 w-5 text-cyan-400" />
                  {t('aiDemo.knowledgeSourceDetailTitle')}
                </CardTitle>
                <p className="text-sm text-slate-400">{t('aiDemo.knowledgeSourceDetailDesc')}</p>
              </div>
            </CardHeader>
            <CardContent>
              {!activeSource ? (
                <div className="rounded-lg border border-dashed border-slate-700 bg-slate-950/40 p-4 text-sm text-slate-500">
                  {t('aiDemo.knowledgeSourceDetailEmpty')}
                </div>
              ) : (
                <div ref={sourceDetailRef} className="space-y-4">
                  <div
                    className={cn(
                      'rounded-xl border border-transparent p-0 transition-colors',
                      highlightedSourceId === activeSource.id && 'border-cyan-500/25 bg-cyan-500/5 p-3'
                    )}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[11px] text-cyan-300">
                        {activeSource.category}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {t('aiDemo.knowledgeUpdatedAtLabel')} {activeSource.updatedAt}
                      </span>
                    </div>
                    <h3 className="mt-2 text-base font-semibold text-white">{activeSource.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-400">{activeSource.summary}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {activeSource.tags.map((tag) => (
                      <button
                        key={`${activeSource.id}-${tag}`}
                        type="button"
                        onClick={() => setSourceTagFilter(tag)}
                        className={cn(
                          'rounded-full border bg-slate-950/70 px-2.5 py-1 text-[11px] transition-colors',
                          sourceTagFilter === tag
                            ? 'border-cyan-400/30 text-cyan-300'
                            : 'border-slate-700 text-slate-400 hover:text-slate-200'
                        )}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{t('aiDemo.knowledgeSnippetsTitle')}</p>
                    {activeSource.snippets.map((snippet, index) => (
                      <div
                        key={`${activeSource.id}-snippet-${index}`}
                        className={cn(
                          'rounded-lg border bg-slate-950/70 p-3 text-sm leading-7 text-slate-300 transition-colors',
                          highlightedSourceId === activeSource.id
                            ? 'border-cyan-500/25 bg-cyan-500/5'
                            : 'border-slate-700'
                        )}
                      >
                        {snippet}
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{t('aiDemo.knowledgeFullContentTitle')}</p>
                    <div className="chat-list-scrollbar max-h-[260px] overflow-y-auto rounded-lg border border-slate-700 bg-slate-950/70 p-4 text-sm leading-7 text-slate-300 whitespace-pre-wrap break-words">
                      {activeSource.content}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Dialog
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        title={t('aiDemo.knowledgeLibraryTitle')}
        className="h-[88vh] max-w-[92vw]"
      >
        <div className="flex h-full min-h-0 flex-col gap-4">
          <div className="grid gap-3 md:grid-cols-[220px_1fr]">
            <select
              value={libraryCategory}
              onChange={(event) => setLibraryCategory(event.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
            >
              <option value="all">{t('aiDemo.knowledgeAllCategories')}</option>
              {libraryCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <input
              value={libraryKeyword}
              onChange={(event) => setLibraryKeyword(event.target.value)}
              placeholder={t('aiDemo.knowledgeLibrarySearchPlaceholder')}
              className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
            />
          </div>

          <div className="text-xs text-slate-500">
            {filteredLibraryDocs.length} / {knowledgeDocs.length} {t('aiDemo.knowledgeLibraryCount')}
          </div>

          <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)]">
            <div className="chat-list-scrollbar min-h-0 overflow-y-auto space-y-3 pr-1">
              {filteredLibraryDocs.map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => setSelectedLibraryDocId(doc.id)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/60 p-4 text-left transition-colors hover:border-cyan-500/30 hover:bg-cyan-500/5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-cyan-300">{doc.category}</p>
                      <p className="mt-1 truncate text-sm font-medium text-white">{doc.title}</p>
                    </div>
                    <span className="text-[11px] text-slate-500">{doc.updatedAt}</span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs leading-6 text-slate-400">{doc.summary}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {doc.tags.map((tag) => (
                      <span
                        key={`${doc.id}-${tag}`}
                        className="rounded-full border border-slate-700 bg-slate-900/70 px-2 py-0.5 text-[11px] text-slate-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>

            <div className="min-w-0 rounded-xl border border-slate-700 bg-slate-950/60 p-4">
              {selectedLibraryDoc ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[11px] text-cyan-300">
                        {selectedLibraryDoc.category}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {t('aiDemo.knowledgeUpdatedAtLabel')} {selectedLibraryDoc.updatedAt}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold text-white">{selectedLibraryDoc.title}</h3>
                        <p className="mt-2 text-sm leading-7 text-slate-400">{selectedLibraryDoc.summary}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => openDocFromLibrary(selectedLibraryDoc.id)}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-900/70 px-2.5 py-1.5 text-xs text-slate-300 transition-colors hover:border-cyan-500/40 hover:text-cyan-300"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        {t('aiDemo.knowledgeUseAsSource')}
                      </button>
                    </div>
                  </div>
                  <div className="chat-list-scrollbar max-h-[46vh] overflow-y-auto whitespace-pre-wrap break-words rounded-lg border border-slate-700 bg-slate-900/70 p-4 text-sm leading-7 text-slate-300">
                    {selectedLibraryDoc.content}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-700 bg-slate-950/40 p-4 text-sm text-slate-500">
                  {t('aiDemo.knowledgeLibraryEmpty')}
                </div>
              )}
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
