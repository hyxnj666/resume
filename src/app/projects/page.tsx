'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useLocale } from '@/contexts/locale';
import { getResumeData } from '@/data/resume';

export default function ProjectsPage() {
  const { locale, t } = useLocale();
  const resume = getResumeData(locale);

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
          {t('projects.backHome')}
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-white">{t('projects.title')}</h1>
        <p className="text-slate-400 text-sm mt-1">{t('projects.subtitle')}</p>
      </motion.div>

      <div className="space-y-5">
        {resume.projects.map((p, i) => (
          <motion.div
            key={p.name}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <Card className={p.highlight ? 'ring-1 ring-cyan-400/30' : ''}>
              <CardContent className="p-5">
                <h2 className="font-semibold text-white">{p.name}</h2>
                <p className="text-sm text-slate-400 mt-1">{p.desc}</p>
                <ul className="mt-2 space-y-1 text-slate-400 text-sm list-disc list-inside">
                  {p.points.map((point, k) => (
                    <li key={k}>{point}</li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-cyan-400/80 font-mono">{p.stack}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
