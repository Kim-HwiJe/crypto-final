import Link from 'next/link'
import React from 'react'
import { Globe } from 'lucide-react'

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-4">
        {/* 상단 링크들 */}
        <div className="flex flex-wrap items-center justify-center md:justify-between text-sm text-gray-500 gap-4">
          <button className="flex items-center space-x-1 hover:text-gray-700 transition">
            <Globe size={16} />
            <span>Language (KR)</span>
          </button>
          <span>© {new Date().getFullYear()} SafeShare</span>
          <Link href="/about" className="hover:text-gray-700 transition">
            About SafeShare
          </Link>
          <Link href="/terms" className="hover:text-gray-700 transition">
            Terms of service
          </Link>
        </div>
      </div>
    </footer>
  )
}

export default Footer
