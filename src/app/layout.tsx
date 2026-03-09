import type { Metadata } from 'next';
import './globals.css';
import { LocaleProvider } from '@/contexts/locale';
import { SiteNav } from '@/components/site-nav';

export const metadata: Metadata = {
  title: '刘峰 - 前端开发工程师 / AI 前端',
  description: '刘峰个人在线简历 - 高级前端开发工程师，AI 大前端方向，含 Ask AI 简历问答',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen relative">
        <LocaleProvider>
          <SiteNav />
          <main>{children}</main>
        </LocaleProvider>
      </body>
    </html>
  );
}
