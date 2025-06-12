'use client'

import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

const clickMessages = [
  '안녕하세요!',
  '무슨 일이신가요?',
  '간지러워요 😄',
  '반가워요!',
  '오랜만이에요!',
]

const randomTalks = [
  '오늘은 날씨가 좋네요~',
  '잠깐 쉬어가시죠?',
  '유용한 파일 찾았나요?',
  '궁금한 게 있으면 물어보세요!',
  '이 편지는 영국에서 최초로 시작되어...',
  '1+1은 2입니다.',
  'AES란 Advanced Encryption Standard의 약자로....',
]

const AUTO_MSG_INTERVAL_MIN = 10 * 1000
const AUTO_MSG_INTERVAL_MAX = 20 * 1000

type DynamicInfo = {
  weatherText: string
  topUploaderName: string
  topUploaderCount: number
}

type Mode = 'idle' | 'speaking' | 'click'

interface Props {
  bottomOffset?: number
  wrapperClassName?: string
}

export default function AnimatedCharacter({
  bottomOffset = 32,
  wrapperClassName = '',
}: Props) {
  const [bubbleText, setBubbleText] = useState<string | null>(null)
  const [dynamic, setDynamic] = useState<DynamicInfo | null>(null)
  const [mode, setMode] = useState<Mode>('idle')
  const [bubbleDuration, setBubbleDuration] = useState<number>(0)
  const clickTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    let isMounted = true

    async function fetchDynamicInfo() {
      try {
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

  useEffect(() => {
    if (!dynamic) return

    let isMounted = true
    let autoTimerId: number

    function scheduleAutoMessage() {
      if (!isMounted) return

      const pick = Math.random()
      let textToShow: string

      if (pick < 0.7) {
        textToShow = randomTalks[Math.floor(Math.random() * randomTalks.length)]
      } else {
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

      setBubbleDuration(4000)
      setBubbleText(textToShow)
      setMode('speaking')

      autoTimerId = window.setTimeout(() => {
        setBubbleText(null)
        setMode('idle')
      }, 4000)

      const next =
        Math.random() * (AUTO_MSG_INTERVAL_MAX - AUTO_MSG_INTERVAL_MIN) +
        AUTO_MSG_INTERVAL_MIN
      autoTimerId = window.setTimeout(scheduleAutoMessage, next)
    }

    autoTimerId = window.setTimeout(scheduleAutoMessage, 2000)

    return () => {
      isMounted = false
      clearTimeout(autoTimerId)
    }
  }, [dynamic])

  const handleClick = () => {
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current)
      clickTimeoutRef.current = null
    }

    let textToShow: string

    if (!dynamic) {
      textToShow =
        clickMessages[Math.floor(Math.random() * clickMessages.length)]
    } else {
      const pick = Math.random()
      if (pick < 0.3) {
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
        textToShow =
          clickMessages[Math.floor(Math.random() * clickMessages.length)]
      }
    }

    setBubbleDuration(3000)
    setBubbleText(null)
    setTimeout(() => {
      setBubbleText(textToShow)
      setMode('click')
    }, 50)

    clickTimeoutRef.current = window.setTimeout(() => {
      setBubbleText(null)
      setMode('idle')
      clickTimeoutRef.current = null
    }, 3000)
  }

  return (
    <div
      className={wrapperClassName}
      style={{
        position: 'absolute',
        right: '1.5rem',
        bottom: bottomOffset,
        width: '64px',
        height: '64px',
        zIndex: 50,
      }}
    >
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

      {bubbleText && (
        <div
          style={{
            position: 'absolute',
            bottom: 72,
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
            animation: `fadeInOut ${bubbleDuration}ms ease-in-out forwards`,
          }}
        >
          {bubbleText}

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
