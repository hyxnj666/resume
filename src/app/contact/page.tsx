'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, MapPin, Phone } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn, maskPhone } from '@/lib/utils';
import { useLocale } from '@/contexts/locale';
import { getResumeData } from '@/data/resume';

export default function ContactPage() {
  const { locale, t } = useLocale();
  const data = getResumeData(locale);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
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
          {t('contact.backHome')}
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-white">{t('contact.title')}</h1>
        <p className="text-slate-400 text-sm mt-1">{t('contact.subtitle')}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center gap-3 text-slate-200">
              <MapPin className="h-5 w-5 text-cyan-400 shrink-0" />
              <div>
                <p className="text-xs text-slate-500">{t('contact.location')}</p>
                <p>{data.location}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-slate-200">
              <Phone className="h-5 w-5 text-cyan-400 shrink-0" />
              <div>
                <p className="text-xs text-slate-500">{t('contact.phone')}</p>
                <span className="text-cyan-400">{maskPhone(data.phone)}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-slate-200">
              <Mail className="h-5 w-5 text-cyan-400 shrink-0" />
              <div>
                <p className="text-xs text-slate-500">{t('contact.email')}</p>
                <a href={`mailto:${data.email}`} className="text-cyan-400 hover:underline">
                  {data.email}
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
