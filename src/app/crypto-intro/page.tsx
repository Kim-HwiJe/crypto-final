'use client'

import { useState } from 'react'

export default function HomePage() {
  const [open, setOpen] = useState<string | null>(null)
  const toggle = (section: string) => {
    setOpen(open === section ? null : section)
  }

  return (
    <main className="max-w-7xl mx-auto px-6 py-8 flex flex-col space-y-6">
      <h1 className="text-3xl font-bold text-purple-500">
        🔐 암호화 알고리즘 소개
      </h1>
      <p className="text-gray-700">
        아래 알고리즘들을 클릭하면 정의와 장점, 구조 이미지를 확인할 수
        있습니다.
      </p>

      {/* AES-256 */}
      <div className="bg-blue-50 hover:bg-blue-100 rounded-2xl p-6 shadow transition">
        <button
          onClick={() => toggle('aes256')}
          className="flex items-center w-full text-left text-lg font-semibold text-blue-800"
        >
          <span className="mr-2">{open === 'aes256' ? '▼' : '▶'}</span>
          AES-256 (대칭키 블록 암호)
        </button>
        {open === 'aes256' && (
          <div className="mt-4 space-y-4">
            <h3 className="text-xl font-medium">🔹 정의</h3>
            <p className="text-gray-800">
              📌 AES-256은 256비트 대칭키를 사용하는 고급 블록 암호화
              알고리즘입니다. 하나의 키로 암호화와 복호화를 수행하며, 128비트
              블록을 14라운드에 걸쳐 처리합니다.
            </p>

            <h3 className="text-xl font-medium">✅ 장점</h3>
            <ul className="list-disc list-inside text-gray-800 space-y-1">
              <li>정부·군사·금융 등에서 채택된 높은 신뢰성</li>
              <li>256비트 키 기반의 강력한 보안성</li>
              <li>무차별 공격에 매우 강함</li>
              <li>하드웨어 가속 기능으로 높은 성능</li>
            </ul>

            <div className="bg-white border rounded-lg p-4 mt-4">
              <img
                src="/aes256.png"
                alt="AES-256 구조"
                className="w-full max-w-xl mx-auto"
              />
              <p className="mt-2 text-center text-sm text-gray-500">
                AES-256 암호화 과정 구조도입니다.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* AES-GCM */}
      <div className="bg-purple-50 hover:bg-purple-100 rounded-2xl p-6 shadow transition">
        <button
          onClick={() => toggle('aesgcm')}
          className="flex items-center w-full text-left text-lg font-semibold text-purple-800"
        >
          <span className="mr-2">{open === 'aesgcm' ? '▼' : '▶'}</span>
          AES-GCM (인증된 대칭키 암호)
        </button>
        {open === 'aesgcm' && (
          <div className="mt-4 space-y-4">
            <h3 className="text-xl font-medium">🔹 정의</h3>
            <p className="text-gray-800">
              📌 AES-GCM은 AES 암호화에 Galois/Counter Mode(GCM)를 적용하여
              데이터 기밀성과 인증(무결성)을 동시에 제공하는 고속 인증 암호화
              알고리즘입니다.
            </p>

            <h3 className="text-xl font-medium">✅ 장점</h3>
            <ul className="list-disc list-inside text-gray-800 space-y-1">
              <li>암호화와 인증을 동시에 수행</li>
              <li>병렬 처리로 매우 빠름</li>
              <li>TLS, HTTPS, VPN 등에서 널리 사용</li>
              <li>위조·변조 탐지 가능한 인증 태그</li>
            </ul>

            <div className="bg-white border rounded-lg p-4 mt-4">
              <img
                src="/aesgcm.png"
                alt="AES-GCM 구조"
                className="w-full max-w-xl mx-auto"
              />
              <p className="mt-2 text-center text-sm text-gray-500">
                AES-GCM 암호화 구조도입니다.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Chacha20-Poly1305 */}
      <div className="bg-gray-50 hover:bg-gray-100 rounded-2xl p-6 shadow transition">
        <button
          onClick={() => toggle('chacha')}
          className="flex items-center w-full text-left text-lg font-semibold text-gray-800"
        >
          <span className="mr-2">{open === 'chacha' ? '▼' : '▶'}</span>
          Chacha20-Poly1305 (스트림 암호 + 인증)
        </button>
        {open === 'chacha' && (
          <div className="mt-4 space-y-4">
            <h3 className="text-xl font-medium">🔹 정의</h3>
            <p className="text-gray-800">
              📌 Chacha20-Poly1305는 빠르고 안전한 스트림 암호 Chacha20과 메시지
              인증 MAC인 Poly1305를 결합한 인증된 암호화 알고리즘입니다.
            </p>

            <h3 className="text-xl font-medium">✅ 장점</h3>
            <ul className="list-disc list-inside text-gray-800 space-y-1">
              <li>하드웨어 가속 없이도 뛰어난 성능</li>
              <li>모바일·IoT 환경에서도 효율적</li>
              <li>TLS 1.3, WireGuard, QUIC 등 최신 프로토콜 채택</li>
              <li>유연한 블록 크기 처리 가능</li>
            </ul>

            <div className="bg-white border rounded-lg p-4 mt-4">
              <img
                src="/chacha.png"
                alt="Chacha20-Poly1305 구조"
                className="w-full max-w-xl mx-auto"
              />
              <p className="mt-2 text-center text-sm text-gray-500">
                Chacha20-Poly1305 암호화 과정 구조도입니다.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
