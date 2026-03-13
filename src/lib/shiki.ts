/**
 * Shiki-based code highlighting (same engine as VS Code).
 * Highlighter is created lazily and cached for reuse.
 */

export type ShikiHighlighter = {
  codeToHtml: (code: string, options: { lang: string; theme?: string; transformers?: unknown[] }) => string;
};

let highlighterPromise: Promise<ShikiHighlighter> | null = null;

const SHIKI_LANGS = [
  'html',
  'json',
  'markdown',
  'md',
  'typescript',
  'ts',
  'javascript',
  'js',
  'diff',
  'plaintext',
] as const;

/** Map our language identifiers to Shiki's lang ids */
export function mapToShikiLang(lang: string): string {
  const n = lang.toLowerCase();
  if (n === 'typescript' || n === 'ts') return 'typescript';
  if (n === 'javascript' || n === 'js') return 'javascript';
  if (n === 'markdown' || n === 'md') return 'markdown';
  if (n === 'html' || n === 'json' || n === 'diff') return n;
  if (n === 'text' || n === 'plain') return 'plaintext';
  return n || 'plaintext';
}

/** Transformer: add data-line and class to each line for gutter styling */
export function createLineNumberTransformer(): unknown {
  return {
    name: 'line-number',
    line(node: { properties?: Record<string, unknown> }, line: number) {
      if (node.properties) {
        node.properties['data-line'] = String(line);
        const prev = (node.properties.className as string[]) || [];
        node.properties.className = [...prev, 'shiki-line'];
      }
    },
  };
}

export function getHighlighter(): Promise<ShikiHighlighter> {
  if (highlighterPromise) return highlighterPromise;
  highlighterPromise = (async () => {
    const { createHighlighter } = await import('shiki');
    const highlighter = await createHighlighter({
      themes: ['github-dark'],
      langs: [...SHIKI_LANGS],
    });
    return highlighter as unknown as ShikiHighlighter;
  })();
  return highlighterPromise;
}
