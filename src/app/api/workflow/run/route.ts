import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getResumeSummaryForAI } from '@/data/resume';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? '' });

type NodePayload = { id: string; data: { type: string; content?: string; systemPrompt?: string } };
type EdgePayload = { source: string; target: string };

function topologicalSort(nodeIds: string[], edges: EdgePayload[]): string[] {
  const inDegree: Record<string, number> = {};
  const outEdges: Record<string, string[]> = {};
  for (const id of nodeIds) {
    inDegree[id] = 0;
    outEdges[id] = [];
  }
  for (const e of edges) {
    if (!nodeIds.includes(e.source) || !nodeIds.includes(e.target)) continue;
    inDegree[e.target]++;
    outEdges[e.source].push(e.target);
  }
  const queue = nodeIds.filter((id) => inDegree[id] === 0);
  const order: string[] = [];
  while (queue.length) {
    const u = queue.shift()!;
    order.push(u);
    for (const v of outEdges[u]) {
      inDegree[v]--;
      if (inDegree[v] === 0) queue.push(v);
    }
  }
  return order.length === nodeIds.length ? order : nodeIds;
}

function getInputForNode(
  nodeId: string,
  edges: EdgePayload[],
  outputs: Record<string, string>
): string {
  const inputs = edges.filter((e) => e.target === nodeId).map((e) => outputs[e.source]);
  return inputs.filter(Boolean).join('\n\n') || '';
}

function applyTemplate(template: string | undefined, input: string): string {
  if (!template?.trim()) return input;
  return template.includes('{{input}}')
    ? template.replaceAll('{{input}}', input)
    : `${template.trim()}\n\n${input}`.trim();
}

function getQueryKeywords(query: string): string[] {
  const cn = query.match(/[\u4e00-\u9fa5]{2,}/g) ?? [];
  const en = query.toLowerCase().match(/[a-z]{3,}/g) ?? [];
  return Array.from(new Set([...cn, ...en])).slice(0, 8);
}

function getRelevantKnowledge(context: string, query: string, locale: 'zh' | 'en'): string {
  const lines = context
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const keywords = getQueryKeywords(query);

  if (keywords.length === 0) {
    return lines.slice(0, 8).join('\n');
  }

  const scored = lines
    .map((line) => ({
      line,
      score: keywords.reduce(
        (sum, kw) => sum + (line.toLowerCase().includes(kw.toLowerCase()) ? 1 : 0),
        0
      ),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((item) => item.line);

  if (scored.length > 0) return scored.join('\n');

  return locale === 'zh'
    ? `未命中明显关键词，返回简历摘要。\n${lines.slice(0, 8).join('\n')}`
    : `No strong keyword match found. Returning resume summary.\n${lines.slice(0, 8).join('\n')}`;
}

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'OPENAI_API_KEY 未配置' },
      { status: 503 }
    );
  }

  try {
    const body = (await req.json()) as {
      nodes: NodePayload[];
      edges: EdgePayload[];
      input: string;
      locale?: 'zh' | 'en';
    };
    const { nodes: rawNodes, edges, input: userInput = '', locale = 'zh' } = body;
    if (!Array.isArray(rawNodes) || !Array.isArray(edges)) {
      return NextResponse.json({ error: 'nodes 和 edges 必填' }, { status: 400 });
    }

    const nodeMap = new Map<string, NodePayload>();
    for (const n of rawNodes) {
      if (!n?.id) continue;
      const d = n?.data && typeof n.data === 'object' ? (n.data as { type?: string; content?: string; systemPrompt?: string }) : {};
      const type = d.type || 'prompt';
      const content = typeof d.content === 'string' ? d.content : undefined;
      const systemPrompt = typeof d.systemPrompt === 'string' ? d.systemPrompt : undefined;
      nodeMap.set(n.id, { id: n.id, data: { type, content, systemPrompt } });
    }
    const nodeIds = Array.from(nodeMap.keys());
    const order = topologicalSort(nodeIds, edges);

    const outputs: Record<string, string> = {};
    const steps: { nodeId: string; type: string; result: string }[] = [];
    const resumeContext = getResumeSummaryForAI(locale);

    for (const nodeId of order) {
      const node = nodeMap.get(nodeId);
      if (!node) continue;
      const type = (node.data.type || 'prompt') as string;
      const nodeContent = node.data.content?.trim();
      const nodeSystemPrompt = node.data.systemPrompt?.trim();
      const input = getInputForNode(nodeId, edges, outputs) || userInput;

      let result = '';
      switch (type) {
        case 'prompt':
          result = applyTemplate(nodeContent, input || userInput) || '(空)';
          break;
        case 'llm': {
          const userMsg =
            applyTemplate(nodeContent, input.trim() || userInput) ||
            (locale === 'zh' ? '请简单介绍一下你自己。' : 'Introduce yourself briefly.');
          const systemMsg =
            nodeSystemPrompt ||
            (locale === 'zh'
              ? '你是一个简洁的助手。请优先依据提供的上下文与问题作答，避免直接复述原始材料。'
              : 'You are a concise assistant. Use the provided context to answer the question, and avoid dumping raw source material.');
          const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemMsg },
              { role: 'user', content: userMsg },
            ],
            max_tokens: 512,
            temperature: 0.5,
          });
          result = completion.choices[0]?.message?.content?.trim() ?? '';
          break;
        }
        case 'knowledge': {
          const query = input.trim() || userInput.trim();
          const snippet = nodeContent || getRelevantKnowledge(resumeContext, query, locale);
          result = locale === 'zh'
            ? `[知识库检索]\n问题：${query || '未提供'}\n相关知识：\n${snippet}`
            : `[Knowledge]\nQuestion: ${query || 'N/A'}\nRelevant context:\n${snippet}`;
          break;
        }
        case 'tool':
          result = nodeContent ? (locale === 'zh' ? `[工具] ${nodeContent}` : `[Tool] ${nodeContent}`) : (locale === 'zh' ? '[工具已执行]' : '[Tool executed]');
          break;
        case 'output':
          result = input || userInput || '(无输入)';
          break;
        default:
          result = input || '(pass through)';
      }

      outputs[nodeId] = result;
      steps.push({ nodeId, type, result: result.slice(0, 500) + (result.length > 500 ? '...' : '') });
    }

    const outputNodeIds = order.filter((id) => (nodeMap.get(id)?.data?.type ?? '') === 'output');
    const finalOutput = outputNodeIds.length > 0
      ? outputNodeIds.map((id) => outputs[id]).join('\n\n')
      : outputs[order[order.length - 1]] ?? '';

    return NextResponse.json({
      output: finalOutput,
      steps,
    });
  } catch (e) {
    console.error('[api/workflow/run]', e);
    const message = e instanceof Error ? e.message : 'Request failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
