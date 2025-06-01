// /src/components/AnimatedCharacter.tsx
'use client'

import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

// 1) 클릭 시 나올 메시지(고정 리스트)
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
  '이 편지는 영국에서 최초로 시작되어...',
  '1+1은 2입니다.',
  'AES란 Advanced Encryption Standard의 약자로....',
]

// 자동 메시지 주기 (10초~20초)
const AUTO_MSG_INTERVAL_MIN = 10 * 1000 // 10초
const AUTO_MSG_INTERVAL_MAX = 20 * 1000 // 20초

type DynamicInfo = {
  weatherText: string
  topUploaderName: string
  topUploaderCount: number
}

type Mode = 'idle' | 'speaking' | 'click'

interface Props {
  /** 아래에서부터 얼만큼 띄울지(px 단위) */
  bottomOffset?: number
  /** 부모 레이아웃에서 absolute 위치 지정용 클래스명 */
  wrapperClassName?: string
}

export default function AnimatedCharacter({
  bottomOffset = 32,
  wrapperClassName = '',
}: Props) {
  // 말풍선에 표시할 텍스트
  const [bubbleText, setBubbleText] = useState<string | null>(null)
  // 동적 정보(날씨, 최다 업로더)
  const [dynamic, setDynamic] = useState<DynamicInfo | null>(null)
  // 캐릭터 상태(이미지 모드)
  const [mode, setMode] = useState<Mode>('idle')
  // 말풍선 지속 시간(ms)
  const [bubbleDuration, setBubbleDuration] = useState<number>(0)

  // 클릭 타이머 ID (말풍선 제거용)
  const clickTimeoutRef = useRef<number | null>(null)

  // ─────────────────────────────────────────────────────────────
  // A) 동적 정보(fetchWeather + fetchTopUploader) → dynamic 업데이트
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true

    async function fetchDynamicInfo() {
      try {
        // 1) 날씨 API 호출
        const r1 = await fetch('/api/weather/current')
        const weatherJson = await r1.json()
        let weatherText = '날씨 정보를 가져올 수 없어요.'
        if (!weatherJson.error) {
          const w = (weatherJson as any).weather as string
          const t = (weatherJson as any).temp as number

          if (w.toLowerCase().includes('rain')) {
            weatherText = `현재 비가 오고 있습니다 ☔️ 우산을 챙기세요!`
          } else if (w.toLowerCase().includes('clear')) {
            weatherText = `맑은 하늘이네요! 기분 좋은 하루 보내세요 😊`
          } else if (w.toLowerCase().includes('cloud')) {
            weatherText = `흐린 날씨예요. 우산이 필요할 수도 있어요.`
          } else if (w.toLowerCase().includes('snow')) {
            weatherText = `눈이 오고 있네요 ❄️ 따뜻하게 입으세요!`
          } else {
            weatherText = `현재 ${w} 상태이고, 기온은 ${Math.round(
              t
            )}°C 입니다.`
          }
        }

        // 2) 최다 업로더 통계 API 호출
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
  // B) 동적 정보가 들어온 뒤 “자동 말풍선” 스케줄링
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!dynamic) return

    let isMounted = true
    let autoTimerId: number

    function scheduleAutoMessage() {
      if (!isMounted) return

      const pick = Math.random()
      let textToShow: string

      if (pick < 0.7) {
        // 70% 확률: 일반 랜덤 메시지
        textToShow = randomTalks[Math.floor(Math.random() * randomTalks.length)]
      } else {
        // 30% 확률: 날씨/업로더 통계 메시지
        if (Math.random() < 0.5) {
          textToShow = dynamic ? dynamic.weatherText : ''
        } else {
          if (dynamic && dynamic.topUploaderCount > 0) {
            textToShow = `가장 많은 파일을 업로드하신 분은 ${dynamic.topUploaderName}님입니다! 🎉`
          } else {
            textToShow = `아직 업로드된 파일이 없어요.`
          }
        }
      }

      // ▶ 자동 말풍선: 4초간 표시
      setBubbleDuration(4000)
      setBubbleText(textToShow)
      setMode('speaking')

      // 4초 후 말풍선/모드 초기화
      autoTimerId = window.setTimeout(() => {
        setBubbleText(null)
        setMode('idle')
      }, 4000)

      // 10~20초 뒤에 다시 스케줄
      const next =
        Math.random() * (AUTO_MSG_INTERVAL_MAX - AUTO_MSG_INTERVAL_MIN) +
        AUTO_MSG_INTERVAL_MIN
      autoTimerId = window.setTimeout(scheduleAutoMessage, next)
    }

    // 처음 자동 호출(마운트 후 2초 뒤)
    autoTimerId = window.setTimeout(scheduleAutoMessage, 2000)

    return () => {
      isMounted = false
      clearTimeout(autoTimerId)
    }
  }, [dynamic])

  // ─────────────────────────────────────────────────────────────
  // C) 클릭 시 말풍선 & click 모드
  //    (30% 동적 메시지, 70% 고정 클릭 메시지 / 매번 클릭마다 타이머 재설정)
  // ─────────────────────────────────────────────────────────────
  const handleClick = () => {
    // 1) 기존 클릭 타이머가 있으면 무조건 취소한다.
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current)
      clickTimeoutRef.current = null
    }

    let textToShow: string

    if (!dynamic) {
      // 아직 동적 정보가 없으면 무조건 고정 클릭 메시지
      textToShow =
        clickMessages[Math.floor(Math.random() * clickMessages.length)]
    } else {
      // dynamic이 있으면 30% 확률로 동적 메시지, 70% 확률로 고정 클릭 메시지
      const pick = Math.random()
      if (pick < 0.3) {
        // 30% 동적
        if (Math.random() < 0.5) {
          textToShow = dynamic.weatherText
        } else {
          if (dynamic.topUploaderCount > 0) {
            textToShow = `가장 많은 파일을 업로드하신 분은 ${dynamic.topUploaderName}님입니다! 🎉`
          } else {
            textToShow = `아직 업로드된 파일이 없어요.`
          }
        }
      } else {
        // 70% 고정 클릭
        textToShow =
          clickMessages[Math.floor(Math.random() * clickMessages.length)]
      }
    }

    // ▶ 클릭 말풍선: 3초간 표시
    setBubbleDuration(3000)

    // “먼저” 말풍선을 강제로 비워준다 (같은 문자열이어도 항상 상태가 바뀌도록)
    setBubbleText(null)

    // 짧은 지연(0ms 또는 50ms) 후에 실제 말풍선 텍스트를 세팅해야
    // 같은 문자열일지라도 리액트가 상태 변화를 인식하여 다시 렌더링한다.
    setTimeout(() => {
      setBubbleText(textToShow)
      setMode('click')
    }, 50)

    // 3초 뒤 말풍선/클릭 모드 해제
    clickTimeoutRef.current = window.setTimeout(() => {
      setBubbleText(null)
      setMode('idle')
      clickTimeoutRef.current = null
    }, 3000)
  }

  // ─────────────────────────────────────────────────────────────
  // D) 렌더링: main 안에서 absolute로 위치시키기
  // ─────────────────────────────────────────────────────────────
  return (
    <div
      className={wrapperClassName}
      style={{
        position: 'absolute',
        right: '1.5rem', // main의 px-6 패딩을 고려하여 우측으로부터 1.5rem 안쪽
        bottom: bottomOffset, // 바닥에서 bottomOffset(px) 만큼 올라오기
        width: '64px',
        height: '64px',
        zIndex: 50,
      }}
    >
      {/* 1) 캐릭터 이미지: mode에 따라 다른 src */}
      <div onClick={handleClick} className="cursor-pointer">
        {mode === 'idle' && (
          <Image
            src="/avatars/character_idle.png"
            alt="캐릭터 - idle"
            width={64}
            height={64}
          />
        )}
        {mode === 'speaking' && (
          <Image
            src="/avatars/character_speaking.png"
            alt="캐릭터 - speaking"
            width={64}
            height={64}
          />
        )}
        {mode === 'click' && (
          <Image
            src="/avatars/character_click.png"
            alt="캐릭터 - clicked"
            width={64}
            height={64}
          />
        )}
      </div>

      {/* 2) 말풍선(버블) */}
      {bubbleText && (
        <div
          style={{
            position: 'absolute',
            bottom: 72, // 캐릭터 높이(64px) + 꼬리 여백(8px) = 72px 위
            left: '50%',
            transform: 'translateX(-50%)',
            maxWidth: '180px',
            padding: '0.5rem 0.75rem',
            backgroundColor: 'white',
            border: '1px solid #ccc',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            fontSize: '0.75rem',
            whiteSpace: 'normal',
            wordBreak: 'keep-all',
            overflowWrap: 'break-word',
            zIndex: 60,
            color: 'black',

            // ▶ 말풍선이 페이드 인 → 머무름 → 페이드 아웃 하도록 애니메이션 적용
            animation: `fadeInOut ${bubbleDuration}ms ease-in-out forwards`,
          }}
        >
          {bubbleText}

          {/* 말풍선 꼬리 (흰색) */}
          <div
            style={{
              position: 'absolute',
              bottom: '-8px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderTop: '8px solid white',
            }}
          />

          {/* 말풍선 꼬리 테두리 (회색) */}
          <div
            style={{
              position: 'absolute',
              bottom: '-9px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '9px solid transparent',
              borderRight: '9px solid transparent',
              borderTop: '9px solid #ccc',
            }}
          />
        </div>
      )}

      {/* 3) CSS keyframes 정의 */}
      <style jsx>{`
        @keyframes fadeInOut {
          0% {
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
