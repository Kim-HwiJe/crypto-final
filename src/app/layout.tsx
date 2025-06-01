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
<<<<<<< HEAD
          <div className="max-w-7xl mx-auto px-6">
            {children}
            <AnimatedCharacter />
          </div>
=======
          {children}
>>>>>>> ed3f063f940461505644945557acf144a8169662
          <Footer />
          <Toaster position="top-center" />
        </Providers>
      </body>
    </html>
  )
}
