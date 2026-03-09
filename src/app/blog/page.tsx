'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useLocale } from '@/contexts/locale';

export default function BlogPage() {
  const { t } = useLocale();

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
          {t('blog.backHome')}
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
          <FileText className="h-8 w-8 text-cyan-400" />
          {t('blog.title')}
        </h1>
        <p className="text-slate-400 text-sm mt-1">{t('blog.subtitle')}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardContent className="p-8 text-center text-slate-500">
            <p>{t('blog.empty')}</p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
