/**
 * Resume data (English) — Senior Frontend Engineer / AI Frontend Architect
 * Structure: Summary, Tech Stack, Core Abilities, Experience, AI Projects, Architecture Summary
 */
export const resumeDataEn = {
  name: 'Liu Feng',
  title: 'Senior Frontend Engineer / AI Frontend Engineer',
  tagline: 'AI · Full-Stack',
  location: 'Nanshan, Shenzhen',
  birth: 'Nov 1999',
  phone: '17347032934',
  email: 'hyxnj666@gmail.com',

  summary:
    '5+ years of front-end development experience with full-cycle large-scale Web application development and front-end architecture design. Currently focused on front-end engineering for AI platforms and AI applications: LLM application development, AI workflow platforms, AI Agent systems, and multimodal AI product interaction and architecture. Strong AI product front-end architecture skills; familiar with front-end implementation of AI chat, knowledge base (RAG), AI workflow, and Agent systems; able to build highly scalable and maintainable AI platform products. Proficient in React/Vue, complex system architecture, component-based architecture, front-end engineering, performance optimization, and data visualization; experience with enterprise BI systems, real-time video surveillance, and health platforms.',

  education: {
    period: '2017.09 - 2021.06',
    school: 'Hunan Institute of Technology',
    major: 'Electronics and Information Engineering · B.E.',
  },

  techStack: [
    'AI application development: LLM application development; AI chat with streaming response (Streaming Rendering); AI Workflow (DAG) and AI Agent interaction design; AI knowledge base (RAG) front-end and vector/semantic search; multimodal AI (text-to-image, text-to-video); Prompt Engineering and AI interaction design.',
    'Front-end architecture: React, Vue.js; complex system architecture; enterprise front-end (component design, modular development, state management); Umi and Dva; large-scale module decomposition and scalability.',
    'Front-end engineering: Webpack build optimization and CI/CD; Git for collaboration; performance optimization, code splitting, and resource loading.',
    'Data visualization: Apache ECharts; AntV L7 for geo visualization; AntV ecosystem.',
    'Real-time video & streaming: video surveillance front-end; WebRTC; RTSP; video streaming and low-latency systems.',
    'Cross-platform: Uni-app for mini-program and H5; WeChat mini-program ecosystem and APIs.',
  ],

  coreAbilities: [
    'AI platform front-end architecture and module design for scalability and maintainability',
    'Build AI Workflow (DAG) visualization, flow orchestration, and node execution state sync and debugging',
    'Design and implement AI Agent UIs and multi-model call interaction layer',
    'AI knowledge base and RAG front-end integration and retrieval UX',
    'AI chat systems with streaming response (Streaming Rendering), Prompt config and debugging experience',
    'Admin component abstraction, state management, and engineering standards',
    'Performance optimization and monitoring for AI product responsiveness and stability',
  ],

  skills: [
    { label: 'AI application development', text: 'LLM application development; AI chat with streaming response (Streaming Rendering); AI Workflow (DAG) and AI Agent interaction design; AI knowledge base (RAG), vector and semantic search; multimodal AI (text-to-image, text-to-video); Prompt Engineering and AI interaction design.', highlight: true },
    { label: 'Front-end architecture', text: 'React, Vue.js; complex system architecture; enterprise front-end (component, modular, state management); Umi and Dva; large-scale module decomposition and scalability.', highlight: false },
    { label: 'Front-end engineering', text: 'Webpack build optimization and CI/CD; Git for collaboration; performance optimization, code splitting, and resource loading.', highlight: false },
    { label: 'Data visualization', text: 'ECharts; AntV L7 and AntV ecosystem for data visualization.', highlight: false },
    { label: 'Real-time video & streaming', text: 'Video surveillance front-end; WebRTC; RTSP; video streaming and low-latency systems.', highlight: false },
    { label: 'Cross-platform', text: 'Uni-app for mini-program and H5; WeChat mini-program ecosystem and APIs.', highlight: false },
  ],

  work: [
    {
      company: 'Dali International · AI Frontend Engineer',
      time: 'Present',
      stack: 'Vue3, TypeScript, Vite, Ant Design Vue, Pinia',
      highlight: true,
      points: [
        'Own AI platform overall front-end architecture design and technology selection; built modular front-end with Vue3 + TypeScript + Vite for scalability and development efficiency.',
        'Design and implement AI dialogue system front-end architecture with streaming response (Streaming Rendering) rendering, multi-turn context management, and high-concurrency message handling for AI UX.',
        'Build AI Workflow (DAG) visual flow editor with node-based architecture (Prompt Node, LLM Node, Tool Node), drag-and-drop orchestration, and execution debugging.',
        'Contribute to AI Agent system front-end; design Step Flow–style task execution UI with task decomposition, execution status tracking, and multi-tool invocation display.',
        'Integrate multiple AI model capabilities with unified invocation and UI for multimodal features (text-to-image, text-to-video).',
        'Build AI knowledge base (RAG) front-end module for knowledge retrieval, semantic search, and dialogue enhancement to improve answer accuracy.',
        'Design AI platform API interaction layer and WebSocket real-time communication for streaming AI responses and real-time task status updates.',
      ],
    },
    {
      company: 'Shenzhen Hygeia Bioscience · Frontend Developer',
      time: '2022.07 - Present (prior)',
      points: [
        'Led front-end architecture and full-cycle delivery for health product line: gene mini-program, agent H5, back-office; owned requirements, technical design, and launch.',
        'Introduced and adopted Vue3 and Uni-app; full ownership of gene mini-program and agent H5 architecture, core modules, and iteration; ensured scalability and maintainability.',
        'Built smart lab dashboard; back-office iteration and performance optimization; mentored interns and led code review and training.',
      ],
    },
    {
      company: 'Shenzhen Eccang Technology · Frontend Developer',
      time: '2021.07 - 2022.05',
      points: [
        'Owned mid-end and back-office front-end with Nuxt + TypeScript; contributed to data visualization and component library architecture.',
        'Full-cycle involvement in User Center, Listing, BI, and related projects: requirements, core module development, unit testing, and component library maintenance.',
      ],
    },
  ],

  projects: [
    {
      name: 'AI Intelligent Application Platform (Dali)',
      desc: 'Enterprise AI application platform providing AI chat, AI Workflow (DAG), AI Agent, and multimodal capabilities; supports building AI applications through visual tools.',
      stack: 'Vue3, TypeScript, Vite, Ant Design Vue, Pinia, WebSocket, AI API, Streaming Rendering',
      highlight: true,
      points: [
        'Own AI platform overall front-end architecture and technology selection; built modular front-end with Vue3 + TypeScript + Vite for scalability and efficiency.',
        'Design and implement AI dialogue system front-end architecture with streaming response (Streaming Rendering) rendering, multi-turn context management, and high-concurrency message handling.',
        'Build AI Workflow (DAG) visual flow editor with node-based architecture (Prompt Node, LLM Node, Tool Node), drag-and-drop orchestration, and execution debugging.',
        'Contribute to AI Agent system front-end; design Step Flow–style task execution UI with task decomposition, execution status tracking, and multi-tool invocation display.',
        'Integrate multiple AI model capabilities with unified invocation and UI for multimodal features (text-to-image, text-to-video).',
        'Build AI knowledge base (RAG) front-end module for knowledge retrieval, semantic search, and dialogue enhancement.',
        'Design AI platform API interaction layer and WebSocket real-time communication for streaming AI responses and real-time task status updates.',
        'Technical challenge: real-time sync and visualization of AI Workflow node execution status; WebSocket-based process execution log updates; state management for complex async tasks.',
      ],
    },
    {
      name: 'Hygeia Gene Mini-Program',
      desc: 'Main sales channel: product purchase, sample binding and return, report lookup, booking; full ownership of front-end architecture and delivery.',
      stack: 'Uni-app, Vue3, Canvas, WeChat Mini-Program API',
      points: [
        'Led full-cycle delivery: requirements, technical design, development, testing, and launch; owned front-end architecture and module design.',
        'Unified request layer and WeChat API integration; multi-end adaptation and data strategy; Canvas for image save and share; maintained UX and maintainability.',
      ],
    },
    {
      name: 'Health Agent H5',
      desc: 'Platform for sales, staff, and third-party: registration, mall, CRM, learning, exams, contracts, sample binding; full ownership of front-end architecture and core modules.',
      stack: 'Uni-app, Vue3, Canvas, WeChat API, third-party e-sign',
      points: [
        'Led system front-end architecture and core modules: login, mall, CRM, exams, contracts, certification, team management; ensured completeness and scalability.',
        'Integrated WeChat API for multi-image upload and video learning/exams; third-party e-sign; Canvas product cards and mini-program order flow for conversion and UX.',
      ],
    },
    {
      name: 'Haima Back-Office',
      desc: 'Enterprise back-office for mini-programs, reporting, and agents; finance, lab data, orders, and product management; full ownership of iteration and performance.',
      stack: 'Vue3, Element Plus, Axios',
      points: [
        'Led feature iteration and performance optimization; component abstraction and unified request layer; stable, maintainable operations and lab data handling.',
      ],
    },
    {
      name: 'BI Data Service (Six-Door)',
      desc: 'Enterprise multi-dimensional data visualization: order region and warehouse analysis, indicator dashboards, heat and flow maps with drill-down; contributed to requirements, design, and front-end delivery.',
      stack: 'React, Umi, Dva, Ant Design, L7, G2, Echarts',
      points: [
        'Requirements and process design; owned order region, warehouse analysis, and dashboards; heat maps, flow maps, and drill-down.',
        'Deep use of AntV L7; solved complex forms and data display; code and performance optimization; client training and support.',
      ],
    },
    {
      name: 'Robot Remote Monitoring System',
      desc: 'Mining robot real-time monitoring and control; Hikvision cameras; multi-channel preview, PTZ, alarm linkage; contributed to front-end architecture and video module delivery.',
      stack: 'Vue, Hikvision WebSDK (WebVideoCtrl), WebRTC, RTSP, ISAPI',
      points: [
        'Owned video monitoring module: Hikvision WebSDK for login, preview, multi-window, PTZ; ISAPI for RTSP; SDK and WebRTC streaming with latency under 300ms.',
        'Multi-stream playback and stability in weak networks; Vue embedded player, scroll, full-screen; integrated with production system and alarm push; alarm response reduced ~40%.',
      ],
    },
  ],

  architectureSummary:
    'Enterprise-level system architecture experience; led and contributed to front-end development of multiple large-scale systems: AI application platform, BI data analytics, health platform, video surveillance. Design focus: system scalability, modular architecture, high-performance front-end implementation, AI product interaction experience.',
};
