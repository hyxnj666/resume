import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? '' });

type Locale = 'zh' | 'en';

type ToolName = 'knowledge_search' | 'artifact_strategy' | 'implementation_checklist';

type PlannerResult = {
  analysis: string;
  steps: string[];
  tools: ToolName[];
};

type ArtifactKind = 'html' | 'markdown' | 'json';

type ArtifactPlan = {
  id: string;
  kind: ArtifactKind;
  title: string;
};

type HtmlDesignProfile = {
  name: string;
  layout: string;
  visualTone: string;
  highlights: string[];
};

const DEMO_CORPUS_ZH = [
  'AI Agent Simulator 是一个独立的 Step Flow Demo，用来展示任务拆解、工具调用、产物生成与最终回答。',
  'Step Flow 常见阶段包括：任务分析、计划生成、工具调用、观察结果、产物生成、最终回答。',
  '在 Agent 产品中，工具调用结果通常以 Observation 或 Tool Result 形式进入后续步骤。',
  '如果任务与页面原型、登录页、表单、Dashboard 相关，通常适合生成 HTML artifact 并在右侧预览。',
  '如果任务与文章、文档、提纲、方案、总结、说明、博客、清单、复盘相关，通常适合生成 Markdown artifact 并展示源码。',
  '一个好的 Agent Timeline 应该支持 running、done、error 等状态，并允许用户在执行过程中手动滚动查看历史步骤。',
  'Artifact Preview 常见形态包括 HTML 预览、Markdown 预览、代码源码、JSON 结果以及图片资源。',
  '在前端交互上，Agent Timeline 适合使用 loading、三点跳动、骨架屏、流式光标等动效增强执行感。',
  '生成 HTML 原型时，建议使用单文件 HTML、内联 CSS、少量原生 JS，避免依赖外部资源，便于直接预览。',
  '生成 Markdown 内容时，应根据任务类型自适应组织结构，例如标题、摘要、要点、步骤、清单、结论或后续建议。',
  '实现独立 Step Flow Demo 时，不必依赖个人简历知识库，可以使用通用产品设计与前端实现语料作为知识搜索来源。',
  '常见 Agent 工具可以抽象为：knowledge search、artifact strategy、implementation checklist、browser preview。',
];

const DEMO_CORPUS_EN = [
  'AI Agent Simulator is a standalone Step Flow demo for task decomposition, tool calls, artifact generation, and final answers.',
  'Common Step Flow phases include task analysis, planning, tool calling, observation, artifact generation, and final answer.',
  'In an agent product, tool outputs usually become observations that feed into later reasoning steps.',
  'Tasks about login pages, forms, dashboards, or prototypes are a good fit for HTML artifacts with live preview.',
  'Tasks about articles, docs, outlines, proposals, summaries, notes, checklists, or retrospectives are a good fit for Markdown artifacts with source view.',
  'A good agent timeline should support running, done, and error states and should let users manually scroll while execution continues.',
  'Artifact preview patterns include HTML preview, Markdown preview, code source, JSON result, and image assets.',
  'Agent UIs often use loading states, bouncing dots, skeletons, and streaming cursors to convey live execution.',
  'For HTML prototypes, prefer a single HTML file with inline CSS and minimal vanilla JS so it can be previewed directly.',
  'For Markdown content, the structure should adapt to the task, such as title, summary, key points, steps, checklist, conclusion, or next actions.',
  'A standalone Step Flow demo does not need to depend on a personal resume knowledge base and can use a generic product/frontend corpus instead.',
  'Useful abstract tools for this kind of demo include knowledge search, artifact strategy, implementation checklist, and browser preview.',
];

const HTML_PROFILES_ZH: HtmlDesignProfile[] = [
  {
    name: 'AuroraGlass',
    layout: '左侧品牌说明 + 右侧登录卡片的双栏布局',
    visualTone: '蓝紫 aurora 渐变、玻璃拟态、柔和发光、深色科技感',
    highlights: ['悬浮信息卡', '渐变主按钮', '背景光斑和网格', '细腻 hover / focus 状态'],
  },
  {
    name: 'NeonPanel',
    layout: '偏中轴的大面板布局，顶部品牌区，下方登录和辅助信息并列',
    visualTone: '深色底 + 霓虹边框 + 赛博感高对比',
    highlights: ['发光描边', '模块分区明确', '标签式输入区', '强调视觉层级'],
  },
  {
    name: 'ProductHero',
    layout: '左侧产品介绍 hero，右侧卡片登录，适合 SaaS 首页登录入口',
    visualTone: '更像真实产品官网，现代、克制、精致，不要俗套',
    highlights: ['hero 标题和卖点', '数据或 feature chips', '柔和阴影', '高级留白'],
  },
  {
    name: 'FloatingCards',
    layout: '中心登录卡片 + 四周辅助浮层卡片，形成更强展示感',
    visualTone: '蓝紫渐变配高层次浮层，轻拟物但不厚重',
    highlights: ['多层卡片', '景深层次', '辅助状态卡', '更强演示感'],
  },
];

const HTML_PROFILES_EN: HtmlDesignProfile[] = [
  {
    name: 'AuroraGlass',
    layout: 'split layout with branding copy on the left and a login card on the right',
    visualTone: 'blue-purple aurora gradients, glassmorphism, soft glow, dark tech feel',
    highlights: ['floating info cards', 'gradient primary button', 'background glow and subtle grid', 'refined hover/focus states'],
  },
  {
    name: 'NeonPanel',
    layout: 'large central panel layout with a top brand area and login/support blocks below',
    visualTone: 'dark base with neon edges and high-contrast cyber styling',
    highlights: ['glowing borders', 'clear module separation', 'tag-like inputs', 'strong visual hierarchy'],
  },
  {
    name: 'ProductHero',
    layout: 'product hero on the left and a polished login card on the right',
    visualTone: 'modern SaaS landing quality, restrained, premium, product-like',
    highlights: ['hero headline and selling points', 'data or feature chips', 'soft shadows', 'premium spacing'],
  },
  {
    name: 'FloatingCards',
    layout: 'centered login card with surrounding floating support cards for a showcase feel',
    visualTone: 'blue-purple layered gradients with airy floating panels',
    highlights: ['multi-layer cards', 'depth and perspective', 'supporting status cards', 'strong demo appeal'],
  },
];

function getHtmlDesignProfile(locale: Locale): HtmlDesignProfile {
  const profiles = locale === 'en' ? HTML_PROFILES_EN : HTML_PROFILES_ZH;
  return profiles[Math.floor(Math.random() * profiles.length)];
}

function getVariationNonce() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function getCorpus(locale: Locale) {
  return locale === 'en' ? DEMO_CORPUS_EN : DEMO_CORPUS_ZH;
}

function extractKeywords(text: string): string[] {
  const cn = text.match(/[\u4e00-\u9fa5]{2,}/g) ?? [];
  const en = text.toLowerCase().match(/[a-z]{3,}/g) ?? [];
  return Array.from(new Set([...cn, ...en])).slice(0, 10);
}

function scoreLines(lines: string[], query: string): string[] {
  const keywords = extractKeywords(query);
  if (keywords.length === 0) return lines.slice(0, 8);

  const scored = lines
    .map((line) => ({
      line,
      score: keywords.reduce(
        (sum, kw) => sum + (line.toLowerCase().includes(kw.toLowerCase()) ? 1 : 0),
        0
      ),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return (scored.length > 0 ? scored.map((item) => item.line) : lines).slice(0, 8);
}

function knowledgeSearch(query: string, locale: Locale): string {
  return scoreLines(getCorpus(locale), query).join('\n');
}

function artifactStrategy(query: string, locale: Locale): string {
  const isHtml =
    /登录|页面|原型|界面|html|landing|ui|页面设计|表单|dashboard|login/.test(query) ||
    /(login|page|prototype|ui|html|dashboard|landing|form)/.test(query.toLowerCase());

  const isMarkdown =
    /文章|博客|文档|方案|提纲|总结|说明|清单|复盘|markdown/.test(query) ||
    /(article|blog|doc|document|outline|summary|note|checklist|recap|retrospective|markdown)/.test(query.toLowerCase());

  if (isHtml) {
    return locale === 'zh'
      ? '建议产物：HTML 页面原型\n布局：不要只做普通居中卡片，优先考虑双栏 hero、悬浮卡片或更像真实产品官网的登录入口布局\n视觉：现代渐变、圆角、阴影、层次分明、带产品质感\n实现：单文件 HTML + 内联 CSS + 少量原生 JS\n补充：要体现高级感、细节状态和更强的信息组织'
      : 'Recommended artifact: HTML page prototype\nLayout: avoid a plain centered card by default; prefer split hero layouts, floating support cards, or a more product-like landing login composition\nVisual: modern gradients, rounded corners, shadows, strong hierarchy, premium product feel\nImplementation: single-file HTML + inline CSS + minimal vanilla JS\nExtra: emphasize polish, interaction states, and stronger information organization';
  }

  if (isMarkdown) {
    return locale === 'zh'
      ? '建议产物：Markdown 内容文档\n结构：根据任务自适应，可包含标题、摘要、要点、步骤、清单、结论或建议\n风格：条理清晰、便于阅读和复制，不要默认写成技术方案'
      : 'Recommended artifact: Markdown content document\nStructure: adapt to the task and may include a title, summary, key points, steps, checklist, conclusion, or recommendations\nStyle: clear, readable, and easy to copy; do not default to a technical proposal';
  }

  return locale === 'zh'
    ? '建议：如果任务偏展示，优先生成 HTML；如果任务偏说明，优先生成 Markdown。'
    : 'Recommendation: generate HTML for visual tasks and Markdown for explanatory tasks.';
}

function implementationChecklist(query: string, locale: Locale): string {
  const baseZh = [
    '明确用户任务目标与期望产物',
    '决定使用何种 artifact 类型（HTML / Markdown）',
    '组织上下文信息并提炼关键点',
    '生成产物并同步展示预览',
    '整理最终回答与后续建议',
  ];
  const baseEn = [
    'Clarify the task goal and expected artifact',
    'Choose an artifact type (HTML / Markdown)',
    'Organize context and extract key points',
    'Generate the artifact and update preview',
    'Compose the final answer with follow-up suggestions',
  ];

  const extra =
    /登录|login|表单|dashboard|页面|ui/.test(query.toLowerCase())
      ? locale === 'zh'
        ? '补充：注意输入框、按钮、层级和空状态设计'
        : 'Extra: pay attention to inputs, buttons, hierarchy, and empty states'
      : locale === 'zh'
        ? '补充：注意结构清晰、标题层级和可读性'
        : 'Extra: keep a clear structure, heading hierarchy, and readability';

  return [...(locale === 'zh' ? baseZh : baseEn), extra].join('\n');
}

async function planTask(task: string, locale: Locale): Promise<PlannerResult> {
  const fallback: PlannerResult = {
    analysis:
      locale === 'zh'
        ? '先理解任务目标，再检索通用知识与实现策略，最后生成产物并整理回答。'
        : 'Understand the task, gather knowledge and implementation strategy, then generate artifacts and the final answer.',
    steps:
      locale === 'zh'
        ? ['分析任务', '检索通用知识', '整理实现策略', '生成产物并总结']
        : ['Analyze task', 'Search knowledge', 'Organize strategy', 'Generate artifact and summarize'],
    tools: ['knowledge_search', 'artifact_strategy'],
  };

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            locale === 'zh'
              ? '你是独立 Step Flow Demo 的任务规划器。请输出 JSON：{"analysis":"...","steps":["..."],"tools":["knowledge_search"|"artifact_strategy"|"implementation_checklist"]}。最多 3 个工具。'
              : 'You are the planner for a standalone Step Flow demo. Output JSON: {"analysis":"...","steps":["..."],"tools":["knowledge_search"|"artifact_strategy"|"implementation_checklist"]}. Choose up to 3 tools.',
        },
        { role: 'user', content: task },
      ],
      temperature: 0.2,
      max_tokens: 300,
    });

    const text = completion.choices[0]?.message?.content ?? '';
    const parsed = JSON.parse(text) as Partial<PlannerResult>;
    const tools = Array.isArray(parsed.tools)
      ? parsed.tools.filter((tool): tool is ToolName =>
          ['knowledge_search', 'artifact_strategy', 'implementation_checklist'].includes(tool)
        )
      : [];

    return {
      analysis: parsed.analysis?.trim() || fallback.analysis,
      steps: Array.isArray(parsed.steps) && parsed.steps.length > 0 ? parsed.steps.slice(0, 5) : fallback.steps,
      tools: tools.length > 0 ? tools.slice(0, 3) : fallback.tools,
    };
  } catch {
    return fallback;
  }
}

function inferArtifactPlans(task: string, locale: Locale): ArtifactPlan[] {
  const lower = task.toLowerCase();
  const wantsHtml =
    /登录|页面|原型|界面|html|landing|ui|页面设计|表单|dashboard|login/.test(task) ||
    /(login|page|prototype|ui|html|dashboard|landing|form)/.test(lower);

  const wantsMarkdown =
    /文章|博客|文档|方案|提纲|总结|说明|清单|复盘|markdown/.test(task) ||
    /(article|blog|doc|document|outline|summary|note|checklist|recap|retrospective|markdown)/.test(lower);

  const plans: ArtifactPlan[] = [];

  if (wantsHtml) {
    plans.push({
      id: 'artifact-html',
      kind: 'html',
      title: locale === 'zh' ? '页面原型预览' : 'Page Prototype Preview',
    });
    plans.push({
      id: 'artifact-markdown',
      kind: 'markdown',
      title: locale === 'zh' ? '配套说明' : 'Supporting Notes',
    });
    plans.push({
      id: 'artifact-json',
      kind: 'json',
      title: locale === 'zh' ? '页面结构摘要' : 'Page Structure Summary',
    });
    return plans;
  }

  if (wantsMarkdown) {
    plans.push({
      id: 'artifact-markdown',
      kind: 'markdown',
      title: locale === 'zh' ? 'Markdown 内容' : 'Markdown Content',
    });
    plans.push({
      id: 'artifact-json',
      kind: 'json',
      title: locale === 'zh' ? '结构化摘要' : 'Structured Summary',
    });
    return plans;
  }

  plans.push({
    id: 'artifact-markdown',
    kind: 'markdown',
    title: locale === 'zh' ? '任务说明' : 'Task Notes',
  });
  plans.push({
    id: 'artifact-json',
    kind: 'json',
    title: locale === 'zh' ? '任务摘要 JSON' : 'Task Summary JSON',
  });

  return plans;
}

async function streamArtifact(params: {
  controller: ReadableStreamDefaultController;
  send: (controller: ReadableStreamDefaultController, payload: Record<string, unknown>) => void;
  task: string;
  locale: Locale;
  artifactPlan: ArtifactPlan;
  toolOutputs: Array<{ tool: string; output: string }>;
}) {
  const { controller, send, task, locale, artifactPlan, toolOutputs } = params;
  const htmlProfile = artifactPlan.kind === 'html' ? getHtmlDesignProfile(locale) : null;
  const variationNonce = getVariationNonce();

  send(controller, {
    type: 'artifact_started',
    artifactId: artifactPlan.id,
    kind: artifactPlan.kind,
    title: artifactPlan.title,
  });

  const artifactPrompt =
    artifactPlan.kind === 'html'
      ? locale === 'zh'
        ? `你是一个高水平 AI 前端原型生成器。请基于用户任务与上下文，输出一个完整可运行、审美在线的 HTML 文件，只返回 HTML，不要加解释。要求：
1. 单文件 HTML，内联 CSS，可少量原生 JS
2. 默认桌面端宽度友好，不引用外部资源
3. 必须具备明显的产品设计感，避免普通模板感、避免过于朴素、避免只输出单调的居中登录盒子
4. 要做出更高级的层次：背景、主卡片、辅助信息、按钮、输入框、标题区都要有明显设计
5. 必须使用本轮设计方向，不要复用常见的默认布局

本轮设计方向：
- 方案名：${htmlProfile?.name}
- 布局：${htmlProfile?.layout}
- 视觉气质：${htmlProfile?.visualTone}
- 亮点：${htmlProfile?.highlights.join('、')}
- 变化标识：${variationNonce}

设计要求补充：
- 优先做更像真实 SaaS / AI 产品落地页的登录原型，而不是练习 demo
- 提升精致度：更好的标题层级、辅助文案、图形装饰、渐变和阴影
- 输入框、按钮、卡片都要有细节状态
- 如果用户提到蓝紫渐变，就让蓝紫成为主视觉，但不要千篇一律
- 每次生成都要尽量给出不同的构图、装饰元素和信息组织方式

用户任务：
${task}

上下文：
${toolOutputs.map((item) => `【${item.tool}】\n${item.output}`).join('\n\n')}`
        : `You are a high-end frontend prototype generator. Based on the task and context, output a complete runnable single-file HTML document. Return HTML only, no explanation.
Requirements:
1. Single file HTML with inline CSS and optional vanilla JS
2. Desktop-friendly layout with no external assets
3. The visual quality must feel premium and product-ready, not like a bland default template
4. Avoid repeating the same centered login card pattern unless the layout direction explicitly requires it
5. Use this run's design direction so repeated prompts still produce noticeably different compositions

Design direction for this run:
- Profile: ${htmlProfile?.name}
- Layout: ${htmlProfile?.layout}
- Visual tone: ${htmlProfile?.visualTone}
- Highlights: ${htmlProfile?.highlights.join(', ')}
- Variation nonce: ${variationNonce}

Additional design constraints:
- Make it feel like a polished SaaS / AI product prototype
- Create stronger hierarchy between background, hero area, login card, and support modules
- Add refined detail to buttons, inputs, chips, cards, shadows, and decorative layers
- If the user asks for a blue-purple gradient, keep that as the main palette while still varying composition
- Each generation should try to differ in composition, decorative treatment, and content organization

Task:
${task}

Context:
${toolOutputs.map((item) => `[${item.tool}]\n${item.output}`).join('\n\n')}`
      : artifactPlan.kind === 'markdown'
        ? locale === 'zh'
          ? `请根据用户任务与上下文，输出一份结构清晰、贴合任务目标的 Markdown 内容，只返回 Markdown，不要解释。

要求：
1. 结构必须根据任务自适应，不要默认写成“技术方案”
2. 可以按任务需要组织为说明文、提纲、总结、清单、博客草稿、复盘记录、操作步骤等
3. 语言要自然、清晰、可直接阅读或继续编辑
4. 如果任务偏产品、创意、运营或通用说明，就用对应语气和结构，不要强行技术化

用户任务：
${task}

上下文：
${toolOutputs.map((item) => `【${item.tool}】\n${item.output}`).join('\n\n')}`
          : `Generate a clean Markdown artifact based on the task and context. Return Markdown only.

Requirements:
1. Adapt the structure to the task instead of defaulting to a technical proposal
2. The output may become notes, an outline, a summary, a checklist, a blog draft, a retrospective, or step-by-step instructions
3. Keep the writing natural, clear, and ready to read or further edit
4. If the task is product, creative, operational, or general-purpose, match that tone instead of forcing a technical framing

Task:
${task}

Context:
${toolOutputs.map((item) => `[${item.tool}]\n${item.output}`).join('\n\n')}`
        : locale === 'zh'
          ? `请根据用户任务与上下文，输出一个 JSON 对象，不要使用 Markdown 代码块，不要解释。JSON 需要包含：
- task
- artifactType
- keyPoints（数组）
- modules（数组）
- implementationTips（数组）

用户任务：
${task}

上下文：
${toolOutputs.map((item) => `【${item.tool}】\n${item.output}`).join('\n\n')}`
          : `Generate a JSON object based on the task and context. Do not use markdown code fences and do not explain. The JSON must include:
- task
- artifactType
- keyPoints (array)
- modules (array)
- implementationTips (array)

Task:
${task}

Context:
${toolOutputs.map((item) => `[${item.tool}]\n${item.output}`).join('\n\n')}`;

  const artifactStream = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          artifactPlan.kind === 'html'
            ? locale === 'zh'
              ? '你是一个高审美的前端页面原型生成器，输出必须是纯 HTML。必须重视设计层次、质感和差异化，不要总是复用同一种模板。'
              : 'You are a frontend prototype generator with strong product design taste. Output pure HTML only. Prioritize hierarchy, polish, and variation instead of repeating the same template.'
            : artifactPlan.kind === 'markdown'
              ? locale === 'zh'
                ? '你是一个 Markdown 内容生成器，输出必须是纯 Markdown。'
                : 'You are a Markdown content generator. Output pure Markdown only.'
              : locale === 'zh'
                ? '你是一个 JSON 结构化内容生成器，输出必须是合法 JSON。'
                : 'You are a JSON structured content generator. Output valid JSON only.',
      },
      { role: 'user', content: artifactPrompt },
    ],
    stream: true,
    temperature: artifactPlan.kind === 'html' ? 0.95 : artifactPlan.kind === 'markdown' ? 0.7 : 0.55,
    max_tokens: artifactPlan.kind === 'html' ? 2800 : artifactPlan.kind === 'markdown' ? 1800 : 1200,
  });

  let artifactContent = '';
  for await (const chunk of artifactStream) {
    const text = chunk.choices[0]?.delta?.content ?? '';
    if (!text) continue;
    artifactContent += text;
    send(controller, {
      type: 'artifact_chunk',
      artifactId: artifactPlan.id,
      content: text,
    });
  }

  send(controller, {
    type: 'artifact_completed',
    artifactId: artifactPlan.id,
    kind: artifactPlan.kind,
    title: artifactPlan.title,
    content: artifactContent,
  });

}

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OPENAI_API_KEY 未配置' }, { status: 503 });
  }

  try {
    const body = (await req.json()) as { task?: string; locale?: Locale };
    const task = body.task?.trim();
    const locale: Locale = body.locale === 'en' ? 'en' : 'zh';

    if (!task) {
      return NextResponse.json({ error: locale === 'zh' ? 'task 不能为空' : 'task is required' }, { status: 400 });
    }

    const encoder = new TextEncoder();
    const send = (controller: ReadableStreamDefaultController, payload: Record<string, unknown>) => {
      controller.enqueue(
        encoder.encode(
          `${JSON.stringify({
            ...payload,
            ts: new Date().toISOString(),
          })}\n`
        )
      );
    };
    const sendThoughtProgress = (
      controller: ReadableStreamDefaultController,
      stepId: string,
      title: string,
      content: string
    ) => {
      send(controller, {
        type: 'thought_progress',
        stepId,
        title,
        content,
      });
    };

    const readable = new ReadableStream({
      async start(controller) {
        try {
          send(controller, {
            type: 'step_started',
            stepId: 'analysis',
            title: locale === 'zh' ? '分析任务' : 'Analyze task',
          });
          sendThoughtProgress(
            controller,
            'analysis',
            locale === 'zh' ? '分析任务' : 'Analyze task',
            locale === 'zh'
              ? '正在识别任务意图、输出目标与最合适的执行路径…'
              : 'Identifying task intent, output goals, and the best execution path…'
          );

          const plan = await planTask(task, locale);
          sendThoughtProgress(
            controller,
            'analysis',
            locale === 'zh' ? '分析任务' : 'Analyze task',
            locale === 'zh'
              ? `已完成初步规划，预计执行 ${plan.steps.length} 个步骤，并调用 ${plan.tools.length} 个工具。`
              : `Initial planning completed with ${plan.steps.length} steps and ${plan.tools.length} tool calls.`
          );

          send(controller, {
            type: 'step_completed',
            stepId: 'analysis',
            title: locale === 'zh' ? '分析任务' : 'Analyze task',
            content: `${plan.analysis}\n${plan.steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}`,
          });

          const toolOutputs: Array<{ tool: ToolName; output: string }> = [];
          send(controller, {
            type: 'step_started',
            stepId: 'execution',
            title: locale === 'zh' ? '执行工具' : 'Execute tools',
          });
          for (const tool of plan.tools) {
            sendThoughtProgress(
              controller,
              'execution',
              locale === 'zh' ? '执行工具' : 'Execute tools',
              locale === 'zh'
                ? `准备调用工具：${tool}`
                : `Preparing to call tool: ${tool}`
            );
            send(controller, {
              type: 'tool_called',
              tool,
              input: task,
            });

            let output = '';
            if (tool === 'knowledge_search') output = knowledgeSearch(task, locale);
            if (tool === 'artifact_strategy') output = artifactStrategy(task, locale);
            if (tool === 'implementation_checklist') output = implementationChecklist(task, locale);

            toolOutputs.push({ tool, output });
            send(controller, {
              type: 'tool_result',
              tool,
              output,
            });
          }
          send(controller, {
            type: 'step_completed',
            stepId: 'execution',
            title: locale === 'zh' ? '执行工具' : 'Execute tools',
            content:
              locale === 'zh'
                ? `工具执行完成，共 ${toolOutputs.length} 项结果。`
                : `Tool execution completed with ${toolOutputs.length} results.`,
          });

          const artifactPlans = inferArtifactPlans(task, locale);
          if (artifactPlans.length > 0) {
            send(controller, {
              type: 'step_started',
              stepId: 'artifact',
              title: locale === 'zh' ? '生成产物' : 'Generate artifacts',
            });
            sendThoughtProgress(
              controller,
              'artifact',
              locale === 'zh' ? '生成产物' : 'Generate artifacts',
              locale === 'zh'
                ? `即将生成 ${artifactPlans.length} 个产物：${artifactPlans.map((item) => item.title).join('、')}`
                : `Preparing ${artifactPlans.length} artifacts: ${artifactPlans.map((item) => item.title).join(', ')}`
            );

            for (const artifactPlan of artifactPlans) {
              sendThoughtProgress(
                controller,
                'artifact',
                locale === 'zh' ? '生成产物' : 'Generate artifacts',
                locale === 'zh'
                  ? `开始生成 ${artifactPlan.title}，类型为 ${artifactPlan.kind.toUpperCase()}`
                  : `Starting ${artifactPlan.title} as a ${artifactPlan.kind.toUpperCase()} artifact`
              );
              await streamArtifact({
                controller,
                send,
                task,
                locale,
                artifactPlan,
                toolOutputs,
              });
            }

            send(controller, {
              type: 'step_completed',
              stepId: 'artifact',
              title: locale === 'zh' ? '生成产物' : 'Generate artifacts',
              content:
                locale === 'zh'
                  ? `已生成 ${artifactPlans.length} 个产物：${artifactPlans.map((item) => item.title).join('、')}`
                  : `Generated ${artifactPlans.length} artifacts: ${artifactPlans.map((item) => item.title).join(', ')}`,
            });
          }

          send(controller, {
            type: 'step_started',
            stepId: 'final',
            title: locale === 'zh' ? '生成答案' : 'Generate answer',
          });
          sendThoughtProgress(
            controller,
            'final',
            locale === 'zh' ? '生成答案' : 'Generate answer',
            locale === 'zh'
              ? '正在整合工具结果、产物摘要与任务目标，准备生成最终回答…'
              : 'Combining tool outputs, artifact summaries, and task goals into the final response…'
          );

          const finalPrompt =
            locale === 'zh'
              ? `用户任务：${task}\n\n这是一个独立的 Step Flow / Agent Demo，不依赖个人简历知识库。\n\n已执行步骤：\n${plan.steps
                  .map((step, i) => `${i + 1}. ${step}`)
                  .join('\n')}\n\n工具结果：\n${toolOutputs
                  .map((item) => `【${item.tool}】\n${item.output}`)
                  .join('\n\n')}\n\n${
                  artifactPlans.length > 0 ? `已生成产物：${artifactPlans.map((item) => item.title).join('、')}。\n` : ''
                }请基于上述内容直接给出专业、可执行、结构清晰的最终答案，信息量可以比简短摘要更充分。若是岗位、规划、匹配或评估类问题，优先使用条目化回答。`
              : `Task: ${task}\n\nThis is a standalone Step Flow / Agent demo and does not depend on a personal resume knowledge base.\n\nExecuted steps:\n${plan.steps
                  .map((step, i) => `${i + 1}. ${step}`)
                  .join('\n')}\n\nTool results:\n${toolOutputs
                  .map((item) => `[${item.tool}]\n${item.output}`)
                  .join('\n\n')}\n\n${
                  artifactPlans.length > 0 ? `Generated artifacts: ${artifactPlans.map((item) => item.title).join(', ')}.\n` : ''
                }Provide a professional and actionable final answer. Be concrete, structured, and slightly more detailed than a short summary. Use bullets if the task is about matching, planning, or evaluation.`;

          const finalStream = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content:
                  locale === 'zh'
                    ? '你是一个独立 Step Flow Demo 的最终回答器。请根据工具结果直接回答，不要暴露链路推理细节，不要编造信息。'
                    : 'You are the final answer generator for a standalone Step Flow demo. Answer directly from tool results without exposing chain-of-thought and without inventing facts.',
              },
              { role: 'user', content: finalPrompt },
            ],
            stream: true,
            temperature: 0.4,
            max_tokens: 1400,
          });

          let finalText = '';
          for await (const chunk of finalStream) {
            const text = chunk.choices[0]?.delta?.content ?? '';
            if (!text) continue;
            finalText += text;
            send(controller, { type: 'final_answer_chunk', content: text });
          }

          send(controller, {
            type: 'step_completed',
            stepId: 'final',
            title: locale === 'zh' ? '生成答案' : 'Generate answer',
            content: finalText.trim(),
          });
          send(controller, { type: 'done' });
          controller.close();
        } catch (e) {
          const message = e instanceof Error ? e.message : 'Request failed';
          send(controller, { type: 'error', error: message });
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
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Request failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
