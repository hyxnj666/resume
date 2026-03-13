'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Bot, FileText, FolderOpen, Sparkles } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
// import { DigitalHumanAvatar } from '@/components/digital-human-avatar';
import { cn } from '@/lib/utils';
import { useLocale } from '@/contexts/locale';
import { getResumeData } from '@/data/resume';

export default function HomePage() {
  const { locale, t } = useLocale();
  const resume = getResumeData(locale);
  const aiProjects = resume.projects.filter((p) => p.highlight);
  const otherProjects = resume.projects.filter((p) => !p.highlight).slice(0, 2);
  const projectCardContentClassName = 'p-5 pt-6 sm:p-6 sm:pt-6';

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
      {/* 数字人入口暂时隐藏，需要时取消注释即可 */}
      {/* <DigitalHumanAvatar /> */}
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center pb-16 border-b border-cyan-500/20"
      >
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-xs font-mono text-cyan-400/90 tracking-[0.3em] uppercase mb-3"
        >
          {resume.tagline}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-4xl md:text-6xl font-bold text-white mb-4"
          style={{ textShadow: '0 0 32px rgba(34, 211, 238, 0.3)' }}
        >
          {resume.name}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-lg md:text-xl text-slate-400 mb-2"
        >
          {resume.title}
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-sm text-cyan-400/80 mb-8"
        >
          {resume.location} · {resume.email}
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-wrap justify-center gap-3"
        >
          <Link
            href="/ask-ai"
            className={cn(buttonVariants({ size: 'lg' }), 'whitespace-nowrap')}
          >
            <Bot className="h-4 w-4" />
            {t('home.askAiAboutMe')}
          </Link>
          <Link
            href="/resume"
            className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'whitespace-nowrap')}
          >
            <FileText className="h-4 w-4" />
            {t('home.fullResume')}
          </Link>
        </motion.div>
      </motion.section>

      {/* About 摘要 */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="py-12"
      >
        <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
          <span className="w-1 h-6 bg-cyan-500 rounded-full" />
          {t('home.aboutMeTitle')}
        </h2>
        <p className="text-slate-400 leading-relaxed max-w-2xl">
          {t('home.aboutMeDesc')}
        </p>
      </motion.section>

      {/* AI 项目 */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="py-12"
      >
        <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-cyan-400" />
          {t('home.aiProjectsTitle')}
        </h2>
        <div className="space-y-4">
          {aiProjects.map((p, i) => (
            <Card key={p.name} className="overflow-hidden border-cyan-500/20 hover:border-cyan-500/40 transition-colors">
              <CardContent className={projectCardContentClassName}>
                <h3 className="font-semibold text-white">{p.name}</h3>
                <p className="text-sm text-slate-400 mt-1">{p.desc}</p>
                <p className="text-xs text-cyan-400/80 font-mono mt-2">{p.stack}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <Link
          href="/ai-projects"
          className={cn(buttonVariants({ variant: 'ghost' }), 'mt-4 whitespace-nowrap')}
        >
          {t('home.viewAllAiProjects')} <ArrowRight className="h-4 w-4" />
        </Link>
      </motion.section>

      {/* 其他项目 */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="py-12"
      >
        <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-cyan-400" />
          {t('home.projectsTitle')}
        </h2>
        <div className="space-y-4">
          {otherProjects.map((p) => (
            <Card key={p.name} className="overflow-hidden">
              <CardContent className={projectCardContentClassName}>
                <h3 className="font-semibold text-white">{p.name}</h3>
                <p className="text-sm text-slate-400 mt-1">{p.desc}</p>
                <p className="text-xs text-slate-500 font-mono mt-2">{p.stack}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <Link
          href="/projects"
          className={cn(buttonVariants({ variant: 'ghost' }), 'mt-4 whitespace-nowrap')}
        >
          {t('home.viewAllProjects')} <ArrowRight className="h-4 w-4" />
        </Link>
      </motion.section>

      {/* CTA */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="py-16 text-center"
      >
        <p className="text-slate-400 mb-4">{t('home.ctaDesc')}</p>
        <Link
          href="/ask-ai"
          className={cn(buttonVariants({ size: 'lg' }), 'whitespace-nowrap')}
        >
          <Bot className="h-5 w-5" />
          {t('home.askAiAboutMe')}
        </Link>
      </motion.section>
    </div>
  );
}
