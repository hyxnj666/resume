'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, GitBranch, Sparkles } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { WorkflowCanvas } from '@/components/workflow/WorkflowCanvas';
import { cn } from '@/lib/utils';
import { useLocale } from '@/contexts/locale';

export default function WorkflowBuilderPage() {
  const { t, locale } = useLocale();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Link
          href="/ai-demo"
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'mb-4 -ml-2')}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          {t('aiDemo.backToDemos')}
        </Link>
        <div className="ai-hero-panel p-5 sm:p-6">
          <div className="ai-pill-badge relative z-[1]">
            <Sparkles className="h-3.5 w-3.5" />
            {t('aiDemo.workflowBadge')}
          </div>
          <h1 className="relative z-[1] mt-4 flex items-center gap-2 text-2xl font-bold text-white md:text-3xl">
            <GitBranch className="h-8 w-8 text-cyan-400" />
            {t('aiDemo.workflowPageTitle')}
          </h1>
          <p className="relative z-[1] mt-2 max-w-3xl text-sm leading-7 text-slate-300">{t('aiDemo.workflowPageSubtitle')}</p>
          <div className="relative z-[1] mt-5 grid gap-3 md:grid-cols-3">
            <div className="ai-stat-card p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{t('aiDemo.workflowHeroStat1Label')}</p>
              <p className="mt-2 text-sm font-medium text-white">{t('aiDemo.workflowHeroStat1Value')}</p>
            </div>
            <div className="ai-stat-card p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{t('aiDemo.workflowHeroStat2Label')}</p>
              <p className="mt-2 text-sm font-medium text-white">{t('aiDemo.workflowHeroStat2Value')}</p>
            </div>
            <div className="ai-stat-card p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{t('aiDemo.workflowHeroStat3Label')}</p>
              <p className="mt-2 text-sm font-medium text-white">{t('aiDemo.workflowHeroStat3Value')}</p>
            </div>
          </div>
        </div>
      </motion.header>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.04 }}
        className="ai-section-panel mb-4 p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{t('aiDemo.workflowHeroStat1Label')}</p>
            <h2 className="mt-2 text-lg font-semibold text-white">{t('aiDemo.workflowStudioTitle')}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-400">{t('aiDemo.workflowStudioDesc')}</p>
          </div>
          <span className="rounded-full border border-slate-700/90 bg-slate-950/75 px-3 py-1 text-xs text-slate-400">
            {t('aiDemo.workflowRunButton')}
          </span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="ai-stat-card p-4 text-sm text-slate-300">
            {t('aiDemo.workflowGuide1')}
          </div>
          <div className="ai-stat-card p-4 text-sm text-slate-300">
            {t('aiDemo.workflowGuide2')}
          </div>
          <div className="ai-stat-card p-4 text-sm text-slate-300">
            {t('aiDemo.workflowGuide3')}
          </div>
        </div>
      </motion.section>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="ai-section-panel p-4 md:p-5"
      >
        <WorkflowCanvas
          addNodeLabel={t('aiDemo.workflowAddNode')}
          runInputLabel={t('aiDemo.workflowRunInput')}
          runButtonLabel={t('aiDemo.workflowRunButton')}
          runResultTitle={t('aiDemo.workflowRunResultTitle')}
          runStepsTitle={t('aiDemo.workflowRunStepsTitle')}
          runEmptyHint={t('aiDemo.workflowRunEmptyHint')}
          runErrorPrefix={t('aiDemo.workflowRunErrorPrefix')}
          runRunningLabel={t('aiDemo.workflowRunRunning')}
          locale={locale}
          nodeConfigTitle={t('aiDemo.workflowNodeConfig')}
          nodeContentLabel={t('aiDemo.workflowNodeContent')}
          nodeContentPromptPlaceholder={t('aiDemo.workflowNodeContentPrompt')}
          nodeContentLLMPlaceholder={t('aiDemo.workflowNodeContentLLM')}
          nodeSystemPromptLabel={t('aiDemo.workflowNodeSystemPrompt')}
          nodeSystemPromptPlaceholder={t('aiDemo.workflowNodeSystemPromptHint')}
          nodeContentKnowledgePlaceholder={t('aiDemo.workflowNodeContentKnowledge')}
          nodeContentToolPlaceholder={t('aiDemo.workflowNodeContentTool')}
        />
      </motion.div>
    </div>
  );
}
