'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bot, BookOpen, FileText, FolderOpen, Home, Mail, MessageCircle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocale } from '@/contexts/locale';
import { getResumeData } from '@/data/resume';

const navKeys = [
  { href: '/', key: 'home', icon: Home },
  { href: '/resume', key: 'resume', icon: FileText },
  { href: '/projects', key: 'projects', icon: FolderOpen },
  { href: '/ai-projects', key: 'aiProjects', icon: Sparkles },
  { href: '/ask-ai', key: 'askAi', icon: MessageCircle },
  { href: '/blog', key: 'blog', icon: BookOpen },
  { href: '/contact', key: 'contact', icon: Mail },
] as const;

export function SiteNav() {
  const pathname = usePathname();
  const { locale, setLocale, t } = useLocale();
  const resume = getResumeData(locale);

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-cyan-500/20 bg-dark/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="flex items-center gap-2 text-white font-semibold">
              <Bot className="h-5 w-5 text-cyan-400" />
              <span>{resume.name}</span>
              <span className="text-xs font-normal text-slate-500 hidden sm:inline">· {t('nav.brandSub')}</span>
            </Link>
            <div className="flex items-center gap-2">
              <ul className="flex items-center gap-1">
                {navKeys.map((item) => {
                  const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                          isActive
                            ? 'text-cyan-400 bg-cyan-500/10'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="hidden sm:inline">{t(`nav.${item.key}`)}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <div className="flex items-center border-l border-slate-600 pl-2 ml-1">
                <button
                  type="button"
                  onClick={() => setLocale('zh')}
                  className={cn(
                    'px-2 py-1 rounded text-xs font-medium transition-colors',
                    locale === 'zh' ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-500 hover:text-slate-300'
                  )}
                >
                  中文
                </button>
                <span className="text-slate-600">|</span>
                <button
                  type="button"
                  onClick={() => setLocale('en')}
                  className={cn(
                    'px-2 py-1 rounded text-xs font-medium transition-colors',
                    locale === 'en' ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-500 hover:text-slate-300'
                  )}
                >
                  EN
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
