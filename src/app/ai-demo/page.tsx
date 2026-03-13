'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, BookOpen, Bot, BriefcaseBusiness, BrainCircuit, GitBranch, LayoutGrid, Play, Sparkles } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useLocale } from '@/contexts/locale';

const demos = [
  {
    key: 'agent',
    icon: Bot,
    titleKey: 'aiDemo.agentTitle',
    descKey: 'aiDemo.agentDesc',
    techKey: 'aiDemo.agentTech',
    valueKey: 'aiDemo.agentValue',
    proofKey: 'aiDemo.agentProof',
    bestForKey: 'aiDemo.agentBestFor',
    liveHref: '/ai-demo/agent',
    order: '01',
  },
  {
    key: 'knowledge',
    icon: BookOpen,
    titleKey: 'aiDemo.knowledgeTitle',
    descKey: 'aiDemo.knowledgeDesc',
    techKey: 'aiDemo.knowledgeTech',
    valueKey: 'aiDemo.knowledgeValue',
    proofKey: 'aiDemo.knowledgeProof',
    bestForKey: 'aiDemo.knowledgeBestFor',
    liveHref: '/ai-demo/knowledge',
    order: '02',
  },
  {
    key: 'workflow',
    icon: GitBranch,
    titleKey: 'aiDemo.workflowTitle',
    descKey: 'aiDemo.workflowDesc',
    nodesKey: 'aiDemo.workflowNodes',
    techKey: 'aiDemo.workflowTech',
    valueKey: 'aiDemo.workflowValue',
    proofKey: 'aiDemo.workflowProof',
    bestForKey: 'aiDemo.workflowBestFor',
    liveHref: '/ai-demo/workflow',
    order: '03',
  },
] as const;

const reviewerCards = [
  {
    key: 'hr',
    icon: BriefcaseBusiness,
    titleKey: 'aiDemo.reviewerHrTitle',
    descKey: 'aiDemo.reviewerHrDesc',
    focusKey: 'aiDemo.reviewerHrFocus',
    pathKey: 'aiDemo.reviewerHrPath',
  },
  {
    key: 'frontend',
    icon: LayoutGrid,
    titleKey: 'aiDemo.reviewerFrontendTitle',
    descKey: 'aiDemo.reviewerFrontendDesc',
    focusKey: 'aiDemo.reviewerFrontendFocus',
    pathKey: 'aiDemo.reviewerFrontendPath',
  },
  {
    key: 'ai',
    icon: BrainCircuit,
    titleKey: 'aiDemo.reviewerAiTitle',
    descKey: 'aiDemo.reviewerAiDesc',
    focusKey: 'aiDemo.reviewerAiFocus',
    pathKey: 'aiDemo.reviewerAiPath',
  },
] as const;

const whyCards = [
  {
    key: 'architecture',
    icon: LayoutGrid,
    titleKey: 'aiDemo.whyCard1Title',
    descKey: 'aiDemo.whyCard1Desc',
  },
  {
    key: 'aiux',
    icon: Bot,
    titleKey: 'aiDemo.whyCard2Title',
    descKey: 'aiDemo.whyCard2Desc',
  },
  {
    key: 'engineering',
    icon: GitBranch,
    titleKey: 'aiDemo.whyCard3Title',
    descKey: 'aiDemo.whyCard3Desc',
  },
] as const;

export default function AIDemoPage() {
  const { t } = useLocale();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Link
          href="/"
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'mb-4 -ml-2')}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          {t('projects.backHome')}
        </Link>

        <div className="ai-hero-panel p-5 sm:p-6">
          <div className="ai-pill-badge relative z-[1]">
            <Sparkles className="h-3.5 w-3.5" />
            {t('aiDemo.landingBadge')}
          </div>
          <div className="relative z-[1] mt-4 max-w-3xl">
            <h1 className="flex items-center gap-2 text-2xl font-bold text-white md:text-4xl">
              <LayoutGrid className="h-8 w-8 text-cyan-400" />
              {t('aiDemo.title')}
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-300 md:text-base">
              {t('aiDemo.landingIntro')}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/ai-demo/agent"
                className={cn(buttonVariants({ size: 'default' }))}
              >
                <Play className="h-4 w-4" />
                {t('aiDemo.landingPrimaryCta')}
              </Link>
              <Link
                href="/resume"
                className={cn(buttonVariants({ variant: 'secondary', size: 'default' }))}
              >
                {t('aiDemo.landingSecondaryCta')}
              </Link>
              <a
                href="#demo-grid"
                className={cn(buttonVariants({ variant: 'ghost', size: 'default' }))}
              >
                {t('aiDemo.landingTertiaryCta')}
              </a>
            </div>
          </div>
          <div className="relative z-[1] mt-6 grid gap-3 md:grid-cols-3">
            <div className="ai-stat-card p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{t('aiDemo.landingStat1Label')}</p>
              <p className="mt-2 text-lg font-semibold text-white">{t('aiDemo.landingStat1Value')}</p>
              <p className="mt-1 text-xs leading-6 text-slate-400">{t('aiDemo.landingStat1Desc')}</p>
            </div>
            <div className="ai-stat-card p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{t('aiDemo.landingStat2Label')}</p>
              <p className="mt-2 text-lg font-semibold text-white">{t('aiDemo.landingStat2Value')}</p>
              <p className="mt-1 text-xs leading-6 text-slate-400">{t('aiDemo.landingStat2Desc')}</p>
            </div>
            <div className="ai-stat-card p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{t('aiDemo.landingStat3Label')}</p>
              <p className="mt-2 text-lg font-semibold text-white">{t('aiDemo.landingStat3Value')}</p>
              <p className="mt-1 text-xs leading-6 text-slate-400">{t('aiDemo.landingStat3Desc')}</p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.04 }}
        className="ai-section-panel mb-8 p-5 sm:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">{t('aiDemo.whyTitle')}</h2>
            <p className="mt-1 max-w-3xl text-sm text-slate-400">{t('aiDemo.whyDesc')}</p>
          </div>
          <span className="rounded-full border border-slate-700/90 bg-slate-950/75 px-3 py-1 text-xs text-slate-400">
            {t('aiDemo.whyBadge')}
          </span>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {whyCards.map((card) => {
            const Icon = card.icon;

            return (
              <Card key={card.key} className="h-full border-cyan-500/16 bg-slate-900/55">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-cyan-500/12 p-2.5 ring-1 ring-inset ring-cyan-400/12">
                      <Icon className="h-5 w-5 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white">{t(card.titleKey)}</h3>
                      <p className="mt-2 text-sm leading-7 text-slate-400">{t(card.descKey)}</p>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06 }}
        className="ai-section-panel mb-8 p-5 sm:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">{t('aiDemo.landingGuideTitle')}</h2>
            <p className="mt-1 text-sm text-slate-400">{t('aiDemo.landingGuideDesc')}</p>
          </div>
          <span className="rounded-full border border-slate-700/90 bg-slate-950/75 px-3 py-1 text-xs text-slate-400">
            {t('aiDemo.landingGuideBadge')}
          </span>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {[1, 2, 3].map((step) => (
            <div key={step} className="ai-stat-card p-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-cyan-500/10 text-xs font-medium text-cyan-300">
                  {step}
                </span>
                <p className="text-sm font-medium text-white">{t(`aiDemo.landingGuideStep${step}Title`)}</p>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-400">{t(`aiDemo.landingGuideStep${step}Desc`)}</p>
            </div>
          ))}
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="ai-section-panel mb-8 p-5 sm:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">{t('aiDemo.reviewerTitle')}</h2>
            <p className="mt-1 text-sm text-slate-400">{t('aiDemo.reviewerDesc')}</p>
          </div>
          <span className="rounded-full border border-slate-700/90 bg-slate-950/75 px-3 py-1 text-xs text-slate-400">
            {t('aiDemo.reviewerBadge')}
          </span>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {reviewerCards.map((card) => {
            const Icon = card.icon;

            return (
              <Card key={card.key} className="h-full border-cyan-500/16 bg-slate-900/55">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-cyan-500/12 p-2.5 ring-1 ring-inset ring-cyan-400/12">
                      <Icon className="h-5 w-5 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white">{t(card.titleKey)}</h3>
                      <p className="mt-1 text-sm text-slate-400">{t(card.descKey)}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="ai-stat-card p-3">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{t('aiDemo.reviewerFocusLabel')}</p>
                    <p className="mt-2 text-sm leading-7 text-slate-200">{t(card.focusKey)}</p>
                  </div>
                  <div className="ai-stat-card p-3">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{t('aiDemo.reviewerPathLabel')}</p>
                    <p className="mt-2 text-sm leading-7 text-slate-300">{t(card.pathKey)}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </motion.section>

      <div id="demo-grid" className="mb-5 scroll-mt-24">
        <h2 className="text-lg font-semibold text-white">{t('aiDemo.landingGridTitle')}</h2>
        <p className="mt-1 text-sm text-slate-400">{t('aiDemo.landingGridDesc')}</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        {demos.map((demo, i) => {
          const Icon = demo.icon;
          return (
            <motion.div
              key={demo.key}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Card className="h-full overflow-hidden border-cyan-500/20 transition-all duration-200 hover:-translate-y-1 hover:border-cyan-500/36 hover:shadow-[0_28px_70px_-34px_rgba(34,211,238,0.42)]">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-cyan-500/12 p-2.5 ring-1 ring-inset ring-cyan-400/12">
                        <Icon className="h-5 w-5 text-cyan-400" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-white">{t(demo.titleKey)}</h2>
                        <p className="mt-1 text-xs text-slate-500">{t(demo.bestForKey)}</p>
                      </div>
                    </div>
                    <span className="rounded-full border border-slate-700/90 bg-slate-950/75 px-2.5 py-1 text-[11px] text-slate-400">
                      {demo.order}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm leading-relaxed text-slate-400">{t(demo.descKey)}</p>
                  <div className="ai-stat-card p-3">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{t('aiDemo.cardValueLabel')}</p>
                    <p className="mt-2 text-sm leading-7 text-slate-200">{t(demo.valueKey)}</p>
                  </div>
                  <div className="ai-stat-card p-3">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{t('aiDemo.cardProofLabel')}</p>
                    <p className="mt-2 text-sm leading-7 text-slate-300">{t(demo.proofKey)}</p>
                  </div>
                  {demo.key === 'workflow' && (
                    <p className="font-mono text-xs text-slate-500">{t('aiDemo.workflowNodes')}</p>
                  )}
                  <p className="text-xs font-medium text-cyan-400/90">{t(demo.techKey)}</p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Link
                      href={demo.liveHref}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/36 bg-cyan-500/14 px-3 py-1.5 text-xs font-medium text-cyan-300 transition-colors hover:bg-cyan-500/22"
                    >
                      <Play className="h-3.5 w-3.5" />
                      {t('aiDemo.liveDemo')}
                    </Link>
                    <span className="inline-flex items-center rounded-lg border border-slate-700/80 bg-slate-900/65 px-2.5 py-1 text-xs text-slate-400">
                      {t('aiDemo.techArch')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <ArrowRight className="h-3.5 w-3.5" />
                    {t('aiDemo.cardNextHint')}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
