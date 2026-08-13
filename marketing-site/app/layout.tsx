import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'CooCoo煮煮 | 智慧自煮與圓夢儲蓄系統',
  description: '專為都市單身套房租屋族、下班意志力破產外食族打造的智慧自煮與圓夢儲蓄系統。精益採買、科學分裝、15分鐘烹飪，幫你省下大筆外食費。',
  openGraph: {
    title: 'CooCoo煮煮 | 智慧自煮與圓夢儲蓄系統',
    description: '專為都市單身套房租屋族打造。精益採買、科學分裝、15分鐘烹飪，幫你省下大筆外食費。',
    url: 'https://coocoo.tw',
    siteName: 'CooCoo煮煮',
    images: [
      {
        url: 'https://coocoo.tw/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'CooCoo煮煮',
      },
    ],
    locale: 'zh_TW',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CooCoo煮煮 | 智慧自煮與圓夢儲蓄系統',
    description: '專為都市單身套房租屋族打造的智慧自煮系統。',
    images: ['https://coocoo.tw/og-image.jpg'],
  },
  alternates: {
    canonical: 'https://coocoo.tw',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <body>
        <header style={{ backgroundColor: 'var(--color-bg)', borderBottom: '1px solid var(--color-savings)', padding: '1rem 0' }}>
          <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Link href="/" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
              CooCoo煮煮
            </Link>
            <nav style={{ display: 'flex', gap: '1.5rem' }}>
              <Link href="/recipes" style={{ fontWeight: 500 }}>快速食譜</Link>
              <Link href="/blog" style={{ fontWeight: 500 }}>部落格</Link>
              <Link href="/faq" style={{ fontWeight: 500 }}>常見問題</Link>
              <Link href="/about" style={{ fontWeight: 500 }}>關於我們</Link>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer style={{ backgroundColor: 'var(--color-dark)', color: 'white', padding: '3rem 0', textAlign: 'center', marginTop: '4rem' }}>
          <div className="container">
            <p style={{ marginBottom: '1rem' }}>CooCoo煮煮 - 智慧自煮與圓夢儲蓄系統</p>
            <p style={{ fontSize: '0.875rem', opacity: 0.8 }}>© {new Date().getFullYear()} CooCoo煮煮. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
