'use client';

import Link from 'next/link';
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Bot,
  BrainCircuit,
  ChevronDown,
  ChevronRight,
  Code2,
  Copy,
  Download,
  Eye,
  FileCode2,
  Loader2,
  Maximize2,
  Play,
  Search,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { buttonVariants, Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useLocale } from '@/contexts/locale';
import { getHighlighter, mapToShikiLang, createLineNumberTransformer } from '@/lib/shiki';

type TimelineItem = {
  id: string;
  kind: 'thought' | 'action' | 'observation' | 'artifact';
  title: string;
  content?: string;
  status: 'queued' | 'running' | 'streaming' | 'done';
  timestamp: string;
  startedAtMs?: number;
  updatedAtMs?: number;
};

type ArtifactKind = 'html' | 'markdown' | 'json';

type ArtifactState = {
  id: string;
  kind: ArtifactKind;
  title: string;
  content: string;
  status: 'queued' | 'running' | 'streaming' | 'done';
};

type ArtifactVersion = {
  versionId: string;
  runId: number;
  title: string;
  kind: ArtifactKind;
  content: string;
  timestamp: string;
};

type ContentSegment =
  | { type: 'text'; content: string }
  | { type: 'code'; content: string; language: string };

type AgentEvent =
  | { type: 'step_started'; stepId: string; title: string; ts?: string }
  | { type: 'thought_progress'; stepId: string; title: string; content: string; ts?: string }
  | { type: 'step_completed'; stepId: string; title: string; content?: string; ts?: string }
  | { type: 'tool_called'; tool: string; input?: string; ts?: string }
  | { type: 'tool_result'; tool: string; output?: string; ts?: string }
  | { type: 'artifact_started'; artifactId: string; kind: ArtifactKind; title: string; ts?: string }
  | { type: 'artifact_chunk'; artifactId: string; content: string; ts?: string }
  | { type: 'artifact_completed'; artifactId: string; kind: ArtifactKind; title: string; content: string; ts?: string }
  | { type: 'final_answer_chunk'; content: string; ts?: string }
  | { type: 'done'; ts?: string }
  | { type: 'error'; error: string; ts?: string };

function getToolLabel(tool: string, locale: 'zh' | 'en') {
  const map =
    locale === 'zh'
      ? {
          knowledge_search: '知识检索',
          artifact_strategy: '产物策略',
          implementation_checklist: '实施清单',
        }
      : {
          knowledge_search: 'Knowledge search',
          artifact_strategy: 'Artifact strategy',
          implementation_checklist: 'Implementation checklist',
        };
  return map[tool as keyof typeof map] ?? tool;
}

function getItemIcon(kind: TimelineItem['kind']) {
  if (kind === 'action') return Wrench;
  if (kind === 'observation') return Search;
  if (kind === 'artifact') return FileCode2;
  return BrainCircuit;
}

function formatEventTime(ts?: string) {
  if (!ts) return '';
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function parseEventMs(ts?: string) {
  if (!ts) return undefined;
  const value = new Date(ts).getTime();
  return Number.isNaN(value) ? undefined : value;
}

function getPhaseLabel(kind: TimelineItem['kind'], locale: 'zh' | 'en') {
  const map =
    locale === 'zh'
      ? {
          thought: 'Thought',
          action: 'Action',
          observation: 'Observation',
          artifact: 'Artifact',
        }
      : {
          thought: 'Thought',
          action: 'Action',
          observation: 'Observation',
          artifact: 'Artifact',
        };
  return map[kind];
}

function getObservationTitle(tool: string, locale: 'zh' | 'en') {
  const label = getToolLabel(tool, locale);
  return locale === 'zh' ? `${label}结果` : `${label} Result`;
}

function getStatusLabel(status: TimelineItem['status'], t: (key: string) => string) {
  if (status === 'queued') return t('aiDemo.agentStatusQueued');
  if (status === 'streaming') return t('aiDemo.agentStatusStreaming');
  if (status === 'done') return t('aiDemo.agentStatusDone');
  return t('aiDemo.agentStatusRunning');
}

function getThoughtStreamingMessage(stepId: string, locale: 'zh' | 'en') {
  if (locale === 'zh') {
    if (stepId === 'analysis') return '正在拆解任务、识别目标与执行路径…';
    if (stepId === 'artifact') return '正在组织上下文并准备生成产物…';
    if (stepId === 'final') return '正在汇总工具结果并整理最终回答…';
    return '正在思考下一步执行策略…';
  }

  if (stepId === 'analysis') return 'Breaking down the task, intent, and execution path…';
  if (stepId === 'artifact') return 'Preparing context and artifact generation strategy…';
  if (stepId === 'final') return 'Synthesizing tool outputs into the final answer…';
  return 'Thinking through the next execution step…';
}

function getCharacterProgress(length: number, locale: 'zh' | 'en') {
  return locale === 'zh' ? `已输出 ${length} 个字符` : `${length} characters streamed`;
}

function formatDuration(ms?: number, locale: 'zh' | 'en' = 'zh') {
  if (!ms || ms <= 0) return '';
  if (ms < 1000) return locale === 'zh' ? `${ms}ms` : `${ms}ms`;
  const seconds = (ms / 1000).toFixed(ms >= 10_000 ? 0 : 1);
  return locale === 'zh' ? `${seconds}s` : `${seconds}s`;
}

function getArtifactLabel(kind: ArtifactKind) {
  if (kind === 'html') return 'HTML';
  if (kind === 'json') return 'JSON';
  return 'Markdown';
}

function getArtifactFileName(artifact: ArtifactState) {
  const slug = artifact.title
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/gi, '-')
    .replace(/^-+|-+$/g, '');
  const ext = artifact.kind === 'html' ? 'html' : artifact.kind === 'json' ? 'json' : 'md';
  return `${slug || artifact.id}.${ext}`;
}

function getLineCount(content: string) {
  return content ? content.split(/\r?\n/).length : 0;
}

function getObservationToolKey(id: string) {
  return id.startsWith('observation:') ? id.replace('observation:', '') : null;
}

function buildArtifactDiff(previous: string, current: string) {
  const prevLines = previous.split(/\r?\n/);
  const currentLines = current.split(/\r?\n/);
  const max = Math.max(prevLines.length, currentLines.length);
  const diffLines: string[] = [];

  for (let index = 0; index < max; index += 1) {
    const prevLine = prevLines[index];
    const currentLine = currentLines[index];

    if (prevLine === currentLine) continue;
    if (typeof prevLine === 'string') diffLines.push(`- ${prevLine}`);
    if (typeof currentLine === 'string') diffLines.push(`+ ${currentLine}`);
  }

  return diffLines.join('\n');
}

function parseObservationContent(content?: string) {
  if (!content) return { pairs: [] as Array<{ key: string; value: string }>, bullets: [] as string[] };

  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const pairs: Array<{ key: string; value: string }> = [];
  const bullets: string[] = [];

  for (const line of lines) {
    const pairMatch = line.match(/^[-*]?\s*([^:：]{2,24})[:：]\s*(.+)$/);
    if (pairMatch) {
      pairs.push({
        key: pairMatch[1].trim(),
        value: pairMatch[2].trim(),
      });
      continue;
    }

    bullets.push(line.replace(/^[-*]\s*/, ''));
  }

  return { pairs, bullets };
}

function inferLanguage(language?: string, fallback: ArtifactKind | 'diff' | 'text' = 'text') {
  const normalized = (language || '').toLowerCase();
  if (normalized.includes('json')) return 'json';
  if (normalized.includes('html')) return 'html';
  if (normalized.includes('md') || normalized.includes('markdown')) return 'markdown';
  if (normalized.includes('diff')) return 'diff';
  if (normalized.includes('ts') || normalized.includes('js')) return 'typescript';
  return fallback;
}

function splitContentSegments(content: string, fallbackLanguage: string) {
  const segments: ContentSegment[] = [];
  const regex = /```([\w-]+)?\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: content.slice(lastIndex, match.index),
      });
    }

    segments.push({
      type: 'code',
      language: inferLanguage(match[1], 'text'),
      content: match[2].replace(/\n$/, ''),
    });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < content.length) {
    segments.push({
      type: 'text',
      content: content.slice(lastIndex),
    });
  }

  if (segments.length === 0 && content) {
    const inferred = inferLanguage(fallbackLanguage, 'text');
    if (inferred === 'html' || inferred === 'json' || inferred === 'diff' || inferred === 'typescript') {
      segments.push({ type: 'code', content, language: inferred });
    } else {
      segments.push({ type: 'text', content });
    }
  }

  return segments;
}

function tokenizeLine(line: string, language: string) {
  if (language === 'diff') {
    if (line.startsWith('+')) return [{ text: line, className: 'code-token-added' }];
    if (line.startsWith('-')) return [{ text: line, className: 'code-token-removed' }];
  }

  const regex =
    /(<!--[\s\S]*?-->|\/\/.*$|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"])*"|'(?:\\.|[^'])*'|`(?:\\.|[^`])*`)|(<\/?[A-Za-z][^>]*>)|\b(true|false|null|undefined|const|let|var|return|function|if|else|for|while|async|await|class|interface|type|import|from|export|default|new)\b|\b(\d+(?:\.\d+)?)\b|([{}[\](),.:;])/gm;

  const tokens: Array<{ text: string; className: string }> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({
        text: line.slice(lastIndex, match.index),
        className: 'code-token-plain',
      });
    }

    const text = match[0];
    let className = 'code-token-plain';
    if (match[1]) className = 'code-token-comment';
    else if (match[2]) className = 'code-token-string';
    else if (match[3]) className = 'code-token-tag';
    else if (match[4]) className = 'code-token-keyword';
    else if (match[5]) className = 'code-token-number';
    else if (match[6]) className = 'code-token-punctuation';

    tokens.push({ text, className });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < line.length) {
    tokens.push({
      text: line.slice(lastIndex),
      className: 'code-token-plain',
    });
  }

  return tokens.length > 0 ? tokens : [{ text: line || ' ', className: 'code-token-plain' }];
}

function HighlightedCodeBlock(props: {
  code: string;
  language: string;
  maxHeightClass?: string;
  collapsible?: boolean;
  wrapLongLines?: boolean;
  expandLabel: string;
  collapseLabel: string;
}) {
  const {
    code,
    language,
    maxHeightClass = 'max-h-[320px]',
    collapsible = true,
    wrapLongLines = false,
    expandLabel,
    collapseLabel,
  } = props;
  const [expanded, setExpanded] = useState(false);
  const [shikiHtml, setShikiHtml] = useState<string | null>(null);
  const lines = code.split(/\r?\n/);
  const canCollapse = collapsible && lines.length > 18;
  const shouldWrap = wrapLongLines || language === 'markdown';
  const shouldClampContainer = language === 'json' || language === 'html' || language === 'typescript' || language === 'diff';

  useEffect(() => {
    setShikiHtml(null);
    let cancelled = false;
    getHighlighter()
      .then((h) => {
        const html = h.codeToHtml(code, {
          lang: mapToShikiLang(language),
          theme: 'github-dark',
          transformers: [createLineNumberTransformer()],
        });
        if (!cancelled) setShikiHtml(html);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [code, language]);

  const shikiInnerHtml = shikiHtml != null ? { __html: shikiHtml } : undefined;
  const shikiBlockClass = cn(
    'shiki-code-block chat-list-scrollbar min-w-0 px-0 py-2',
    shouldWrap ? 'overflow-x-hidden whitespace-pre-wrap break-words' : 'overflow-x-auto overflow-y-hidden'
  );
  const codeBlockContent =
    shikiHtml != null ? (
      <div className={shikiBlockClass} dangerouslySetInnerHTML={shikiInnerHtml} />
    ) : (
      <pre
        className={cn(
          'chat-list-scrollbar min-w-0 px-0 py-2 text-[12px] leading-6 text-slate-200',
          shouldWrap ? 'overflow-x-hidden whitespace-pre-wrap break-words' : 'overflow-x-auto overflow-y-hidden'
        )}
      >
        {lines.map((line, index) => (
          <div key={`${language}-${index}`} className={cn('code-line', shouldWrap && 'code-line-wrap')}>
            <span className="code-gutter">{index + 1}</span>
            <span className={cn('min-w-0 flex-1', shouldWrap && 'whitespace-pre-wrap break-words')}>
              {tokenizeLine(line, language).map((token, tokenIndex) => (
                <span key={`${index}-${tokenIndex}`} className={token.className}>
                  {token.text}
                </span>
              ))}
            </span>
          </div>
        ))}
      </pre>
    );

  return (
    <div className="min-w-0 rounded-lg border border-slate-700 bg-slate-950/90">
      <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2">
        <span className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{language}</span>
        {canCollapse && (
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="text-xs text-slate-400 transition-colors hover:text-cyan-300"
          >
            {expanded ? collapseLabel : expandLabel}
          </button>
        )}
      </div>
      <div className={cn(canCollapse && !expanded && `${maxHeightClass} overflow-hidden`, shouldClampContainer && 'min-w-0')}>
        {codeBlockContent}
      </div>
    </div>
  );
}

function ExpandableTextPanel(props: {
  children: ReactNode;
  canCollapse: boolean;
  expandLabel: string;
  collapseLabel: string;
  maxHeightClass?: string;
  className?: string;
}) {
  const { children, canCollapse, expandLabel, collapseLabel, maxHeightClass = 'max-h-[280px]', className = '' } = props;
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={cn('relative rounded-lg border border-slate-700 bg-slate-900/80', className)}>
      {canCollapse && (
        <div className="flex justify-end px-3 pt-3">
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="text-xs text-slate-400 transition-colors hover:text-cyan-300"
          >
            {expanded ? collapseLabel : expandLabel}
          </button>
        </div>
      )}
      <div className={cn('p-4', canCollapse && !expanded && maxHeightClass, canCollapse && !expanded && 'overflow-hidden')}>
        {children}
      </div>
      {canCollapse && !expanded && <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-900/95 to-transparent" />}
    </div>
  );
}

function RichContentRenderer(props: {
  content: string;
  fallbackLanguage: string;
  expandLabel: string;
  collapseLabel: string;
  textClassName?: string;
}) {
  const {
    content,
    fallbackLanguage,
    expandLabel,
    collapseLabel,
    textClassName = 'text-sm text-slate-200 whitespace-pre-wrap break-words',
  } = props;
  const segments = splitContentSegments(content, fallbackLanguage);
  const canCollapseText = getLineCount(content) > 18 || content.length > 900;

  return (
    <div className="space-y-3">
      {segments.map((segment, index) =>
        segment.type === 'code' ? (
          <HighlightedCodeBlock
            key={`code-${index}`}
            code={segment.content}
            language={segment.language}
            wrapLongLines={segment.language === 'markdown'}
            expandLabel={expandLabel}
            collapseLabel={collapseLabel}
          />
        ) : (
          <ExpandableTextPanel
            key={`text-${index}`}
            canCollapse={canCollapseText}
            expandLabel={expandLabel}
            collapseLabel={collapseLabel}
            className="bg-slate-900/70"
          >
            <div className={textClassName}>{segment.content}</div>
          </ExpandableTextPanel>
        )
      )}
    </div>
  );
}

export default function AgentSimulatorPage() {
  const { t, locale } = useLocale();
  const [task, setTask] = useState('');
  const [running, setRunning] = useState(false);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [finalAnswer, setFinalAnswer] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [artifacts, setArtifacts] = useState<ArtifactState[]>([]);
  const [artifactVersionMap, setArtifactVersionMap] = useState<Record<string, ArtifactVersion[]>>({});
  const [activeArtifactId, setActiveArtifactId] = useState<string | null>(null);
  const [artifactView, setArtifactView] = useState<'preview' | 'source' | 'metadata' | 'diff'>('preview');
  const [artifactActionMessage, setArtifactActionMessage] = useState<string | null>(null);
  const [collapsedItemIds, setCollapsedItemIds] = useState<string[]>([]);
  const [selectedHistoryVersionId, setSelectedHistoryVersionId] = useState<string | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const eventQueueRef = useRef<AgentEvent[]>([]);
  const processingRef = useRef(false);
  const stickToBottomRef = useRef(true);
  const finalAnswerRef = useRef('');
  const runIdRef = useRef(0);

  const suggestions = useMemo(
    () => [t('aiDemo.agentSuggestion1'), t('aiDemo.agentSuggestion2'), t('aiDemo.agentSuggestion3')],
    [t]
  );

  const activeArtifact = useMemo(
    () => artifacts.find((item) => item.id === activeArtifactId) ?? artifacts[artifacts.length - 1] ?? null,
    [activeArtifactId, artifacts]
  );

  const activeArtifactVersions = useMemo(
    () => (activeArtifact ? artifactVersionMap[activeArtifact.id] ?? [] : []),
    [activeArtifact, artifactVersionMap]
  );

  const selectedHistoryVersion = useMemo(
    () =>
      selectedHistoryVersionId
        ? activeArtifactVersions.find((item) => item.versionId === selectedHistoryVersionId) ?? null
        : activeArtifactVersions.length >= 2
          ? activeArtifactVersions[activeArtifactVersions.length - 2]
          : null,
    [activeArtifactVersions, selectedHistoryVersionId]
  );

  const activeArtifactDiff = useMemo(() => {
    if (activeArtifactVersions.length < 2 || !selectedHistoryVersion) return '';
    const previousVersion = selectedHistoryVersion;
    const latestVersion = activeArtifactVersions[activeArtifactVersions.length - 1];
    return buildArtifactDiff(previousVersion.content, latestVersion.content);
  }, [activeArtifactVersions, selectedHistoryVersion]);

  const activeArtifactMetadata = useMemo(() => {
    if (!activeArtifact) return null;
    const versions = artifactVersionMap[activeArtifact.id] ?? [];

    let parsedJson: Record<string, unknown> | null = null;
    if (activeArtifact.kind === 'json') {
      try {
        parsedJson = JSON.parse(activeArtifact.content) as Record<string, unknown>;
      } catch {
        parsedJson = null;
      }
    }

    return {
      id: activeArtifact.id,
      kind: getArtifactLabel(activeArtifact.kind),
      status: activeArtifact.status,
      fileName: getArtifactFileName(activeArtifact),
      chars: activeArtifact.content.length,
      lines: getLineCount(activeArtifact.content),
      hasPreview: activeArtifact.kind === 'html',
      jsonKeys: parsedJson ? Object.keys(parsedJson) : [],
      versions: versions.length,
      latestVersion: versions[versions.length - 1] ?? null,
    };
  }, [activeArtifact, artifactVersionMap]);

  const isCollapsed = (id: string) => collapsedItemIds.includes(id);

  const toggleCollapsed = (id: string) => {
    setCollapsedItemIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const upsertItem = (
    id: string,
    next: Partial<TimelineItem> & Pick<TimelineItem, 'kind' | 'title' | 'timestamp'>
  ) => {
    setTimeline((prev) => {
      const index = prev.findIndex((item) => item.id === id);
      if (index === -1) {
        return [...prev, { id, status: 'running', content: '', ...next }];
      }
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        ...next,
        startedAtMs: next.startedAtMs ?? copy[index].startedAtMs,
        updatedAtMs: next.updatedAtMs ?? copy[index].updatedAtMs,
      };
      return copy;
    });
  };

  const upsertArtifact = (id: string, next: Omit<ArtifactState, 'id'>) => {
    setArtifacts((prev) => {
      const index = prev.findIndex((item) => item.id === id);
      if (index === -1) {
        return [...prev, { id, ...next }];
      }
      const copy = [...prev];
      copy[index] = { ...copy[index], ...next };
      return copy;
    });
  };

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const applyEvent = async (event: AgentEvent) => {
    const eventMs = parseEventMs(event.ts);

    if (event.type === 'step_started') {
      upsertItem(`step:${event.stepId}`, {
        kind: 'thought',
        title: event.title,
        content: getThoughtStreamingMessage(event.stepId, locale),
        status: 'queued',
        timestamp: formatEventTime(event.ts),
        startedAtMs: eventMs,
        updatedAtMs: eventMs,
      });
      await sleep(120);
      upsertItem(`step:${event.stepId}`, {
        kind: 'thought',
        title: event.title,
        content: getThoughtStreamingMessage(event.stepId, locale),
        status: 'running',
        timestamp: formatEventTime(event.ts),
        updatedAtMs: eventMs,
      });
      await sleep(220);
    }
    if (event.type === 'step_completed') {
      upsertItem(`step:${event.stepId}`, {
        kind: 'thought',
        title: event.title,
        content: event.content ?? '',
        status: 'done',
        timestamp: formatEventTime(event.ts),
        updatedAtMs: eventMs,
      });
      await sleep(260);
    }
    if (event.type === 'thought_progress') {
      upsertItem(`step:${event.stepId}`, {
        kind: 'thought',
        title: event.title,
        content: event.content,
        status: 'streaming',
        timestamp: formatEventTime(event.ts),
        updatedAtMs: eventMs,
      });
      await sleep(140);
    }
    if (event.type === 'tool_called') {
      upsertItem(`tool:${event.tool}`, {
        kind: 'action',
        title: getToolLabel(event.tool, locale),
        content: event.input ?? '',
        status: 'queued',
        timestamp: formatEventTime(event.ts),
        startedAtMs: eventMs,
        updatedAtMs: eventMs,
      });
      await sleep(80);
      upsertItem(`tool:${event.tool}`, {
        kind: 'action',
        title: getToolLabel(event.tool, locale),
        content: event.input ?? '',
        status: 'running',
        timestamp: formatEventTime(event.ts),
        updatedAtMs: eventMs,
      });
      await sleep(240);
    }
    if (event.type === 'tool_result') {
      upsertItem(`observation:${event.tool}`, {
        kind: 'observation',
        title: getObservationTitle(event.tool, locale),
        content: event.output ?? '',
        status: 'done',
        timestamp: formatEventTime(event.ts),
        startedAtMs: eventMs,
        updatedAtMs: eventMs,
      });
      setCollapsedItemIds((prev) => (prev.includes(`observation:${event.tool}`) ? prev : [...prev, `observation:${event.tool}`]));
      upsertItem(`tool:${event.tool}`, {
        kind: 'action',
        title: getToolLabel(event.tool, locale),
        status: 'done',
        timestamp: formatEventTime(event.ts),
        updatedAtMs: eventMs,
      });
      await sleep(260);
    }
    if (event.type === 'artifact_started') {
      upsertArtifact(event.artifactId, {
        kind: event.kind,
        title: event.title,
        content: '',
        status: 'queued',
      });
      setActiveArtifactId(event.artifactId);
      setCollapsedItemIds((prev) => prev.filter((id) => id !== `artifact:${event.artifactId}`));
      upsertItem(`artifact:${event.artifactId}`, {
        kind: 'artifact',
        title: event.title,
        content: getArtifactLabel(event.kind),
        status: 'queued',
        timestamp: formatEventTime(event.ts),
        startedAtMs: eventMs,
        updatedAtMs: eventMs,
      });
      await sleep(80);
      upsertArtifact(event.artifactId, {
        kind: event.kind,
        title: event.title,
        content: '',
        status: 'running',
      });
      upsertItem(`artifact:${event.artifactId}`, {
        kind: 'artifact',
        title: event.title,
        content: getArtifactLabel(event.kind),
        status: 'running',
        timestamp: formatEventTime(event.ts),
        updatedAtMs: eventMs,
      });
      await sleep(220);
    }
    if (event.type === 'artifact_chunk') {
      setArtifacts((prev) =>
        prev.map((item) =>
          item.id === event.artifactId ? { ...item, content: item.content + event.content, status: 'streaming' } : item
        )
      );
      upsertItem(`artifact:${event.artifactId}`, {
        kind: 'artifact',
        title: artifacts.find((item) => item.id === event.artifactId)?.title ?? event.artifactId,
        content: t('aiDemo.agentArtifactGenerating'),
        status: 'streaming',
        timestamp: formatEventTime(event.ts),
        updatedAtMs: eventMs,
      });
    }
    if (event.type === 'artifact_completed') {
      upsertArtifact(event.artifactId, {
        kind: event.kind,
        title: event.title,
        content: event.content,
        status: 'done',
      });
      setArtifactVersionMap((prev) => ({
        ...prev,
        [event.artifactId]: [
          ...(prev[event.artifactId] ?? []),
          {
            versionId: `${event.artifactId}-${runIdRef.current}-${Date.now()}`,
            runId: runIdRef.current,
            title: event.title,
            kind: event.kind,
            content: event.content,
            timestamp: formatEventTime(event.ts),
          },
        ],
      }));
      setActiveArtifactId(event.artifactId);
      upsertItem(`artifact:${event.artifactId}`, {
        kind: 'artifact',
        title: event.title,
        content:
          event.kind === 'html'
            ? t('aiDemo.agentArtifactHtmlReady')
            : event.kind === 'json'
              ? t('aiDemo.agentArtifactJsonReady')
              : t('aiDemo.agentArtifactMarkdownReady'),
        status: 'done',
        timestamp: formatEventTime(event.ts),
        updatedAtMs: eventMs,
      });
      setCollapsedItemIds((prev) => (prev.includes(`artifact:${event.artifactId}`) ? prev : [...prev, `artifact:${event.artifactId}`]));
      await sleep(260);
    }
    if (event.type === 'final_answer_chunk') {
      finalAnswerRef.current += event.content;
      setFinalAnswer(finalAnswerRef.current);
      upsertItem('step:final', {
        kind: 'thought',
        title: locale === 'zh' ? '生成答案' : 'Generate answer',
        content: `${t('aiDemo.agentStreamingResponse')} ${getCharacterProgress(finalAnswerRef.current.length, locale)}`,
        status: 'streaming',
        timestamp: formatEventTime(event.ts),
        updatedAtMs: eventMs,
      });
    }
    if (event.type === 'error') {
      setError(event.error);
    }
    if (event.type === 'done') {
      setRunning(false);
    }

    const el = listRef.current;
    if (el && stickToBottomRef.current) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'auto' });
    }
  };

  const flushQueue = async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    while (eventQueueRef.current.length > 0) {
      const next = eventQueueRef.current.shift();
      if (!next) continue;
      await applyEvent(next);
    }
    processingRef.current = false;
  };

  const handleTimelineScroll = () => {
    const el = listRef.current;
    if (!el) return;
    stickToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
  };

  const runAgent = async (overrideTask?: string) => {
    const text = (overrideTask ?? task).trim();
    if (!text || running) return;

    runIdRef.current += 1;
    setTask(text);
    setRunning(true);
    setTimeline([]);
    setFinalAnswer('');
    finalAnswerRef.current = '';
    setError(null);
    setArtifacts([]);
    setActiveArtifactId(null);
    setArtifactView('preview');
    setArtifactActionMessage(null);
    setCollapsedItemIds([]);
    setSelectedHistoryVersionId(null);
    setPreviewDialogOpen(false);
    eventQueueRef.current = [];
    processingRef.current = false;
    stickToBottomRef.current = true;

    try {
      const res = await fetch('/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: text, locale }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? res.statusText);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');

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

          const event = JSON.parse(trimmed) as AgentEvent;
          eventQueueRef.current.push(event);
        }
        await flushQueue();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed');
      setRunning(false);
    }
  };

  const copyArtifactSource = async () => {
    if (!activeArtifact?.content) return;
    try {
      await navigator.clipboard.writeText(activeArtifact.content);
      setArtifactActionMessage(t('aiDemo.agentArtifactCopied'));
      window.setTimeout(() => setArtifactActionMessage(null), 1800);
    } catch {
      setArtifactActionMessage(t('aiDemo.agentErrorPrefix') + 'clipboard');
    }
  };

  const downloadArtifact = () => {
    if (!activeArtifact?.content) return;
    const blob = new Blob([activeArtifact.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = getArtifactFileName(activeArtifact);
    link.click();
    URL.revokeObjectURL(url);
    setArtifactActionMessage(t('aiDemo.agentArtifactDownloaded'));
    window.setTimeout(() => setArtifactActionMessage(null), 1800);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Link href="/ai-demo" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'mb-3 -ml-2')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          {t('aiDemo.backToDemos')}
        </Link>
        <div className="ai-hero-panel p-5 sm:p-6">
          <div className="ai-pill-badge relative z-[1]">
            <Sparkles className="h-3.5 w-3.5" />
            {t('aiDemo.agentBadge')}
          </div>
          <h1 className="relative z-[1] mt-4 flex items-center gap-2 text-2xl font-bold text-white md:text-3xl">
            <Bot className="h-8 w-8 text-cyan-400" />
            {t('aiDemo.agentPageTitle')}
          </h1>
          <p className="relative z-[1] mt-2 max-w-3xl text-sm leading-7 text-slate-300">{t('aiDemo.agentPageSubtitle')}</p>
          <div className="relative z-[1] mt-5 grid gap-3 md:grid-cols-3">
            <div className="ai-stat-card p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{t('aiDemo.agentHeroStat1Label')}</p>
              <p className="mt-2 text-sm font-medium text-white">{t('aiDemo.agentHeroStat1Value')}</p>
            </div>
            <div className="ai-stat-card p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{t('aiDemo.agentHeroStat2Label')}</p>
              <p className="mt-2 text-sm font-medium text-white">{t('aiDemo.agentHeroStat2Value')}</p>
            </div>
            <div className="ai-stat-card p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{t('aiDemo.agentHeroStat3Label')}</p>
              <p className="mt-2 text-sm font-medium text-white">{t('aiDemo.agentHeroStat3Value')}</p>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
        <div className="min-w-0 space-y-4">
          <Card className="border-cyan-500/20">
            <CardHeader className="pb-3">
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{t('aiDemo.agentHeroStat1Label')}</p>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BrainCircuit className="h-5 w-5 text-cyan-400" />
                  {t('aiDemo.agentTaskTitle')}
                </CardTitle>
                <p className="text-sm text-slate-400">{t('aiDemo.agentTaskDesc')}</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => runAgent(suggestion)}
                    className="rounded-lg border border-slate-600 bg-slate-800/70 px-3 py-1.5 text-xs text-slate-300 hover:border-cyan-500/40 hover:bg-cyan-500/10 hover:text-cyan-300"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <textarea
                  value={task}
                  onChange={(e) => setTask(e.target.value)}
                  placeholder={t('aiDemo.agentTaskPlaceholder')}
                  rows={4}
                  className="chat-list-scrollbar w-full rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-y"
                />
                <Button onClick={() => runAgent()} disabled={running} className="shrink-0 gap-2 self-stretch sm:self-end">
                  {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  {running ? t('aiDemo.agentRunning') : t('aiDemo.agentRun')}
                </Button>
              </div>

              {error && <p className="text-sm text-red-400">{t('aiDemo.agentErrorPrefix')}{error}</p>}
            </CardContent>
          </Card>

          <Card className="border-cyan-500/20">
            <CardHeader className="pb-3">
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{t('aiDemo.agentHeroStat2Label')}</p>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Search className="h-5 w-5 text-cyan-400" />
                  {t('aiDemo.agentTimelineTitle')}
                </CardTitle>
                <p className="text-sm text-slate-400">{t('aiDemo.agentTimelineDesc')}</p>
              </div>
            </CardHeader>
            <CardContent>
              <div
                ref={listRef}
                onScroll={handleTimelineScroll}
                className="chat-list-scrollbar max-h-[560px] overflow-y-auto space-y-3 pr-1 xl:max-h-[700px]"
              >
                {timeline.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-700 bg-slate-900/60 p-6 text-sm text-slate-500">
                    {t('aiDemo.agentTimelineEmpty')}
                  </div>
                ) : (
                  timeline.map((item, index) => {
                    const Icon = getItemIcon(item.kind);
                    const isRunning = item.status === 'running' || item.status === 'streaming';
                    const phaseLabel = getPhaseLabel(item.kind, locale);
                    const collapsible = (item.kind === 'observation' || item.kind === 'artifact') && Boolean(item.content);
                    const collapsed = collapsible ? isCollapsed(item.id) : false;
                    const observationData = item.kind === 'observation' ? parseObservationContent(item.content) : null;
                    const observationToolKey = item.kind === 'observation' ? getObservationToolKey(item.id) : null;
                    const elapsed = item.startedAtMs && item.updatedAtMs ? item.updatedAtMs - item.startedAtMs : undefined;

                    return (
                      <div key={item.id} className="relative pl-6">
                        {index !== timeline.length - 1 && (
                          <div className="absolute left-[11px] top-8 bottom-[-12px] w-px bg-slate-700" />
                        )}
                        <div
                          className={cn(
                            'absolute left-0 top-5 h-6 w-6 rounded-full border flex items-center justify-center',
                            item.status === 'streaming'
                              ? 'border-sky-400/60 bg-sky-500/15 shadow-[0_0_16px_rgba(56,189,248,0.25)]'
                              : isRunning
                              ? 'border-cyan-400/60 bg-cyan-500/15 shadow-[0_0_16px_rgba(34,211,238,0.25)]'
                              : item.kind === 'artifact'
                                ? 'border-fuchsia-400/30 bg-fuchsia-500/10'
                                : item.kind === 'observation'
                                  ? 'border-violet-400/30 bg-violet-500/10'
                                  : item.kind === 'action'
                                    ? 'border-amber-400/30 bg-amber-500/10'
                                    : 'border-emerald-400/30 bg-emerald-500/10'
                          )}
                        >
                          {isRunning ? (
                            <Loader2
                              className={cn(
                                'h-3.5 w-3.5 animate-spin',
                                item.status === 'streaming' ? 'text-sky-300' : 'text-cyan-300'
                              )}
                            />
                          ) : (
                            <Icon
                              className={cn(
                                'h-3.5 w-3.5',
                                item.kind === 'artifact'
                                  ? 'text-fuchsia-300'
                                  : item.kind === 'observation'
                                    ? 'text-violet-300'
                                    : item.kind === 'action'
                                      ? 'text-amber-300'
                                      : 'text-emerald-300'
                              )}
                            />
                          )}
                        </div>
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                            'rounded-lg border bg-slate-900/70 p-4 transition-all',
                            item.status === 'streaming'
                              ? 'border-sky-500/30 shadow-[0_0_0_1px_rgba(56,189,248,0.08)]'
                              : isRunning
                              ? 'border-cyan-500/30 shadow-[0_0_0_1px_rgba(34,211,238,0.08)]'
                              : 'border-slate-700'
                          )}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={cn(
                                  'rounded-full px-2 py-0.5 text-[11px] uppercase tracking-[0.14em]',
                                  item.kind === 'artifact'
                                    ? 'bg-fuchsia-500/10 text-fuchsia-300'
                                    : item.kind === 'observation'
                                      ? 'bg-violet-500/10 text-violet-300'
                                      : item.kind === 'action'
                                        ? 'bg-amber-500/10 text-amber-300'
                                        : 'bg-emerald-500/10 text-emerald-300'
                                )}
                              >
                                {phaseLabel}
                              </span>
                              <Icon
                                className={cn(
                                  'h-4 w-4',
                                  item.status === 'streaming'
                                    ? 'text-sky-300'
                                    : isRunning
                                    ? 'text-cyan-300'
                                    : item.kind === 'artifact'
                                      ? 'text-fuchsia-300'
                                      : item.kind === 'observation'
                                        ? 'text-violet-300'
                                        : item.kind === 'action'
                                          ? 'text-amber-300'
                                          : 'text-cyan-400'
                                )}
                              />
                              <p className="text-sm font-medium text-white">{item.title}</p>
                              {isRunning && (
                                <span className="agent-live-dots text-cyan-300" aria-hidden="true">
                                  <span />
                                  <span />
                                  <span />
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {item.timestamp && <span className="text-[11px] text-slate-500">{item.timestamp}</span>}
                              {elapsed ? (
                                <span className="rounded-full border border-slate-700 bg-slate-900/70 px-2 py-0.5 text-[11px] text-slate-400">
                                  {formatDuration(elapsed, locale)}
                                </span>
                              ) : null}
                              {collapsible && (
                                <button
                                  type="button"
                                  onClick={() => toggleCollapsed(item.id)}
                                  className="inline-flex items-center rounded-md border border-slate-700 bg-slate-900/70 px-1.5 py-1 text-slate-400 transition-colors hover:text-slate-200"
                                  aria-label={collapsed ? t('aiDemo.agentExpand') : t('aiDemo.agentCollapse')}
                                >
                                  {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                </button>
                              )}
                              <span
                                className={cn(
                                  'rounded-full px-2 py-0.5 text-xs',
                                  item.status === 'queued'
                                    ? 'bg-slate-700/80 text-slate-300'
                                    : item.status === 'streaming'
                                      ? 'bg-sky-500/10 text-sky-300'
                                      : isRunning
                                        ? 'bg-cyan-500/10 text-cyan-300'
                                        : 'bg-emerald-500/10 text-emerald-300'
                                )}
                              >
                                {getStatusLabel(item.status, t)}
                              </span>
                            </div>
                          </div>
                          {item.content && !collapsed && item.kind !== 'observation' && (
                            <div
                              className={cn(
                                'mt-3 rounded-md p-3 text-xs whitespace-pre-wrap',
                                item.status === 'streaming'
                                  ? 'bg-slate-800/90 text-sky-100 agent-panel-loading'
                                  : isRunning
                                    ? 'bg-slate-800/90 text-slate-300 agent-panel-loading'
                                  : 'bg-slate-800/80 text-slate-300'
                              )}
                            >
                              {item.content}
                            </div>
                          )}
                          {item.kind === 'observation' && item.content && !collapsed && (
                            <div className="mt-3 space-y-3">
                              {observationToolKey === 'artifact_strategy' && observationData && (
                                <div className="space-y-3">
                                  {observationData.pairs.length > 0 && (
                                    <div className="grid gap-2 sm:grid-cols-2">
                                      {observationData.pairs.map((pair, pairIndex) => (
                                        <div
                                          key={`${item.id}-pair-${pairIndex}`}
                                          className="rounded-lg border border-cyan-500/15 bg-cyan-500/5 p-3"
                                        >
                                          <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-300/80">{pair.key}</p>
                                          <p className="mt-2 text-xs text-slate-200 whitespace-pre-wrap">{pair.value}</p>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {observationData.bullets.length > 0 && (
                                    <div className="rounded-lg border border-slate-700 bg-slate-800/75 p-3">
                                      <p className="mb-3 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                                        {locale === 'zh' ? '策略要点' : 'Strategy notes'}
                                      </p>
                                      <div className="space-y-2">
                                        {observationData.bullets.map((bullet, bulletIndex) => (
                                          <div key={`${item.id}-bullet-${bulletIndex}`} className="flex items-start gap-2 text-xs text-slate-300">
                                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-cyan-300" />
                                            <span className="whitespace-pre-wrap">{bullet}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                              {observationToolKey === 'implementation_checklist' && observationData && (
                                <div className="rounded-lg border border-amber-500/15 bg-amber-500/5 p-3">
                                  <p className="mb-3 text-[11px] uppercase tracking-[0.14em] text-amber-300/80">
                                    {locale === 'zh' ? '执行清单' : 'Execution checklist'}
                                  </p>
                                  <div className="space-y-2">
                                    {[...observationData.bullets, ...observationData.pairs.map((pair) => `${pair.key}: ${pair.value}`)].map(
                                      (bullet, bulletIndex) => (
                                        <div
                                          key={`${item.id}-check-${bulletIndex}`}
                                          className="flex items-start gap-3 rounded-md border border-slate-800 bg-slate-900/60 px-3 py-2"
                                        >
                                          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500/15 px-1 text-[11px] text-amber-300">
                                            {bulletIndex + 1}
                                          </span>
                                          <span className="pt-0.5 text-xs text-slate-200 whitespace-pre-wrap">{bullet}</span>
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}
                              {observationToolKey === 'knowledge_search' && observationData && (
                                <div className="space-y-3">
                                  <div className="rounded-lg border border-violet-500/15 bg-violet-500/5 p-3">
                                    <p className="mb-3 text-[11px] uppercase tracking-[0.14em] text-violet-300/80">
                                      {locale === 'zh' ? '匹配结果' : 'Matched context'}
                                    </p>
                                    <div className="space-y-2">
                                      {[...observationData.bullets, ...observationData.pairs.map((pair) => `${pair.key}: ${pair.value}`)].map(
                                        (bullet, bulletIndex) => (
                                          <div key={`${item.id}-match-${bulletIndex}`} className="rounded-md border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-200 whitespace-pre-wrap">
                                            {bullet}
                                          </div>
                                        )
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                              {!observationToolKey && observationData && observationData.pairs.length > 0 && (
                                <div className="grid gap-2 sm:grid-cols-2">
                                  {observationData.pairs.map((pair, pairIndex) => (
                                    <div
                                      key={`${item.id}-pair-${pairIndex}`}
                                      className="rounded-md border border-violet-500/15 bg-slate-800/80 p-3"
                                    >
                                      <p className="text-[11px] uppercase tracking-[0.14em] text-violet-300/80">{pair.key}</p>
                                      <p className="mt-2 text-xs text-slate-200 whitespace-pre-wrap">{pair.value}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {!observationToolKey && observationData && observationData.bullets.length > 0 && (
                                <div className="rounded-md border border-slate-700 bg-slate-800/75 p-3">
                                  <div className="space-y-2">
                                    {observationData.bullets.map((bullet, bulletIndex) => (
                                      <div key={`${item.id}-bullet-${bulletIndex}`} className="flex items-start gap-2 text-xs text-slate-300">
                                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-violet-300" />
                                        <span className="whitespace-pre-wrap">{bullet}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </motion.div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="min-w-0 space-y-4">
          <Card className="border-cyan-500/20">
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-3 min-w-0">
                  <div className="min-w-0 space-y-2">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{t('aiDemo.agentHeroStat3Label')}</p>
                    <CardTitle className="flex min-w-0 items-center gap-2 text-base">
                      <FileCode2 className="h-5 w-5 text-cyan-400" />
                      <span className="truncate">{activeArtifact?.title || t('aiDemo.agentArtifactTitle')}</span>
                    </CardTitle>
                    <p className="text-sm text-slate-400">{t('aiDemo.agentArtifactDesc')}</p>
                  </div>
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                {activeArtifact && activeArtifact.status !== 'done' && (
                      <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-xs text-cyan-300">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    {activeArtifact.status === 'queued'
                      ? t('aiDemo.agentStatusQueued')
                      : activeArtifact.status === 'streaming'
                        ? t('aiDemo.agentStatusStreaming')
                        : t('aiDemo.agentStatusRunning')}
                      </div>
                    )}
                    <div className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900/80 p-1">
                      <button
                        type="button"
                        onClick={() => setArtifactView('preview')}
                        className={cn(
                          'flex items-center gap-1 rounded-md px-2.5 py-1 text-xs transition-colors',
                          artifactView === 'preview' ? 'bg-cyan-500/15 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
                        )}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        {t('aiDemo.agentPreviewTab')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setArtifactView('source')}
                        className={cn(
                          'flex items-center gap-1 rounded-md px-2.5 py-1 text-xs transition-colors',
                          artifactView === 'source' ? 'bg-cyan-500/15 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
                        )}
                      >
                        <Code2 className="h-3.5 w-3.5" />
                        {t('aiDemo.agentSourceTab')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setArtifactView('metadata')}
                        className={cn(
                          'flex items-center gap-1 rounded-md px-2.5 py-1 text-xs transition-colors',
                          artifactView === 'metadata' ? 'bg-cyan-500/15 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
                        )}
                      >
                        <Search className="h-3.5 w-3.5" />
                        {t('aiDemo.agentMetadataTab')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setArtifactView('diff')}
                        className={cn(
                          'flex items-center gap-1 rounded-md px-2.5 py-1 text-xs transition-colors',
                          artifactView === 'diff' ? 'bg-cyan-500/15 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
                        )}
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        {t('aiDemo.agentDiffTab')}
                      </button>
                    </div>
                  </div>
                </div>
                {artifacts.length > 0 && (
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    {artifacts.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveArtifactId(item.id)}
                        className={cn(
                          'rounded-full border px-3 py-1 text-xs transition-colors',
                          item.id === activeArtifact?.id
                            ? 'border-cyan-400/40 bg-cyan-500/10 text-cyan-300'
                            : 'border-slate-700 bg-slate-900/70 text-slate-400 hover:text-slate-200'
                        )}
                      >
                        {item.title} · {getArtifactLabel(item.kind)}
                      </button>
                    ))}
                  </div>
                )}
                {activeArtifactVersions.length > 0 && (
                  <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{t('aiDemo.agentHistoryTitle')}</p>
                      <span className="text-[11px] text-slate-500">{activeArtifactVersions.length} {t('aiDemo.agentMetadataVersions')}</span>
                    </div>
                    <div className="chat-list-scrollbar max-h-28 space-y-2 overflow-y-auto pr-1">
                      {[...activeArtifactVersions].reverse().map((version, versionIndex) => {
                        const isLatest = versionIndex === 0;
                        const isSelected = selectedHistoryVersionId
                          ? selectedHistoryVersionId === version.versionId
                          : !isLatest && version.versionId === selectedHistoryVersion?.versionId;

                        return (
                          <button
                            key={version.versionId}
                            type="button"
                            onClick={() => setSelectedHistoryVersionId(version.versionId)}
                            className={cn(
                              'flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-xs transition-colors',
                              isSelected
                                ? 'border-cyan-400/30 bg-cyan-500/10 text-cyan-200'
                                : 'border-slate-800 bg-slate-900/70 text-slate-300 hover:border-slate-700'
                            )}
                          >
                            <span>Run {version.runId}</span>
                            <span className="text-[11px] text-slate-500">
                              {isLatest ? t('aiDemo.agentHistoryLatest') : version.timestamp || '--'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-slate-500">
                    {artifactActionMessage || (artifacts.length > 0 ? `${artifacts.length} ${t('aiDemo.agentArtifactCountSuffix')}` : '')}
                  </div>
                  {activeArtifact && (
                    <div className="flex items-center gap-2">
                      {artifactView === 'preview' && activeArtifact.kind === 'html' && activeArtifact.content && (
                        <button
                          type="button"
                          onClick={() => setPreviewDialogOpen(true)}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-900/70 px-2.5 py-1.5 text-xs text-slate-300 transition-colors hover:border-cyan-500/40 hover:text-cyan-300"
                        >
                          <Maximize2 className="h-3.5 w-3.5" />
                          {t('aiDemo.agentPreviewFullscreen')}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={copyArtifactSource}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-900/70 px-2.5 py-1.5 text-xs text-slate-300 transition-colors hover:border-cyan-500/40 hover:text-cyan-300"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        {t('aiDemo.agentArtifactCopy')}
                      </button>
                      <button
                        type="button"
                        onClick={downloadArtifact}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-900/70 px-2.5 py-1.5 text-xs text-slate-300 transition-colors hover:border-cyan-500/40 hover:text-cyan-300"
                      >
                        <Download className="h-3.5 w-3.5" />
                        {t('aiDemo.agentArtifactDownload')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!activeArtifact ? (
                <div className="flex min-h-[520px] items-center justify-center rounded-lg border border-dashed border-slate-700 bg-slate-900/60 p-6 text-sm text-slate-500">
                  {t('aiDemo.agentArtifactEmpty')}
                </div>
              ) : artifactView === 'metadata' ? (
                <div className="chat-list-scrollbar min-h-[520px] max-h-[520px] overflow-auto rounded-lg border border-slate-700 bg-slate-950/70 p-4">
                  {activeArtifactMetadata ? (
                    <div className="space-y-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3">
                          <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{t('aiDemo.agentMetadataType')}</p>
                          <p className="mt-2 text-sm text-slate-200">{activeArtifactMetadata.kind}</p>
                        </div>
                        <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3">
                          <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{t('aiDemo.agentMetadataStatus')}</p>
                          <p className="mt-2 text-sm text-slate-200">{getStatusLabel(activeArtifactMetadata.status, t)}</p>
                        </div>
                        <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3">
                          <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{t('aiDemo.agentMetadataFileName')}</p>
                          <p className="mt-2 break-all text-sm text-slate-200">{activeArtifactMetadata.fileName}</p>
                        </div>
                        <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3">
                          <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{t('aiDemo.agentMetadataPreview')}</p>
                          <p className="mt-2 text-sm text-slate-200">
                            {activeArtifactMetadata.hasPreview ? t('aiDemo.agentMetadataPreviewYes') : t('aiDemo.agentMetadataPreviewNo')}
                          </p>
                        </div>
                        <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3">
                          <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{t('aiDemo.agentMetadataChars')}</p>
                          <p className="mt-2 text-sm text-slate-200">{activeArtifactMetadata.chars}</p>
                        </div>
                        <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3">
                          <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{t('aiDemo.agentMetadataLines')}</p>
                          <p className="mt-2 text-sm text-slate-200">{activeArtifactMetadata.lines}</p>
                        </div>
                        <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3">
                          <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{t('aiDemo.agentMetadataVersions')}</p>
                          <p className="mt-2 text-sm text-slate-200">{activeArtifactMetadata.versions}</p>
                        </div>
                        <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3">
                          <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{t('aiDemo.agentMetadataLatestVersion')}</p>
                          <p className="mt-2 text-sm text-slate-200">
                            {activeArtifactMetadata.latestVersion
                              ? `Run ${activeArtifactMetadata.latestVersion.runId} · ${activeArtifactMetadata.latestVersion.timestamp || '--'}`
                              : '--'}
                          </p>
                        </div>
                      </div>
                      <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-4">
                        <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{t('aiDemo.agentMetadataJsonKeys')}</p>
                        {activeArtifactMetadata.jsonKeys.length > 0 ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {activeArtifactMetadata.jsonKeys.map((key) => (
                              <span
                                key={key}
                                className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-xs text-cyan-200"
                              >
                                {key}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-3 text-sm text-slate-400">{t('aiDemo.agentMetadataJsonKeysEmpty')}</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex min-h-[520px] items-center justify-center text-sm text-slate-500">
                      {t('aiDemo.agentArtifactEmpty')}
                    </div>
                  )}
                </div>
              ) : artifactView === 'diff' ? (
                <div className="min-h-[520px]">
                  {activeArtifactVersions.length < 2 ? (
                    <div className="flex min-h-[520px] items-center justify-center rounded-lg border border-slate-700 bg-slate-950/80 text-sm text-slate-500">
                      {t('aiDemo.agentDiffEmpty')}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                        <span className="rounded-full border border-slate-700 bg-slate-900/80 px-2 py-1">
                          {t('aiDemo.agentDiffFrom')} Run {selectedHistoryVersion?.runId ?? '--'}
                        </span>
                        <span className="rounded-full border border-slate-700 bg-slate-900/80 px-2 py-1">
                          {t('aiDemo.agentDiffTo')} Run {activeArtifactVersions[activeArtifactVersions.length - 1]?.runId}
                        </span>
                      </div>
                      {activeArtifactDiff ? (
                        <HighlightedCodeBlock
                          code={activeArtifactDiff}
                          language="diff"
                          expandLabel={t('aiDemo.agentExpand')}
                          collapseLabel={t('aiDemo.agentCollapse')}
                          maxHeightClass="max-h-[420px]"
                        />
                      ) : (
                        <div className="flex min-h-[320px] items-center justify-center rounded-lg border border-slate-800 bg-slate-900/75 text-sm text-slate-500">
                          {t('aiDemo.agentDiffNoChanges')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : artifactView === 'source' ? (
                activeArtifact.content ? (
                  <HighlightedCodeBlock
                    code={activeArtifact.content}
                    language={activeArtifact.kind}
                    expandLabel={t('aiDemo.agentExpand')}
                    collapseLabel={t('aiDemo.agentCollapse')}
                    maxHeightClass="max-h-[520px]"
                  />
                ) : (
                  <div className="flex min-h-[520px] items-center justify-center rounded-lg border border-slate-700 bg-slate-900/60 p-6 text-sm text-slate-500">
                    {t('aiDemo.agentArtifactGenerating')}
                  </div>
                )
              ) : artifactView === 'preview' && activeArtifact.kind === 'html' ? (
                activeArtifact.content ? (
                  <div className="overflow-hidden rounded-lg border border-slate-700 bg-white">
                    <iframe
                      title={activeArtifact.title}
                      srcDoc={activeArtifact.content}
                      className="h-[520px] w-full"
                      sandbox="allow-scripts"
                    />
                  </div>
                ) : (
                  <div className="agent-artifact-skeleton flex min-h-[520px] flex-col gap-4 rounded-lg border border-slate-700 bg-white p-6">
                    <div className="h-8 w-1/3 rounded-md bg-slate-200" />
                    <div className="h-12 w-full rounded-md bg-slate-100" />
                    <div className="grid grid-cols-2 gap-4">
                      <div className="h-40 rounded-xl bg-slate-100" />
                      <div className="h-40 rounded-xl bg-slate-100" />
                    </div>
                    <div className="h-10 w-full rounded-md bg-slate-100" />
                    <div className="h-10 w-3/4 rounded-md bg-slate-100" />
                  </div>
                )
              ) : artifactView === 'preview' && activeArtifact.kind === 'json' ? (
                activeArtifact.content ? (
                  <HighlightedCodeBlock
                    code={activeArtifact.content}
                    language="json"
                    expandLabel={t('aiDemo.agentExpand')}
                    collapseLabel={t('aiDemo.agentCollapse')}
                    maxHeightClass="max-h-[520px]"
                  />
                ) : (
                  <div className="flex min-h-[520px] items-center justify-center rounded-lg border border-slate-700 bg-slate-950/80 p-6 text-sm text-slate-400 agent-panel-loading">
                    {t('aiDemo.agentArtifactGenerating')}
                  </div>
                )
              ) : artifactView === 'preview' && activeArtifact.kind === 'markdown' ? (
                activeArtifact.content ? (
                  <RichContentRenderer
                    content={activeArtifact.content}
                    fallbackLanguage="markdown"
                    expandLabel={t('aiDemo.agentExpand')}
                    collapseLabel={t('aiDemo.agentCollapse')}
                    textClassName="text-sm text-slate-200 whitespace-pre-wrap break-words leading-7"
                  />
                ) : (
                  <div className="flex min-h-[520px] items-center justify-center rounded-lg border border-slate-700 bg-slate-900/80 p-6 text-sm text-slate-400 agent-panel-loading">
                    {t('aiDemo.agentArtifactGenerating')}
                  </div>
                )
              ) : (
                <div className="flex min-h-[520px] items-center justify-center rounded-lg border border-slate-700 bg-slate-900/60 p-6 text-sm text-slate-500">
                  {t('aiDemo.agentArtifactEmpty')}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-cyan-500/20">
            <CardHeader className="pb-3">
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{t('aiDemo.agentFinalEyebrow')}</p>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-5 w-5 text-cyan-400" />
                  {t('aiDemo.agentFinalTitle')}
                </CardTitle>
                <p className="text-sm text-slate-400">{t('aiDemo.agentFinalDesc')}</p>
              </div>
            </CardHeader>
            <CardContent>
              {finalAnswer ? (
                <RichContentRenderer
                  content={finalAnswer}
                  fallbackLanguage="text"
                  expandLabel={t('aiDemo.agentExpand')}
                  collapseLabel={t('aiDemo.agentCollapse')}
                />
              ) : (
                <div
                  className={cn(
                    'min-h-[180px] rounded-lg border border-slate-700 bg-slate-900/70 p-4 text-sm text-slate-200 whitespace-pre-wrap',
                    running && 'agent-panel-loading'
                  )}
                >
                  {t('aiDemo.agentFinalEmpty')}
                </div>
              )}
              {running && (
                <div className="mt-3 flex items-center gap-2 text-xs text-cyan-300">
                  <span className="agent-live-dots" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </span>
                  {t('aiDemo.agentStreamingResponse')}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Dialog
        open={previewDialogOpen}
        onOpenChange={setPreviewDialogOpen}
        title={activeArtifact?.title || t('aiDemo.agentArtifactTitle')}
        className="max-w-[92vw] h-[90vh]"
      >
        {activeArtifact?.kind === 'html' && activeArtifact.content ? (
          <div className="h-full overflow-hidden rounded-lg border border-slate-700 bg-white">
            <iframe
              title={`${activeArtifact.title}-fullscreen`}
              srcDoc={activeArtifact.content}
              className="h-[calc(90vh-7rem)] w-full"
              sandbox="allow-scripts"
            />
          </div>
        ) : (
          <div className="flex min-h-[60vh] items-center justify-center text-sm text-slate-400">
            {t('aiDemo.agentArtifactEmpty')}
          </div>
        )}
      </Dialog>
    </div>
  );
}
