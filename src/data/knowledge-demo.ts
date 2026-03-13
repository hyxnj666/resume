export type Locale = 'zh' | 'en';

export type KnowledgeDoc = {
  id: string;
  title: string;
  category: string;
  summary: string;
  content: string;
  tags: string[];
  updatedAt: string;
};

export type KnowledgeSearchResult = {
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

const KNOWLEDGE_BASE_ZH: KnowledgeDoc[] = [
  {
    id: 'rag-architecture',
    title: '企业知识库问答架构',
    category: 'Architecture',
    summary: '覆盖文档接入、切片、向量检索、重排、答案生成与引用回传的完整链路。',
    content: [
      '企业知识库问答通常由文档接入、预处理、切片、Embedding、索引存储、检索、重排与回答生成组成。',
      '在回答阶段，系统应将召回片段与来源元数据一起传给模型，并要求模型只基于这些片段生成答案。',
      '为了支持引用来源，检索结果需要保留文档标题、章节、更新时间和片段编号，前端再将这些来源与回答中的引用标记关联起来。',
      '如果命中内容不足，系统应明确提示知识库没有足够依据，而不是继续猜测。',
    ].join('\n\n'),
    tags: ['RAG', 'Citation', 'Retrieval', 'Architecture'],
    updatedAt: '2026-03-01',
  },
  {
    id: 'ingestion-pipeline',
    title: '知识库文档接入与切片策略',
    category: 'Pipeline',
    summary: '强调结构化切片、增量更新、元数据治理与多格式文档接入。',
    content: [
      '知识库接入层应支持 PDF、Markdown、Word、网页和内部文档系统的统一抽取。',
      '切片时不宜只按固定字数分段，更推荐结合标题层级、段落语义和表格边界进行结构化切片。',
      '每个 chunk 都应保存来源路径、标题链路、标签、业务线、权限范围和更新时间，方便后续过滤与引用。',
      '增量更新策略可以通过文档哈希和切片版本号避免重复索引，并减少重建成本。',
    ].join('\n\n'),
    tags: ['Ingestion', 'Chunking', 'Metadata', 'Pipeline'],
    updatedAt: '2026-02-24',
  },
  {
    id: 'retrieval-strategy',
    title: '召回与重排策略',
    category: 'Retrieval',
    summary: '语义检索与关键词检索混合召回，再通过重排提高答案相关性。',
    content: [
      '复杂企业知识库通常使用 Hybrid Retrieval，将关键词检索与向量召回结合，以兼顾术语精确匹配和语义相似度。',
      '在第一轮召回后，可以引入 reranker 对候选片段重新排序，提高最终送入模型的上下文质量。',
      '多轮对话场景下，需要从当前问题中提炼实体、时间范围和上下文约束，避免单纯把整段历史全部塞给检索器。',
      '前端如果要展示“命中来源”，建议同时展示命中分数、摘要和高亮片段，让用户知道答案依据来自哪里。',
    ].join('\n\n'),
    tags: ['Hybrid Search', 'Rerank', 'Semantic Search', 'Context'],
    updatedAt: '2026-03-03',
  },
  {
    id: 'frontend-chat-ux',
    title: '知识库 Chat 前端交互设计',
    category: 'Frontend',
    summary: '包括流式输出、来源卡片、引用高亮、可滚动结果区与问题建议。',
    content: [
      '知识库 Chat 前端应支持流式输出，减少等待感，并在输出过程中保留用户主动滚动查看历史内容的能力。',
      '回答中的引用标记可以设计成 [S1]、[S2] 这类轻量形式，再配合右侧来源面板展示对应文档和命中片段。',
      '来源面板建议包含标题、分类、更新时间、标签、命中分数和片段预览，帮助用户快速判断来源质量。',
      '空状态下可以提供推荐问题、知识库覆盖范围和能力说明，降低首次使用门槛。',
    ].join('\n\n'),
    tags: ['Streaming UI', 'Citation UX', 'Interaction', 'Frontend'],
    updatedAt: '2026-02-28',
  },
  {
    id: 'evaluation-guardrails',
    title: '回答质量与防幻觉策略',
    category: 'Quality',
    summary: '通过引用约束、拒答策略、离线评测与反馈回流提升可靠性。',
    content: [
      '知识库问答的核心不是“回答得像”，而是“回答有依据”。模型必须被要求引用对应来源，并在证据不足时明确拒答。',
      '可以通过离线问答集评测召回率、引用准确率、答案完整度与拒答准确率，持续优化知识库效果。',
      '高风险场景下建议加入敏感词过滤、权限校验和人工复核机制。',
      '用户反馈“答案不准确”时，应回流记录到检索日志和评测样本，方便后续优化召回与提示词。',
    ].join('\n\n'),
    tags: ['Guardrails', 'Evaluation', 'Hallucination', 'Feedback'],
    updatedAt: '2026-03-04',
  },
  {
    id: 'ops-governance',
    title: '多租户与知识治理',
    category: 'Governance',
    summary: '涉及权限过滤、版本管理、业务线隔离、日志审计与知识生命周期。',
    content: [
      '企业知识库往往不是单一资料库，而是多业务线、多权限域并存，因此检索前需要进行租户与权限过滤。',
      '知识文档应具备版本管理能力，避免旧内容持续参与召回导致答案过时。',
      '日志中应记录查询词、命中文档、最终回答、用户反馈与模型版本，用于审计和问题追踪。',
      '当文档过期、下线或权限变更时，索引也应及时同步，避免越权引用。',
    ].join('\n\n'),
    tags: ['Multi-tenant', 'ACL', 'Governance', 'Audit'],
    updatedAt: '2026-02-20',
  },
];

const KNOWLEDGE_BASE_EN: KnowledgeDoc[] = [
  {
    id: 'rag-architecture',
    title: 'Enterprise Knowledge QA Architecture',
    category: 'Architecture',
    summary: 'A full path from ingestion and chunking to retrieval, reranking, answer generation, and citation mapping.',
    content: [
      'Enterprise knowledge QA usually includes ingestion, preprocessing, chunking, embeddings, indexing, retrieval, reranking, and answer generation.',
      'At answer time, the model should receive retrieved snippets together with source metadata and be instructed to answer only from that evidence.',
      'To support citations, each result should preserve source title, section path, updated time, and snippet identity so the frontend can map citations back to source cards.',
      'When evidence is weak, the system should explicitly say the current knowledge base is insufficient instead of guessing.',
    ].join('\n\n'),
    tags: ['RAG', 'Citation', 'Retrieval', 'Architecture'],
    updatedAt: '2026-03-01',
  },
  {
    id: 'ingestion-pipeline',
    title: 'Document Ingestion and Chunking Strategy',
    category: 'Pipeline',
    summary: 'Focuses on structured chunking, incremental updates, metadata governance, and multi-format ingestion.',
    content: [
      'The ingestion layer should support unified extraction from PDF, Markdown, Word, websites, and internal document systems.',
      'Chunking should not rely on fixed character windows only; it works better when aligned with heading hierarchy, paragraph semantics, and table boundaries.',
      'Each chunk should keep metadata such as source path, title chain, labels, business domain, ACL scope, and update time.',
      'Incremental updates can use document hashes and chunk versioning to avoid unnecessary re-indexing.',
    ].join('\n\n'),
    tags: ['Ingestion', 'Chunking', 'Metadata', 'Pipeline'],
    updatedAt: '2026-02-24',
  },
  {
    id: 'retrieval-strategy',
    title: 'Retrieval and Reranking Strategy',
    category: 'Retrieval',
    summary: 'Uses hybrid retrieval and reranking to improve the relevance of grounded answers.',
    content: [
      'Production knowledge systems often use hybrid retrieval to combine keyword matching with vector similarity.',
      'After first-stage recall, a reranker can reorder candidates so the best evidence reaches the LLM.',
      'In multi-turn chat, the query should be rewritten into a concise retrieval intent with entities, constraints, and time scope instead of passing the full conversation verbatim.',
      'If the frontend shows matched sources, it should surface score, summary, and highlighted snippets so users can judge trustworthiness quickly.',
    ].join('\n\n'),
    tags: ['Hybrid Search', 'Rerank', 'Semantic Search', 'Context'],
    updatedAt: '2026-03-03',
  },
  {
    id: 'frontend-chat-ux',
    title: 'Knowledge Chat Frontend UX',
    category: 'Frontend',
    summary: 'Covers streaming answers, citation chips, source cards, scroll behavior, and suggested questions.',
    content: [
      'A knowledge chat UI should stream the answer progressively while still allowing the user to scroll through history during generation.',
      'Inline citation markers such as [S1] and [S2] work well when paired with a side panel that shows the matching documents and snippets.',
      'A source panel should include title, category, updated time, tags, match score, and snippet previews for quick judgment.',
      'The empty state should reduce friction by showing example questions, knowledge coverage, and what the assistant can answer.',
    ].join('\n\n'),
    tags: ['Streaming UI', 'Citation UX', 'Interaction', 'Frontend'],
    updatedAt: '2026-02-28',
  },
  {
    id: 'evaluation-guardrails',
    title: 'Answer Quality and Guardrails',
    category: 'Quality',
    summary: 'Improves reliability through citation constraints, refusal behavior, evaluation, and feedback loops.',
    content: [
      'The goal of knowledge chat is not to sound plausible but to answer with evidence. The model should cite sources and refuse when evidence is insufficient.',
      'Offline evaluations can track retrieval recall, citation accuracy, answer completeness, and refusal accuracy.',
      'High-risk domains should add content filtering, ACL checks, and optional human review.',
      'When users mark an answer as inaccurate, that feedback should flow back into retrieval logs and evaluation datasets.',
    ].join('\n\n'),
    tags: ['Guardrails', 'Evaluation', 'Hallucination', 'Feedback'],
    updatedAt: '2026-03-04',
  },
  {
    id: 'ops-governance',
    title: 'Multi-tenant Governance',
    category: 'Governance',
    summary: 'Covers ACL filtering, versioning, business isolation, logging, and knowledge lifecycle management.',
    content: [
      'Enterprise knowledge systems usually span multiple business domains and permission scopes, so retrieval should apply tenant and ACL filters before recall.',
      'Knowledge documents should support versioning so outdated content does not continue influencing answers.',
      'Logs should capture query text, retrieved sources, generated answer, user feedback, and model version for auditability.',
      'When documents expire, go offline, or change permissions, the index must be updated as well to avoid invalid citations.',
    ].join('\n\n'),
    tags: ['Multi-tenant', 'ACL', 'Governance', 'Audit'],
    updatedAt: '2026-02-20',
  },
];

export function getKnowledgeBase(locale: Locale) {
  return locale === 'en' ? KNOWLEDGE_BASE_EN : KNOWLEDGE_BASE_ZH;
}

function extractKeywords(query: string) {
  const zh = query.match(/[\u4e00-\u9fa5]{2,}/g) ?? [];
  const en = query.toLowerCase().match(/[a-z]{3,}/g) ?? [];
  return Array.from(new Set([...zh, ...en])).slice(0, 12);
}

function normalize(text: string) {
  return text.toLowerCase();
}

function scoreDoc(doc: KnowledgeDoc, keywords: string[]) {
  const title = normalize(doc.title);
  const summary = normalize(doc.summary);
  const content = normalize(doc.content);
  const category = normalize(doc.category);
  const tags = normalize(doc.tags.join(' '));

  let score = 0;
  for (const keyword of keywords) {
    const token = normalize(keyword);
    if (title.includes(token)) score += 6;
    if (summary.includes(token)) score += 4;
    if (tags.includes(token)) score += 3;
    if (category.includes(token)) score += 2;
    if (content.includes(token)) score += 1;
  }

  return score;
}

function getSnippets(doc: KnowledgeDoc, keywords: string[]) {
  const blocks = doc.content.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean);
  const matched = blocks
    .map((block) => ({
      block,
      score: keywords.reduce((sum, keyword) => sum + (normalize(block).includes(normalize(keyword)) ? 1 : 0), 0),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.block);

  const fallback = blocks.slice(0, 2);
  return (matched.length > 0 ? matched : fallback).slice(0, 2);
}

export function searchKnowledgeBase(query: string, locale: Locale, limit = 4): KnowledgeSearchResult[] {
  const docs = getKnowledgeBase(locale);
  const keywords = extractKeywords(query);

  const ranked = docs
    .map((doc) => {
      const baseScore = keywords.length > 0 ? scoreDoc(doc, keywords) : 0;
      const fallbackScore =
        keywords.length === 0
          ? doc.tags.length + doc.summary.length / 120
          : 0;
      const score = Math.max(baseScore, fallbackScore);

      return {
        ...doc,
        score: Math.min(99, Math.round(score * 9 + 12)),
        snippets: getSnippets(doc, keywords),
      };
    })
    .sort((a, b) => b.score - a.score);

  return ranked.slice(0, limit);
}

export function getKnowledgeBaseStats(locale: Locale) {
  const docs = getKnowledgeBase(locale);
  const categories = new Set(docs.map((doc) => doc.category));
  return {
    totalDocs: docs.length,
    totalCategories: categories.size,
  };
}
