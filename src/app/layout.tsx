// /src/app/layout.tsx
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import FloatingSidebar from '@/components/FloatingSidebar'
import { Providers } from './providers'
import { Toaster } from 'react-hot-toast'
import AnimatedCharacter from '@/components/AnimatedCharacter'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'SafeShare',
  description: '안전한 파일공유 서비스',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <Header />
          <FloatingSidebar />

          {/*
            ──────────────────────────────────────────────────────────────
            main 영역에 아래쪽 여백(pb-24)을 추가했습니다.
            이로 인해 메인 콘텐츠가 캐릭터가 위치할 부분까지 내려오지 않고
            그 위에 멈추게 됩니다.
          ──────────────────────────────────────────────────────────────
          */}
          <main className="relative max-w-7xl mx-auto px-6 pb-24">
            {/* 실제 페이지 콘텐츠 */}
            {children}

            {/*
              AnimatedCharacter를 main 안쪽의 absolute로 배치.
              right-6 = 오른쪽으로 1.5rem (px-6 패딩과 맞추기 위함)
              bottomOffset=32를 주어 캐릭터가 메인 콘텐츠 아래쪽으로 32px 떨어지게 함
            */}
            <AnimatedCharacter
              wrapperClassName="absolute right-6"
              bottomOffset={32}
            />
          </main>

          <Footer />
          <Toaster position="top-center" />
        </Providers>
      </body>
    </html>
  )
}
