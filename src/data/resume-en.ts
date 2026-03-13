/**
 * Resume data (English) — Senior Frontend Engineer / AI Frontend Architect
 * Structure: Summary, Tech Stack, Core Abilities, Experience, AI Projects, Architecture Summary
 */
export const resumeDataEn = {
  name: 'Liu Feng',
  title: 'Senior Frontend Engineer / AI Product Frontend Architect',
  tagline: 'Front-end architecture and product delivery for Agent, RAG, and Workflow systems',
  location: 'Nanshan, Shenzhen',
  birth: 'Nov 1999',
  phone: '17347032934',
  email: 'hyxnj666@gmail.com',

  summary:
    'Front-end engineer with 5+ years of experience across large-scale Web applications, complex interaction systems, and front-end architecture. My recent work has focused on AI platforms and AI-native product experiences, including LLM applications, workflow builders, agent systems, RAG-based knowledge products, and multimodal scenarios. I specialize in turning model capability into product-grade interfaces with strong interaction design, scalable state architecture, and maintainable front-end engineering. My broader background includes enterprise BI systems, real-time video platforms, and health-tech products built with React and Vue ecosystems.',

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
        'Owned overall front-end architecture and technical direction for the AI platform; built a modular Vue3 + TypeScript + Vite foundation that improved scalability, delivery efficiency, and feature reuse.',
        'Designed and implemented the AI chat experience with streaming rendering, multi-turn context handling, and high-concurrency message support, improving both usability and interaction stability.',
        'Built a visual AI Workflow (DAG) editor with node-based orchestration, execution debugging, and reusable workflow capabilities for more complex AI product scenarios.',
        'Contributed to the AI Agent experience with a Step Flow-style execution UI, making task decomposition, tool invocation, and execution status more visible and product-ready.',
        'Integrated multiple AI model capabilities behind a unified UI layer for multimodal features such as text-to-image and text-to-video, reducing expansion cost for new capabilities.',
        'Built the front-end module for the RAG knowledge system, improving answer usefulness, explainability, and practical business value through retrieval and semantic search.',
        'Designed the API interaction layer and WebSocket real-time communication mechanism, enabling streaming responses and live task-status updates across complex scenarios.',
      ],
    },
    {
      company: 'Shenzhen Hygeia Bioscience · Frontend Developer',
      time: '2022.07 - Present (prior)',
      points: [
        'Led front-end architecture and full-cycle delivery across the health-product line, including the gene mini-program, agent H5, and back-office system, ensuring stable delivery across multiple business systems.',
        'Introduced Vue3 and Uni-app into production and owned architecture, core modules, and iteration for major applications, improving scalability, delivery efficiency, and maintainability.',
        'Built a smart lab dashboard, drove back-office iteration and performance work, and mentored interns through code reviews and technical guidance to improve team execution.',
      ],
    },
    {
      company: 'Shenzhen Eccang Technology · Frontend Developer',
      time: '2021.07 - 2022.05',
      points: [
        'Owned front-end work across mid-end and back-office systems with Nuxt + TypeScript, contributing to data-visualization modules and shared component-library architecture.',
        'Worked across User Center, Listing, BI, and related projects from requirements through core-module delivery and testing, while continuously improving the shared component library for faster team delivery.',
      ],
    },
  ],

  projects: [
    {
      name: 'AI Intelligent Application Platform (Dali)',
      desc: 'An enterprise AI application platform covering AI chat, Workflow (DAG), Agent, and multimodal capabilities, designed to support rapid AI product building through reusable visual tooling.',
      stack: 'Vue3, TypeScript, Vite, Ant Design Vue, Pinia, WebSocket, AI API, Streaming Rendering',
      highlight: true,
      points: [
        'Owned overall front-end architecture and technical direction for the platform, building a modular foundation that improved scalability, delivery efficiency, and feature reuse.',
        'Designed and implemented the AI chat experience with streaming rendering, multi-turn context handling, and high-concurrency message support, improving usability and interaction stability.',
        'Built a visual Workflow (DAG) editor with node-based orchestration and execution debugging, supporting more complex AI use cases while turning workflow capability into a reusable platform asset.',
        'Contributed to the AI Agent experience with a Step Flow-style execution UI, making task decomposition, tool invocation, and execution visibility more product-ready.',
        'Integrated multiple model capabilities behind a unified UI layer for multimodal scenarios, reducing the cost of onboarding new AI features.',
        'Built the front-end module for the RAG knowledge system, improving answer usefulness, explainability, and business readiness.',
        'Designed the API interaction layer and WebSocket real-time communication mechanism, enabling streaming responses and live task-status updates across complex interaction scenarios.',
        'Technical challenge: implemented real-time synchronization and visualization of workflow node execution state through WebSocket-based logs, improving debugging efficiency for asynchronous process execution.',
        'Project value: unified AI chat, workflow, agent, and multimodal capabilities behind one platform entry, improving reuse of AI capabilities while creating a sustainable front-end foundation for future business expansion.',
      ],
    },
    {
      name: 'Hygeia Gene Mini-Program',
      desc: 'The company’s core sales mini-program, supporting product purchase, sample workflows, report lookup, and consultation booking, with full ownership of front-end architecture and delivery.',
      stack: 'Uni-app, Vue3, Canvas, WeChat Mini-Program API',
      points: [
        'Led full-cycle delivery from requirements through launch, owning front-end architecture and module design to keep delivery stable and aligned with business timelines.',
        'Unified the request layer and WeChat capability integration, optimized multi-end adaptation and request strategy, and improved maintainability while preserving a smooth user experience.',
        'Project value: supported the online operation of core sales and service journeys, giving the business a lighter and more scalable way to handle purchase, report, and consultation scenarios.',
      ],
    },
    {
      name: 'Health Agent H5',
      desc: 'A multi-role business platform for sales teams, employees, and third-party users, with full ownership of front-end architecture and core-module delivery.',
      stack: 'Uni-app, Vue3, Canvas, WeChat API, third-party e-sign',
      points: [
        'Led front-end architecture and core-module delivery across login, mall, CRM, exams, contracts, certification, and team management, supporting multiple business scenarios with a scalable structure.',
        'Integrated WeChat APIs for media upload and learning flows, connected third-party e-signing, and used Canvas product cards to support mini-program ordering, improving both conversion flow and user experience.',
        'Project value: connected sales, learning, signing, and customer-management workflows in one product, improving multi-role collaboration and strengthening the platform’s ability to support future business growth.',
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
