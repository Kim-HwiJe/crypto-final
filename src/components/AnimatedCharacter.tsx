// src/components/AnimatedCharacter.tsx
'use client'

import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

// 1) 클릭 시 나올 수 있는 메시지(고정 리스트)
const clickMessages = [
  '안녕하세요!',
  '무슨 일이신가요?',
  '간지러워요 😄',
  '반가워요!',
  '오랜만이에요!',
]

// 2) 일반 타이머용 랜덤 메시지(고정 리스트)
const randomTalks = [
  '오늘은 날씨가 좋네요~',
  '잠깐 쉬어가시죠?',
  '유용한 파일 찾았나요?',
  '궁금한 게 있으면 물어보세요!',
]

// 자동 메시지 주기를 짧게 조정 (10초~20초)
const AUTO_MSG_INTERVAL_MIN = 10 * 1000 // 10초
const AUTO_MSG_INTERVAL_MAX = 20 * 1000 // 20초

// 가로 이동 주기 (5초~10초 랜덤)
const MOVE_INTERVAL_MIN = 5 * 1000 // 5초
const MOVE_INTERVAL_MAX = 10 * 1000 // 10초

type DynamicInfo = {
  weatherText: string
  topUploaderName: string
  topUploaderCount: number
}

export default function AnimatedCharacter() {
  const containerRef = useRef<HTMLDivElement>(null)
  const charRef = useRef<HTMLDivElement>(null)

  // 1) 세로 위치는 초기 한 번만 결정 → 이 값을 ref에 저장해서 재사용
  const initialTopRef = useRef<number>(0)

  // 2) 캐릭터 위치 state: 오직 left만 변화시키고, top은 고정값 사용
  const [position, setPosition] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  })

  // 말풍선으로 보여줄 메시지 (클릭/자동 양쪽 모두 사용)
  const [bubbleText, setBubbleText] = useState<string | null>(null)

  // 서버에서 가져오는 동적 정보 (날씨, 최다 업로더)
  const [dynamic, setDynamic] = useState<DynamicInfo | null>(null)

  // ─────────────────────────────────────────────────────────────
  // A) 처음 마운트 시: 초기 top/left 계산 → top은 ref에 저장
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || !charRef.current) return

    const { clientWidth, clientHeight } = containerRef.current
    const charWidth = charRef.current.clientWidth
    const charHeight = charRef.current.clientHeight

    // 세로 중앙(Top) 계산
    const initTop = Math.floor((clientHeight - charHeight) / 2)
    // 가로 중앙(Left) 계산
    const initLeft = Math.floor((clientWidth - charWidth) / 2)

    // 상태에 반영
    setPosition({ top: initTop, left: initLeft })
    // ref로도 저장해 둠 → 세로 위치는 고정
    initialTopRef.current = initTop
  }, [])

  // ─────────────────────────────────────────────────────────────
  // B) 오직 가로(Left) 축으로만 랜덤 이동
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true

    function moveCharacter() {
      if (!mounted || !containerRef.current || !charRef.current) return

      const { clientWidth } = containerRef.current
      const charWidth = charRef.current.clientWidth

      // 가로 이동 범위 최대값
      const maxLeft = clientWidth - charWidth
      // 새로운 left 좌표 (0 ~ maxLeft) 랜덤
      const newLeft = Math.floor(Math.random() * (maxLeft + 1))

      // 세로(top)는 항상 동일하게 고정
      setPosition({
        top: initialTopRef.current,
        left: newLeft,
      })

      // 다음 이동 예약 (5~10초 후)
      const nextInterval =
        Math.random() * (MOVE_INTERVAL_MAX - MOVE_INTERVAL_MIN) +
        MOVE_INTERVAL_MIN
      setTimeout(moveCharacter, nextInterval)
    }

    // 최초 이동 예약
    const initialDelay =
      Math.random() * (MOVE_INTERVAL_MAX - MOVE_INTERVAL_MIN) +
      MOVE_INTERVAL_MIN
    const timer = setTimeout(moveCharacter, initialDelay)

    return () => {
      mounted = false
      clearTimeout(timer)
    }
  }, [])

  // ─────────────────────────────────────────────────────────────
  // C) 동적 데이터(fetch) → “dynamic” 업데이트
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true

    async function fetchDynamicInfo() {
      try {
        // 1) 날씨 정보 가져오기
        const r1 = await fetch('/api/weather/current')
        const weatherJson = await r1.json()
        let weatherText = '날씨 정보를 가져올 수 없어요.'
        if (!weatherJson.error) {
          const w = (weatherJson as any).weather as string
          const t = (weatherJson as any).temp as number

          if (w.toLowerCase().includes('rain')) {
            weatherText = `현재 비가 오고 있습니다 ☔️ 우산이 필요해 보여요.`
          } else if (w.toLowerCase().includes('clear')) {
            weatherText = `맑은 하늘이네요! 기분 좋은 하루 보내세요 😊`
          } else if (w.toLowerCase().includes('cloud')) {
            weatherText = `흐린 날씨예요. 우산은 필수는 아니지만, 비가 올 수도 있어요.`
          } else if (w.toLowerCase().includes('snow')) {
            weatherText = `눈이 오고 있네요 ❄️ 감기 조심하세요.`
          } else {
            weatherText = `현재 ${w} 상태이며, 기온은 ${Math.round(
              t
            )}°C 입니다.`
          }
        }

        // 2) 업로드 통계 가져오기
        const r2 = await fetch('/api/stats/top-uploader')
        const statJson = await r2.json()
        let topUploaderName = '아직 자료가 없어요'
        let topUploaderCount = 0
        if (!(statJson as any).error) {
          topUploaderName = (statJson as any).name as string
          topUploaderCount = (statJson as any).count as number
        }

        if (isMounted) {
          setDynamic({ weatherText, topUploaderName, topUploaderCount })
        }
      } catch (err) {
        console.error('동적 정보(fetchDynamicInfo) 실패:', err)
      }
    }

    fetchDynamicInfo()

    return () => {
      isMounted = false
    }
  }, [])

  // ─────────────────────────────────────────────────────────────
  // D) “dynamic”이 업데이트된 이후에만 자동 말풍선 스케줄링
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    // dynamic이 null일 때에는 아무것도 스케줄하지 않음
    if (!dynamic) return

    let isMounted = true

    function scheduleAutoMessage() {
      if (!isMounted) return

      // (1) 일반 메시지 70% vs (2) 동적 정보 메시지 30% 선택
      const pick = Math.random()
      let textToShow: string

      if (pick < 0.7) {
        // 70% 확률: 일반 랜덤 메시지
        textToShow = randomTalks[Math.floor(Math.random() * randomTalks.length)]
      } else {
        // 30% 확률: 날씨 or 업로드 통계 메시지
        if (Math.random() < 0.5) {
          textToShow = dynamic ? dynamic.weatherText : ''
        } else {
          if (dynamic && dynamic.topUploaderCount > 0) {
            textToShow = `가장 많은 파일을 업로드하신 분은 ${dynamic.topUploaderName}님입니다! 대단해요!`
          } else {
            textToShow = `아직 업로드된 파일이 없어요.`
          }
        }
      }

      // 말풍선(bubbleText) 상태에 텍스트 할당 → 캐릭터 위 “말풍선”으로 보여줌
      setBubbleText(textToShow)
      // 4초 후 말풍선 사라지기
      setTimeout(() => setBubbleText(null), 4000)

      // 다음 자동 말풍선 예약 (10~20초 후)
      const next =
        Math.random() * (AUTO_MSG_INTERVAL_MAX - AUTO_MSG_INTERVAL_MIN) +
        AUTO_MSG_INTERVAL_MIN
      setTimeout(scheduleAutoMessage, next)
    }

    // dynamic 업데이트 후에 최초 호출
    scheduleAutoMessage()

    return () => {
      isMounted = false
    }
  }, [dynamic])

  // ─────────────────────────────────────────────────────────────
  // E) 캐릭터 클릭 시 말풍선 메시지(3초 동안)
  //     - 30% 확률로 동적 메시지(날씨/업로더)
  //     - 70% 확률로 고정 클릭 메시지
  // ─────────────────────────────────────────────────────────────
  const handleClick = () => {
    const pick = Math.random()
    let textToShow: string

    if (pick < 0.3 && dynamic) {
      // 30% 확률: 동적 메시지
      if (Math.random() < 0.5) {
        textToShow = dynamic.weatherText
      } else {
        if (dynamic.topUploaderCount > 0) {
          textToShow = `가장 많은 파일을 업로드하신 분은 ${dynamic.topUploaderName}님입니다! 대단해요!`
        } else {
          textToShow = `아직 업로드된 파일이 없어요.`
        }
      }
    } else {
      // 70% 확률: 고정 클릭 메시지
      textToShow =
        clickMessages[Math.floor(Math.random() * clickMessages.length)]
    }

    setBubbleText(textToShow)
    // 3초 후 말풍선 사라지기
    setTimeout(() => setBubbleText(null), 3000)
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden"
      style={{
        height: '256px', // tailwind의 h-64 와 동일
        backgroundColor: 'transparent', // 뒤 배경과 자연스럽게 이어지도록
      }}
    >
      {/* 1) 캐릭터 */}
      <div
        ref={charRef}
        onClick={handleClick}
        className="absolute cursor-pointer select-none"
        style={{
          top: position.top,
          left: position.left,
          transition: 'left 1.5s ease', // 좌우만 움직이도록
          width: 64,
          height: 64,
          zIndex: 10,
        }}
      >
        <Image
          src="/avatars/character.png"
          alt="돌아다니는 캐릭터"
          width={64}
          height={64}
          className="rounded-full"
        />
      </div>

      {/* 2) 스피치 버블(말풍선) */}
      {bubbleText && (
        <div
          className="speech-bubble"
          style={{
            // 캐릭터 바로 위에 말풍선이 뜨도록 충분히 위로 띄우기
            top: position.top - 48,
            // → 캐릭터 높이(64px) 위 + 말풍선 꼬리/여백(16px 정도) + 말풍선 본문 높이(약 32px) 계산
            //    말풍선이 캐릭터와 겹치지 않도록 대략 48px 위로 띄운다.

            left: position.left + (charRef.current?.clientWidth ?? 64) / 2,
            transform: 'translateX(-50%)', // 캐릭터 가로 중앙에 정렬
          }}
        >
          {bubbleText}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          아래 JSX 전용 CSS를 넣어서 “speech-bubble” 클래스를 스타일링
      ───────────────────────────────────────────────────────────── */}
      <style jsx>{`
        .speech-bubble {
          position: absolute;
          background-color: white;
          border: 1px solid #ccc;
          border-radius: 8px;
          padding: 0.5rem 0.75rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          font-size: 0.875rem;
          white-space: normal; /* 여러 줄 허용 */
          word-wrap: break-word; /* 단어 단위까지 감싸기 */
          display: inline-block; /* 텍스트 길이에 따라 너비 조절 */
          max-width: 180px; /* 한 줄당 최대 너비 설정 */
          z-index: 20;
        }
        .speech-bubble::after {
          content: '';
          position: absolute;
          left: 50%; /* 말풍선 너비의 절반에 꼬리 위치 */
          bottom: -8px; /* 말풍선 경계 바깥쪽으로 꼬리 높이만큼 내려오기 */
          transform: translateX(-50%); /* 꼬리를 말풍선 중앙에 정렬 */
          border-width: 8px 8px 0 8px; /* 꼬리 삼각형 크기(8px) */
          border-style: solid;
          border-color: white transparent transparent transparent; /* 흰색 배경 꼬리 */
        }
        .speech-bubble::before {
          content: '';
          position: absolute;
          left: 50%;
          bottom: -9px; /* 꼬리 테두리 높이 */
          transform: translateX(-50%);
          border-width: 9px 9px 0 9px; /* 꼬리 테두리 크기(9px) */
          border-style: solid;
          border-color: #ccc transparent transparent transparent; /* 회색 테두리 */
        }
      `}</style>
    </div>
  )
}
