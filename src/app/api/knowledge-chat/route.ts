import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { searchKnowledgeBase, type Locale } from '@/data/knowledge-demo';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? '' });

type ChatMessage = {
  role: string;
  content: string;
};

type RAGConfig = {
  topK?: number;
  rewriteEnabled?: boolean;
  rerankEnabled?: boolean;
  groundedMode?: boolean;
};

type TraceStage = {
  id: 'rewrite' | 'recall' | 'rerank' | 'answer';
  title: string;
  summary: string;
  items: string[];
};

function extractKeywords(query: string) {
  const zh = query.match(/[\u4e00-\u9fa5]{2,}/g) ?? [];
  const en = query.toLowerCase().match(/[a-z]{3,}/g) ?? [];
  return Array.from(new Set([...zh, ...en])).slice(0, 6);
}

function rewriteQuery(query: string) {
  return query.replace(/[？?！!，,。；;：:]/g, ' ').replace(/\s+/g, ' ').trim();
}

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'OPENAI_API_KEY 未配置，请在 .env.local 中设置' },
      { status: 503 }
    );
  }

  try {
    const body = (await req.json()) as {
      messages: ChatMessage[];
      locale?: Locale;
      config?: RAGConfig;
    };
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const locale = body.locale === 'en' ? 'en' : 'zh';
    const topK = Math.min(6, Math.max(2, Math.round(body.config?.topK ?? 4)));
    const rewriteEnabled = body.config?.rewriteEnabled ?? true;
    const rerankEnabled = body.config?.rerankEnabled ?? true;
    const groundedMode = body.config?.groundedMode ?? true;

    if (messages.length === 0) {
      return NextResponse.json({ error: locale === 'en' ? 'messages is required' : 'messages 不能为空' }, { status: 400 });
    }

    const latestUserMessage = [...messages].reverse().find((message) => message.role === 'user')?.content?.trim();
    if (!latestUserMessage) {
      return NextResponse.json(
        { error: locale === 'en' ? 'A user message is required' : '至少需要一条用户消息' },
        { status: 400 }
      );
    }

    const rewrittenQuery = rewriteEnabled ? rewriteQuery(latestUserMessage) : latestUserMessage;
    const keywords = extractKeywords(rewrittenQuery);
    const recallCandidates = searchKnowledgeBase(rewrittenQuery, locale, rerankEnabled ? Math.max(topK + 2, topK) : topK);
    const sources = rerankEnabled ? recallCandidates.slice(0, topK) : recallCandidates.slice(0, topK);
    const stages: TraceStage[] =
      locale === 'en'
        ? [
            {
              id: 'rewrite',
              title: 'Query Rewrite',
              summary: rewriteEnabled
                ? 'Normalize the user question into a cleaner retrieval intent.'
                : 'Use the original user question directly without rewrite.',
              items: [
                `Original: ${latestUserMessage}`,
                `Rewritten: ${rewrittenQuery}`,
                `Keywords: ${keywords.join(', ') || 'No strong keywords extracted'}`,
              ],
            },
            {
              id: 'recall',
              title: 'Recall',
              summary: `Run lightweight keyword + semantic-style matching against the knowledge base with topK=${topK}.`,
              items:
                recallCandidates.length > 0
                  ? recallCandidates.map((source, index) => `Candidate ${index + 1}: ${source.title} (${source.score})`)
                  : ['No recall candidates were found for this turn.'],
            },
            {
              id: 'rerank',
              title: 'Rerank',
              summary: rerankEnabled
                ? 'Keep the most relevant grounded sources for answer generation.'
                : 'Skip rerank and use recalled sources directly.',
              items:
                sources.length > 0
                  ? sources.map((source, index) => `Selected S${index + 1}: ${source.title} (${source.score})`)
                  : ['No sources were selected after reranking.'],
            },
            {
              id: 'answer',
              title: 'Grounded Answer',
              summary: groundedMode
                ? 'Generate a concise answer and attach citations such as [S1] and [S2].'
                : 'Generate a more flexible answer while still preferring retrieved context.',
              items: [
                `Answering mode: ${groundedMode ? 'grounded' : 'flexible'}`,
                `Evidence count: ${sources.length}`,
                groundedMode
                  ? 'If evidence is insufficient, the assistant should explicitly say so.'
                  : 'The assistant may answer more openly, but should still prioritize retrieved evidence.',
              ],
            },
          ]
        : [
            {
              id: 'rewrite',
              title: 'Query 改写',
              summary: rewriteEnabled
                ? '把用户问题整理成更利于检索的意图表达。'
                : '直接使用用户原始问题，不做改写。',
              items: [
                `原始问题：${latestUserMessage}`,
                `改写结果：${rewrittenQuery}`,
                `关键词：${keywords.join('、') || '未提取到明显关键词'}`,
              ],
            },
            {
              id: 'recall',
              title: 'Recall 召回',
              summary: `基于关键词与语义相似度做第一轮候选文档召回，topK=${topK}。`,
              items:
                recallCandidates.length > 0
                  ? recallCandidates.map((source, index) => `候选 ${index + 1}：${source.title}（${source.score}）`)
                  : ['当前轮次没有召回到候选文档。'],
            },
            {
              id: 'rerank',
              title: 'Rerank 重排',
              summary: rerankEnabled
                ? '挑出最相关的来源片段，作为最终回答依据。'
                : '跳过重排，直接使用召回结果回答。',
              items:
                sources.length > 0
                  ? sources.map((source, index) => `保留 S${index + 1}：${source.title}（${source.score}）`)
                  : ['重排后没有保留可用来源。'],
            },
            {
              id: 'answer',
              title: 'Answer 回答',
              summary: groundedMode
                ? '基于最终来源生成带引用的 grounded answer。'
                : '在优先参考来源的前提下，生成更灵活的回答。',
              items: [
                `回答模式：${groundedMode ? '仅基于来源' : '灵活回答'}`,
                `证据条数：${sources.length}`,
                groundedMode
                  ? '如果依据不足，需要明确说明当前知识库没有足够支持。'
                  : '即使允许更灵活回答，也应优先引用已命中的来源。',
              ],
            },
          ];
    const trace = {
      originalQuery: latestUserMessage,
      rewrittenQuery,
      keywords,
      retrievedCount: sources.length,
      recallCount: recallCandidates.length,
      strategy:
        locale === 'en'
          ? ['Query rewrite', 'Keyword + semantic recall', 'Source grounding with citations']
          : ['Query 改写', '关键词 + 语义召回', '基于来源片段生成带引用回答'],
      notes:
        locale === 'en'
          ? [
              'The current round keeps only a small, focused subset of chat history for retrieval grounding.',
              'Answers are expected to cite evidence instead of relying on open-ended generation.',
            ]
          : [
              '当前轮次只保留少量必要历史上下文，避免检索被冗余对话干扰。',
              '回答阶段要求模型显式引用来源，而不是自由发挥。',
            ],
      topSources: sources.map((source, index) => ({
        label: `S${index + 1}`,
        id: source.id,
        title: source.title,
        score: source.score,
      })),
      config: {
        topK,
        rewriteEnabled,
        rerankEnabled,
        groundedMode,
      },
      stages,
    };
    const sourceBlock = sources
      .map(
        (source, index) =>
          `[S${index + 1}] ${source.title}\nCategory: ${source.category}\nUpdated: ${source.updatedAt}\nSummary: ${source.summary}\nSnippets:\n${source.snippets
            .map((snippet) => `- ${snippet}`)
            .join('\n')}`
      )
      .join('\n\n');

    const conversation = messages.slice(-6).map((message) => ({
      role: message.role as 'user' | 'assistant' | 'system',
      content: message.content,
    }));

    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            locale === 'zh'
              ? `你是一个企业知识库问答助手。${groundedMode ? '你必须只依据提供的知识来源回答，不允许编造。' : '请优先依据提供的知识来源回答，在必要时可以做少量补充，但不要明显偏离来源。'}

规则：
1. ${groundedMode ? '仅基于已提供的 Sources 回答' : '优先基于已提供的 Sources 回答'}
2. 引用信息时在句子后附带 [S1]、[S2] 这类标记
3. ${groundedMode ? '如果证据不足，明确说“当前知识库里没有足够依据回答这个问题”' : '如果证据不足，可以补充一般性说明，但要明确区分来源依据与补充判断'}
4. 回答要清晰、专业、可读，优先给出结论，再补充依据
5. 不要输出“根据提供的资料”这种生硬套话，语气自然一些`
              : `You are an enterprise knowledge chat assistant. ${groundedMode ? 'You must answer only from the provided sources and must not invent facts.' : 'You should prioritize the provided sources and may add limited general guidance when necessary, without drifting far from the evidence.'}

Rules:
1. ${groundedMode ? 'Answer only from the provided Sources' : 'Prioritize the provided Sources in your answer'}
2. Add inline citations such as [S1] and [S2] when you reference evidence
3. ${groundedMode ? 'If evidence is insufficient, say the current knowledge base does not contain enough support for the answer' : 'If evidence is insufficient, you may add limited general guidance but should make the boundary clear'}
4. Keep the answer clear, professional, and readable; lead with the conclusion, then supporting evidence
5. Avoid stiff filler phrases like "based on the provided materials"; keep the tone natural`,
        },
        {
          role: 'system',
          content:
            locale === 'zh'
              ? `Sources:\n${sourceBlock}`
              : `Sources:\n${sourceBlock}`,
        },
        ...conversation,
      ],
      stream: true,
      temperature: 0.45,
      max_tokens: 1100,
    });

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        const send = (payload: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(JSON.stringify(payload) + '\n'));
        };

        try {
          send({
            type: 'trace',
            trace,
          });

          send({
            type: 'sources',
            query: latestUserMessage,
            sources,
          });

          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content ?? '';
            if (text) {
              send({ type: 'answer_chunk', content: text });
            }
          }

          send({ type: 'done' });
          controller.close();
        } catch (error) {
          send({
            type: 'error',
            error: error instanceof Error ? error.message : locale === 'en' ? 'Request failed' : '请求失败',
          });
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'application/x-ndjson; charset=utf-8',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[api/knowledge-chat]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '请求失败' },
      { status: 500 }
    );
  }
}
