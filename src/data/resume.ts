import type { Locale } from '@/contexts/locale';
import { maskPhone } from '@/lib/utils';
import { resumeDataEn } from './resume-en';

/**
 * 简历数据（中文）：高级前端工程师 / AI 前端架构师
 * 结构：个人简介、技术栈、核心能力、工作经历、AI项目经验、架构能力总结
 */
export const resumeData = {
  name: '刘峰',
  title: '高级前端开发工程师 / AI 大前端架构工程师',
  tagline: '面向 Agent / RAG / Workflow 的 AI 产品前端架构与交付',
  location: '深圳市南山区',
  birth: '1999年11月',
  phone: '17347032934',
  email: 'hyxnj666@gmail.com',

  /** 个人简介（升级版，偏高级前端 + AI 大前端） */
  summary:
    '5+ 年前端开发经验，具备完整的大型 Web 应用开发与前端架构设计经验。当前主要从事 AI 平台与 AI 应用的前端工程化建设，专注于 LLM 应用开发、AI 工作流平台、AI Agent 系统以及多模态 AI 产品的交互与架构实现。具备 AI 产品前端架构设计能力，熟悉 AI 对话系统、知识库(RAG)、AI 工作流(Workflow)、智能体(Agent)等系统的前端实现方式，能够构建高可扩展、可维护的 AI 平台型产品。在前端工程领域，熟练掌握 React/Vue 技术体系，具备复杂系统架构设计经验，熟悉组件化架构、前端工程化、性能优化以及数据可视化开发；曾参与企业级 BI 系统、实时视频监控系统和大健康平台开发。',

  education: {
    period: '2017.09 - 2021.06',
    school: '湖南工学院',
    major: '电子信息工程 · 本科',
  },

  /** 技术栈（升级版：按参考分块） */
  techStack: [
    'AI 应用开发：熟悉 LLM 应用开发流程，具备 AI 对话系统与流式响应(Streaming Rendering)前端开发经验；熟悉 AI 工作流(DAG Workflow)与 AI Agent(智能体)交互系统设计；具备 AI 知识库(RAG)系统前端开发经验，理解向量检索与语义搜索流程；熟悉 AI 多模态应用集成（文生图、文生视频等）；熟悉 Prompt Engineering 与 AI 应用交互设计。',
    '前端架构能力：熟练掌握 React、Vue.js 技术体系，具备复杂系统架构设计经验；熟悉企业级前端架构方案（组件化设计、模块化开发与状态管理）；熟悉 Umi 与 Dva 企业级开发框架；熟悉大型系统模块拆分与工程结构设计，具备良好的可扩展性设计能力。',
    '前端工程化：熟悉前端工程化体系，包括 Webpack 构建优化与 CI/CD 流程；熟练使用 Git 进行团队协作开发；熟悉前端性能优化、代码拆分与资源加载优化。',
    '数据可视化：熟悉数据可视化系统开发，熟练使用 Apache ECharts；熟悉地理数据可视化框架 AntV L7；熟悉 AntV 生态数据可视化体系。',
    '实时视频与流媒体：熟悉视频监控系统前端开发；熟练 WebRTC 实时通信技术；熟练 RTSP 视频流协议；具备视频流播放与低延迟视频系统开发经验。',
    '跨端开发：熟练使用 Uni-app 进行小程序与 H5 应用开发；熟悉微信小程序生态及相关 API。',
  ],

  /** 核心能力（架构师级，与参考一致） */
  coreAbilities: [
    'AI 平台前端架构设计与系统模块拆分，保障可扩展性与可维护性',
    '构建 AI 工作流(DAG)可视化系统与流程编排、节点执行状态同步与调试',
    '设计并实现 AI Agent 操作界面与多模型调用交互层',
    'AI 知识库与 RAG 系统前端集成与检索体验优化',
    'AI 对话系统与流式响应(Streaming Rendering)、Prompt 配置与调试体验',
    '中后台组件抽象、状态管理与工程化规范落地',
    '高性能优化与监控，保障 AI 产品响应与稳定性',
  ],

  skills: [
    { label: 'AI 应用开发', text: '熟悉 LLM 应用开发流程，具备 AI 对话系统与流式响应(Streaming Rendering)前端开发经验；熟悉 AI 工作流(DAG Workflow)与 AI Agent(智能体)交互系统设计；具备 AI 知识库(RAG)系统前端开发经验，理解向量检索与语义搜索；熟悉 AI 多模态应用集成（文生图、文生视频）；熟悉 Prompt Engineering 与 AI 应用交互设计。', highlight: true },
    { label: '前端架构能力', text: '熟练掌握 React、Vue.js 技术体系，具备复杂系统架构设计经验；熟悉企业级前端架构（组件化、模块化、状态管理）、Umi 与 Dva；熟悉大型系统模块拆分与工程结构设计，具备良好的可扩展性设计能力。', highlight: false },
    { label: '前端工程化', text: '熟悉前端工程化体系，包括 Webpack 构建优化与 CI/CD 流程；熟练使用 Git 进行团队协作；熟悉前端性能优化、代码拆分与资源加载优化。', highlight: false },
    { label: '数据可视化', text: '熟悉数据可视化系统开发，熟练使用 Apache ECharts；熟悉地理数据可视化框架 AntV L7 与 AntV 生态。', highlight: false },
    { label: '实时视频与流媒体', text: '熟悉视频监控系统前端开发；熟练 WebRTC 实时通信与 RTSP 视频流协议；具备视频流播放与低延迟视频系统开发经验。', highlight: false },
    { label: '跨端开发', text: '熟练使用 Uni-app 进行小程序与 H5 应用开发；熟悉微信小程序生态及相关 API。', highlight: false },
  ],

  work: [
    {
      company: '达利国际 · AI 前端开发工程师',
      time: '至今',
      stack: 'Vue3、TypeScript、Vite、Ant Design Vue、Pinia',
      highlight: true,
      points: [
        '负责 AI 平台整体前端架构设计与技术选型，基于 Vue3 + TypeScript + Vite 构建模块化前端架构，提升系统可扩展性、团队协作效率与后续功能复用能力。',
        '设计并实现 AI 对话系统前端架构，实现流式响应(Streaming Rendering)渲染机制，支持多轮上下文管理与高并发消息处理，持续优化核心 AI 交互体验与响应稳定性。',
        '构建 AI Workflow(DAG)可视化流程编辑器，基于节点化架构实现 Prompt Node、LLM Node、Tool Node 等流程节点，支撑复杂流程编排、执行调试与平台化能力沉淀。',
        '参与 AI Agent(智能体)系统前端开发，设计类 Step Flow 的任务执行界面，实现任务拆解、执行状态追踪与多工具调用展示，提升执行链路可视性与产品完成度。',
        '集成多种 AI 模型能力，实现文生图、文生视频等多模态 AI 功能的统一调用与交互界面设计，降低多模型接入与功能扩展成本。',
        '构建 AI 知识库(RAG)系统前端模块，实现知识检索、语义搜索与对话增强能力，提升回答可用性、可解释性与业务落地价值。',
        '设计 AI 平台的 API 交互层与 WebSocket 实时通信机制，实现 AI 响应流式输出与实时任务状态更新，增强系统实时性与复杂场景下的交互一致性。',
      ],
    },
    {
      company: '深圳海普洛斯生物科技有限公司 · 前端开发',
      time: '2022.07 - 至今（简历前）',
      points: [
        '负责大健康业务线前端架构与全程交付，包括海普基因小程序、代理商 H5 及海码后台，从需求分析、技术方案到开发上线均由本人主导或独立完成，保障多个业务系统稳定迭代。',
        '引入并落地 Vue3、Uni-app 等技术栈，全程负责海普基因小程序与大健康 H5 的架构设计、核心模块开发与迭代，提升项目可扩展性、交付效率与后续维护性。',
        '搭建智能实验室大屏可视化项目，负责后台功能迭代与性能优化，带领实习生参与开发并进行技术评审与培训，提升团队协作与项目落地效率。',
      ],
    },
    {
      company: '深圳易仓科技有限公司 · 前端开发',
      time: '2021.07 - 2022.05',
      points: [
        '负责中台与后台项目的前端开发与维护，使用 Nuxt + TypeScript 构建，参与数据可视化与组件库的架构与落地，提升中后台模块复用度与开发规范性。',
        '全程参与用户中心、Listing、六扇门 BI、极客选品等项目的需求分析、核心模块开发与单元测试，持续维护与优化前端组件库，支撑多个业务模块高效交付。',
      ],
    },
  ],

  projects: [
    {
      name: 'AI 智能应用平台（达利国际）',
      desc: '构建企业级 AI 应用平台，为用户提供 AI 对话、AI Workflow(DAG)、AI Agent 与多模态能力，支持通过可视化方式快速构建 AI 应用，并沉淀平台化复用能力。',
      stack: 'Vue3、TypeScript、Vite、Ant Design Vue、Pinia、WebSocket、AI API、Streaming Rendering',
      highlight: true,
      points: [
        '负责 AI 平台整体前端架构设计与技术选型，基于 Vue3 + TypeScript + Vite 构建模块化前端架构，提升系统可扩展性、研发效率与后续模块复用能力。',
        '设计并实现 AI 对话系统前端架构，实现流式响应(Streaming Rendering)渲染机制，支持多轮上下文管理与高并发消息处理，优化核心交互体验与系统稳定性。',
        '构建 AI Workflow(DAG)可视化流程编辑器，基于节点化架构实现 Prompt Node、LLM Node、Tool Node 等流程节点，支撑复杂流程编排、执行调试与能力平台化沉淀。',
        '参与 AI Agent(智能体)系统前端开发，设计类 Step Flow 的任务执行界面，实现任务拆解、执行状态追踪与多工具调用展示，提升执行链路可视性与产品完成度。',
        '集成多种 AI 模型能力，实现文生图、文生视频等多模态 AI 功能的统一调用与交互界面设计，降低新能力接入与扩展成本。',
        '构建 AI 知识库(RAG)系统前端模块，实现知识检索、语义搜索与对话增强能力，提升回答可用性、可解释性与业务落地价值。',
        '设计 AI 平台的 API 交互层与 WebSocket 实时通信机制，实现 AI 响应流式输出与实时任务状态更新，增强复杂场景下的实时交互一致性。',
        '技术挑战：实现 AI Workflow 节点执行状态的实时同步与可视化，通过 WebSocket 实现流程执行日志实时更新，解决复杂异步任务下的状态管理问题，提升流程调试效率。',
        '项目价值：将 AI 对话、Workflow、Agent 与多模态能力整合为统一平台入口，提升 AI 能力复用效率，并为后续业务场景扩展提供可持续的前端底座。',
      ],
    },
    {
      name: '海普基因小程序',
      desc: '公司主销售平台，支持产品购买、样本绑定与回寄、报告查询、预约咨询等，全程由本人负责前端架构与交付，支撑核心业务线上化运行。',
      stack: 'Uni-app、Vue3、Canvas、微信小程序 API',
      points: [
        '全程负责需求分析、技术方案设计、开发、测试与上线，独立完成项目前端架构与模块拆分，保障项目按业务节奏稳定交付。',
        '统一封装请求层与微信开放能力，优化多端适配与数据请求策略，使用 Canvas 实现图片保存与分享等交互，提升使用体验并降低后续维护成本。',
        '项目价值：支撑核心销售与服务链路线上化，帮助业务以更轻的运营方式承载产品购买、报告查询与咨询预约等关键场景。',
      ],
    },
    {
      name: '大健康代理商 H5',
      desc: '面向销售、员工与第三方客户的综合业务平台，含注册、商城、客户管理、学习考试、签约、样本绑定等，全程由本人负责前端架构与核心模块交付，支撑多角色业务协同。',
      stack: 'Uni-app、Vue3、Canvas、微信 API、第三方签约',
      points: [
        '全程负责系统前端架构设计与核心模块开发，主导登录注册、商城、客户管理、考试、签约、认证与团队管理等模块，保障多业务场景下的功能完整与可扩展性。',
        '集成微信 API 实现多图上传与视频学习/考试，对接第三方实现在线签约；使用 Canvas 生成产品卡片，支持扫码跳转小程序下单，提升转化效率与交互体验。',
        '项目价值：打通销售、学习、签约与客户管理等关键业务链路，提升多角色协同效率，并增强平台对业务扩展的承载能力。',
      ],
    },
    {
      name: '海码后台系统',
      desc: '面向小程序、报表与代理商的企业级后台管理平台，支持财务与实验室数据、订单与产品管理，全程由本人负责功能迭代与性能优化。',
      stack: 'Vue3、Element Plus、Axios',
      points: [
        '全程负责系统功能迭代与性能优化，完成组件抽象与请求层统一封装，保障运营与实验室数据操作高效、稳定、可维护。',
      ],
    },
    {
      name: '六扇门 BI 数据服务',
      desc: '企业级多维数据可视化分析系统，支持订单区域分析、仓库分析及指标仪表盘，热力图、流向图与下钻，全程参与需求、设计与前端开发。',
      stack: 'React、Umi、Dva、Ant Design、L7、G2、Echarts',
      points: [
        '参与需求分析与业务流程设计，负责订单区域分析、仓库分析及指标仪表盘等模块的前端架构与开发，实现热力图、流向图展示与下钻能力。',
        '深入研究 AntV L7 地图组件，攻克复杂表单与数据展示难题；完成代码与性能优化，并对客户进行系统培训与技术支持。',
      ],
    },
    {
      name: '机器人远程监控系统',
      desc: '矿区机器人实时监控与操控平台，对接海康威视摄像头，多路视频预览、云台控制与告警联动，全程参与前端架构与视频模块交付。',
      stack: 'Vue、海康 WebSDK（WebVideoCtrl）、WebRTC、RTSP、ISAPI',
      points: [
        '负责视频监控模块前端架构与实现：基于海康 WebSDK 完成摄像头登录、实时预览、多窗口切换与云台控制；结合 ISAPI 获取 RTSP 地址，支持 SDK 与 WebRTC 双路拉流，将视频延迟控制在 300ms 内。',
        '实现多路视频同播与弱网下的画面稳定；Vue 端实现嵌入式视频窗口、区域滚动与全屏播放，将监控模块接入矿区生产管理系统，与机器人控制及告警推送联动，告警响应时间缩短约 40%。',
      ],
    },
  ],

  /** 架构能力总结（与参考一致：企业级经验 + 重点关注） */
  architectureSummary:
    '具备企业级系统架构经验，参与并主导多个大型系统前端开发，包括：AI 应用平台、BI 数据分析系统、大健康平台系统、视频监控系统。在系统设计中重点关注：系统可扩展性、模块化架构设计、高性能前端实现、AI 产品交互体验。',
};

export type ResumeData = typeof resumeData;

export function getResumeData(locale: Locale): ResumeData {
  return locale === 'en' ? (resumeDataEn as ResumeData) : resumeData;
}

function parseBirthToYearMonth(birth: string): { year: number; month: number } | null {
  const zhMatch = birth.match(/(\d{4})年\s*(\d{1,2})月?/);
  if (zhMatch) {
    return { year: Number(zhMatch[1]), month: Number(zhMatch[2]) };
  }

  const enMatch = birth.match(
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})\b/i
  );
  if (enMatch) {
    const monthMap: Record<string, number> = {
      jan: 1,
      feb: 2,
      mar: 3,
      apr: 4,
      may: 5,
      jun: 6,
      jul: 7,
      aug: 8,
      sep: 9,
      oct: 10,
      nov: 11,
      dec: 12,
    };
    return { year: Number(enMatch[2]), month: monthMap[enMatch[1].slice(0, 3).toLowerCase()] };
  }

  return null;
}

function getCurrentAgeFromBirth(birth: string, now = new Date()): number | null {
  const parsed = parseBirthToYearMonth(birth);
  if (!parsed) return null;

  let age = now.getFullYear() - parsed.year;
  const currentMonth = now.getMonth() + 1;
  if (currentMonth < parsed.month) {
    age -= 1;
  }
  return age;
}

function formatCurrentDate(locale: Locale, now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return locale === 'en' ? `${year}-${month}-${day}` : `${year}-${month}-${day}`;
}

export function getResumeSummaryForAI(locale: Locale = 'zh'): string {
  const d = getResumeData(locale);
  const workStr = d.work.map((w) => `- ${w.company}（${w.time}）：${w.points.join(' ')}`).join('\n');
  const projStr = d.projects.map((p) => `- ${p.name}：${p.desc}；技术栈：${p.stack}`).join('\n');
  const skillsStr = d.skills.map((s) => `${s.label}: ${s.text}`).join('\n');
  const summary = 'summary' in d ? (d as ResumeData).summary : '';
  const core = 'coreAbilities' in d ? (d as ResumeData).coreAbilities?.join('；') : '';
  const arch = 'architectureSummary' in d ? (d as ResumeData).architectureSummary : '';
  const currentDate = formatCurrentDate(locale);
  const currentAge = getCurrentAgeFromBirth(d.birth);

  const zhPrompt = `你是刘峰个人简历的 AI 助手。请仅根据以下简历信息回答用户关于刘峰的问题，不要编造内容。若问题与简历无关，可礼貌说明你只回答与刘峰职业经历、技能、项目相关的问题。

【回答要求】
当前日期：${currentDate}
${currentAge !== null ? `年龄请以“${currentAge}岁”为准，不要自行估算或猜测。` : '如果用户问年龄，只能基于已知信息谨慎回答。'}

【个人简介】
${summary}

【基本信息】
姓名：${d.name}
求职意向：${d.title}（${d.tagline}）
现居住地：${d.location}；出生：${d.birth}${currentAge !== null ? `；当前年龄：${currentAge}岁` : ''}
联系方式：电话 ${maskPhone(d.phone)}，邮箱 ${d.email}

【教育】
${d.education.period} ${d.education.school} ${d.education.major}

【核心能力】
${core}

【职业技能】
${skillsStr}

【工作经历】
${workStr}

【项目经历】
${projStr}

【架构能力总结】
${arch}

请用简洁、专业的中文回答。`;

  const enPrompt = `You are an AI assistant for Liu Feng's resume. Answer only based on the resume below. Do not invent information. If the question is unrelated, say you only answer questions about his experience, skills, and projects.

【Answer rules】
Current date: ${currentDate}
${currentAge !== null ? `If the user asks about age, use "${currentAge}" as the current age. Do not estimate.` : 'If the user asks about age, answer cautiously based only on known information.'}

【Summary】
${summary}

【Basic Info】
Name: ${d.name}
Title: ${d.title} (${d.tagline})
Location: ${d.location}; Birth: ${d.birth}${currentAge !== null ? `; Current age: ${currentAge}` : ''}
Contact: ${maskPhone(d.phone)}, ${d.email}

【Education】
${d.education.period} ${d.education.school} ${d.education.major}

【Core Abilities】
${core}

【Skills】
${skillsStr}

【Experience】
${workStr}

【Projects】
${projStr}

【Architecture Summary】
${arch}

Reply in concise, professional English.`;

  return locale === 'en' ? enPrompt : zhPrompt;
}
