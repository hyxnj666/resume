'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { useLocale } from '@/contexts/locale';
import { getResumeData } from '@/data/resume';
import type { ResumeData } from '@/data/resume';
import { Card, CardContent } from '@/components/ui/card';
import { ProjectExplainButton } from '@/components/project-explain-button';
import { cn, maskPhone } from '@/lib/utils';

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4 },
  }),
};

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

function isProjectValuePoint(point: string) {
  return point.startsWith('项目价值：') || point.startsWith('Project value:');
}

function Section({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.section
      id={id}
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={sectionVariants}
      className="mb-12 md:mb-16 relative z-10"
    >
      <motion.h2
        variants={fadeInUp}
        custom={0}
        className="text-lg md:text-xl font-bold text-slate-100 flex items-center gap-3 mb-5"
      >
        <span className="w-1 h-6 bg-gradient-to-b from-cyan-400 to-cyan-600 rounded-full" />
        <span className="tracking-wide">{title}</span>
      </motion.h2>
      {children}
    </motion.section>
  );
}

export default function ResumePage() {
  const { locale, t } = useLocale();
  const d = getResumeData(locale) as ResumeData;
  const sep = locale === 'en' ? ': ' : '：';
  const aiProjects = d.projects.filter((p) => p.highlight);
  const otherProjects = d.projects.filter((p) => !p.highlight);
  const resumeCardContentClassName = 'p-5 pt-7 sm:p-6 sm:pt-7';
  const projectCardContentClassName = 'p-5 pt-6 sm:p-6 sm:pt-6';

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 md:py-14">
      <motion.header
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="pb-10 mb-10 border-b border-cyan-500/20"
      >
        <p className="text-xs font-mono text-cyan-400/90 tracking-[0.3em] uppercase mb-3">{t('resume.resumeLabel')}</p>
        <h1 className="text-3xl md:text-5xl font-bold text-white glow-text">{d.name}</h1>
        <p className="text-cyan-300 font-medium mt-2">{d.title}</p>
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 mt-2">
          {d.tagline}
        </span>
        <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-400">
          <li>{t('resume.location')}{sep}{d.location}</li>
          <li>{t('resume.birth')}{sep}{d.birth}</li>
          <li>{t('resume.phone')}{sep}{maskPhone(d.phone)}</li>
          <li>{t('resume.email')}{sep}{d.email}</li>
        </ul>
      </motion.header>

      {d.summary && (
        <Section title={t('resume.personalSummary')}>
          <motion.div variants={fadeInUp} custom={0}>
            <Card>
              <CardContent className={resumeCardContentClassName}>
                <p className="text-slate-300 text-sm leading-relaxed">{d.summary}</p>
              </CardContent>
            </Card>
          </motion.div>
        </Section>
      )}

      <Section title={t('resume.education')}>
        <motion.div variants={fadeInUp} custom={0}>
          <Card>
            <CardContent className={resumeCardContentClassName}>
              <p className="text-slate-400 text-sm">{d.education.period}</p>
              <p className="font-semibold text-white mt-1">{d.education.school}</p>
              <p className="text-slate-400 text-sm mt-0.5">{d.education.major}</p>
            </CardContent>
          </Card>
        </motion.div>
      </Section>

      {d.techStack && d.techStack.length > 0 && (
        <Section title={t('resume.techStack')}>
          <Card>
            <CardContent className={resumeCardContentClassName}>
              <ul className="space-y-2 text-slate-300 text-sm">
                {d.techStack.map((line, i) => (
                  <motion.li key={i} variants={fadeInUp} custom={i} className="flex gap-2">
                    <span className="text-cyan-400/80 shrink-0">·</span>
                    <span>{line}</span>
                  </motion.li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </Section>
      )}

      {d.coreAbilities && d.coreAbilities.length > 0 && (
        <Section title={t('resume.coreAbilities')}>
          <Card>
            <CardContent className={resumeCardContentClassName}>
              <ul className="space-y-2 text-slate-300 text-sm">
                {d.coreAbilities.map((line, i) => (
                  <motion.li key={i} variants={fadeInUp} custom={i} className="flex gap-2">
                    <span className="text-cyan-400/80 shrink-0">·</span>
                    <span>{line}</span>
                  </motion.li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </Section>
      )}

      <Section title={t('resume.skills')}>
        <Card>
          <CardContent className={resumeCardContentClassName}>
            <ul className="space-y-2.5 text-slate-300 text-sm">
              {d.skills.map((s, i) => (
                <motion.li key={s.label} variants={fadeInUp} custom={i} className={cn(s.highlight && 'text-cyan-200/90')}>
                  <strong className="text-slate-200">{s.label}{sep}</strong>
                  {s.text}
                </motion.li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </Section>

      <Section title={t('resume.work')}>
        <div className="space-y-5">
          {d.work.map((job, j) => (
            <motion.div key={job.company} variants={fadeInUp} custom={j}>
              <Card className={cn(job.highlight && 'ring-1 ring-cyan-400/30')}>
                <CardContent className={resumeCardContentClassName}>
                  <div className="flex flex-wrap justify-between items-baseline gap-2">
                    <p className="font-semibold text-white">{job.company}</p>
                    <p className="text-xs text-slate-500">{job.time}</p>
                  </div>
                  <ul className="mt-3 space-y-1.5 text-slate-400 text-sm list-disc list-inside">
                    {job.points.map((point, k) => (
                      <li key={k}>{point}</li>
                    ))}
                  </ul>
                  {'stack' in job && job.stack && (
                    <p className="mt-2 text-xs text-cyan-400/80 font-mono">{job.stack}</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </Section>

      {aiProjects.length > 0 && (
        <Section title={t('resume.aiProjectsExp')}>
          <div className="space-y-5">
            {aiProjects.map((proj, j) => {
              const projectValuePoint = proj.points.find(isProjectValuePoint);
              const regularPoints = proj.points.filter((point) => !isProjectValuePoint(point));

              return (
                <motion.div key={proj.name} variants={fadeInUp} custom={j}>
                  <Card className="ring-1 ring-cyan-400/30">
                    <CardContent className={projectCardContentClassName}>
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="font-semibold text-white">{proj.name}</p>
                        <ProjectExplainButton project={{ name: proj.name, desc: proj.desc, points: proj.points }} />
                      </div>
                      <p className="text-sm text-slate-400 mt-1">{proj.desc}</p>
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
                      <p className="mt-2 text-xs text-cyan-400/80 font-mono">{proj.stack}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </Section>
      )}

      {otherProjects.length > 0 && (
        <Section title={t('resume.otherProjects')}>
          <div className="space-y-5">
            {otherProjects.map((proj, j) => {
              const projectValuePoint = proj.points.find(isProjectValuePoint);
              const regularPoints = proj.points.filter((point) => !isProjectValuePoint(point));

              return (
                <motion.div key={proj.name} variants={fadeInUp} custom={j}>
                  <Card>
                    <CardContent className={projectCardContentClassName}>
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="font-semibold text-white">{proj.name}</p>
                        <ProjectExplainButton project={{ name: proj.name, desc: proj.desc, points: proj.points }} />
                      </div>
                      <p className="text-sm text-slate-400 mt-1">{proj.desc}</p>
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
                      <p className="mt-2 text-xs text-cyan-400/80 font-mono">{proj.stack}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </Section>
      )}

      {d.architectureSummary && (
        <Section title={t('resume.architectureSummary')}>
          <motion.div variants={fadeInUp} custom={0}>
            <Card>
              <CardContent className={resumeCardContentClassName}>
                <p className="text-slate-300 text-sm leading-relaxed">{d.architectureSummary}</p>
              </CardContent>
            </Card>
          </motion.div>
        </Section>
      )}

      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="pt-8 border-t border-cyan-500/20 text-center text-sm text-slate-500"
      >
        <p>{d.name} · {d.title} · {t('resume.footer')}</p>
      </motion.footer>
    </div>
  );
}
