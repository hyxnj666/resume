'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bot, FileText, FolderOpen, Home, LayoutGrid, Mail, Menu, MessageCircle, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocale } from '@/contexts/locale';
import { getResumeData } from '@/data/resume';

const navKeys = [
  { href: '/', key: 'home', icon: Home },
  { href: '/resume', key: 'resume', icon: FileText },
  { href: '/projects', key: 'projects', icon: FolderOpen },
  { href: '/ai-projects', key: 'aiProjects', icon: Sparkles },
  { href: '/ai-demo', key: 'aiDemo', icon: LayoutGrid },
  { href: '/ask-ai', key: 'askAi', icon: MessageCircle },
  { href: '/contact', key: 'contact', icon: Mail },
] as const;

function NavLinks({
  pathname,
  t,
  className,
  itemClassName,
  onLinkClick,
}: {
  pathname: string;
  t: (key: string) => string;
  className?: string;
  itemClassName?: string;
  onLinkClick?: () => void;
}) {
  return (
    <ul className={cn('flex items-center gap-1', className)}>
      {navKeys.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
        const Icon = item.icon;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onLinkClick}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'text-cyan-400 bg-cyan-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80',
                itemClassName
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{t(`nav.${item.key}`)}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function LangSwitcher({ locale, setLocale }: { locale: 'zh' | 'en'; setLocale: (l: 'zh' | 'en') => void }) {
  return (
    <div className="flex items-center border-l border-slate-600 pl-2 ml-1 shrink-0">
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
  );
}

export function SiteNav() {
  const pathname = usePathname();
  const { locale, setLocale, t } = useLocale();
  const resume = getResumeData(locale);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [mobileMenuOpen]);

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-cyan-500/20 bg-dark/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between h-14 min-w-0">
            <Link href="/" className="flex items-center gap-2 text-white font-semibold min-w-0 shrink">
              <Bot className="h-5 w-5 shrink-0 text-cyan-400" />
              <span className="truncate">{resume.name}</span>
              <span className="text-xs font-normal text-slate-500 hidden sm:inline shrink-0">· {t('nav.brandSub')}</span>
            </Link>
            {/* 桌面端：完整导航 + 语言 */}
            <div className="hidden md:flex items-center gap-2 shrink-0">
              <NavLinks pathname={pathname} t={t} />
              <LangSwitcher locale={locale} setLocale={setLocale} />
            </div>
            {/* 移动端：菜单按钮 + 语言 */}
            <div className="flex md:hidden items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80"
                aria-label="打开菜单"
              >
                <Menu className="h-5 w-5" />
              </button>
              <LangSwitcher locale={locale} setLocale={setLocale} />
            </div>
          </div>
        </div>
      </nav>

      {/* 移动端侧滑菜单 */}
      <div
        className={cn(
          'fixed inset-0 z-[60] md:hidden',
          mobileMenuOpen ? 'pointer-events-auto' : 'pointer-events-none'
        )}
        aria-hidden={!mobileMenuOpen}
      >
        <div
          className={cn(
            'absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200',
            mobileMenuOpen ? 'opacity-100' : 'opacity-0'
          )}
          onClick={() => setMobileMenuOpen(false)}
        />
        <div
          className={cn(
            'absolute top-0 right-0 bottom-0 w-[min(18rem,85vw)] bg-slate-900 border-l border-slate-700 shadow-xl flex flex-col transition-transform duration-200 ease-out',
            mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          )}
        >
          <div className="flex items-center justify-between h-14 px-4 border-b border-slate-700">
            <span className="text-sm font-medium text-slate-300">{t('nav.brandSub')}</span>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              aria-label="关闭菜单"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto py-4">
            <NavLinks
              pathname={pathname}
              t={t}
              className="flex-col gap-0"
              itemClassName="rounded-none px-4 py-3 justify-start w-full border-b border-slate-800/50 last:border-0"
              onLinkClick={() => setMobileMenuOpen(false)}
            />
          </div>
        </div>
      </div>
    </>
  );
}
