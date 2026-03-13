'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ProjectExplainButton } from '@/components/project-explain-button';
import { cn } from '@/lib/utils';
import { useLocale } from '@/contexts/locale';
import { getResumeData } from '@/data/resume';

function isProjectValuePoint(point: string) {
  return point.startsWith('项目价值：') || point.startsWith('Project value:');
}

export default function AIProjectsPage() {
  const { locale, t } = useLocale();
  const resume = getResumeData(locale);
  const aiProjects = resume.projects.filter((p) => p.highlight);
  const projectCardContentClassName = 'p-5 pt-6 sm:p-6 sm:pt-6';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
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
          {t('aiProjects.backHome')}
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-cyan-400" />
          {t('aiProjects.title')}
        </h1>
        <p className="text-cyan-300/90 text-sm mt-2">{resume.title}</p>
        <span className="inline-flex items-center mt-2 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300">
          {resume.tagline}
        </span>
        <p className="text-slate-400 text-sm mt-3 max-w-3xl">{t('aiProjects.subtitle')}</p>
      </motion.div>

      <div className="space-y-5">
        {aiProjects.map((p, i) => {
          const projectValuePoint = p.points.find(isProjectValuePoint);
          const regularPoints = p.points.filter((point) => !isProjectValuePoint(point));

          return (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Card className="ring-1 ring-cyan-400/30 border-cyan-500/20">
                <CardContent className={projectCardContentClassName}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h2 className="font-semibold text-white">{p.name}</h2>
                    <ProjectExplainButton project={{ name: p.name, desc: p.desc, points: p.points }} />
                  </div>
                  <p className="text-sm text-slate-400 mt-1">{p.desc}</p>
                  <ul className="mt-2 space-y-1 text-slate-400 text-sm list-disc list-inside">
                    {regularPoints.map((point, k) => (
                      <li key={k}>{point}</li>
                    ))}
                  </ul>
                  {projectValuePoint && (
                    <div className="mt-3 rounded-xl border border-cyan-500/20 bg-cyan-500/8 px-3 py-2.5 text-sm leading-6 text-cyan-100">
                      {projectValuePoint}
                    </div>
                  )}
                  <p className="mt-2 text-xs text-cyan-400/80 font-mono">{p.stack}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
