import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navigation from '@/components/Navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Genba Hub | 現場エンジニアのナレッジ基地',
  description: 'SESエンジニアのスキル可視化・ナレッジ共有プラットフォーム',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <div className="flex h-screen overflow-hidden">
          <Navigation />
          <main className="flex-1 overflow-y-auto bg-[#0f172a]">{children}</main>
        </div>
      </body>
    </html>
  )
}
