// 파일 경로: src/app/api/weather/current/route.ts

import { NextResponse } from 'next/server'

/**
 * GET /api/weather/current
 * Pages Router 방식(handler)에서 App Router 방식(GET named export)으로 변경한 예시입니다.
 */
export async function GET() {
  // 환경변수에서 API 키와 도시 이름을 가져옵니다.
  // NEXT_PUBLIC_ 로 시작하더라도 서버 쪽 코드에서는 process.env.NEXT_PUBLIC_WEATHER_API_KEY처럼 그냥 사용 가능합니다.
  const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY
  const city = process.env.NEXT_PUBLIC_WEATHER_CITY

  // API_KEY 또는 CITY 설정이 없다면 400 에러를 반환합니다.
  if (!apiKey || !city) {
    return NextResponse.json(
      { error: '날씨 API 설정이 잘못되었습니다.' },
      { status: 400 }
    )
  }

  try {
    // OpenWeatherMap API 호출 URL 생성
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
      city
    )}&appid=${apiKey}&units=metric&lang=kr`

    // fetch 로 조회
    const r = await fetch(url)
    if (!r.ok) throw new Error('OpenWeatherMap API 호출 실패')

    const data = await r.json()
    // data.weather[0].main (예: "Clear", "Rain", "Clouds" 등)
    // data.main.temp (현재 온도)
    const weather = data.weather?.[0]?.main ?? 'Unknown'
    const temp = data.main?.temp ?? 0

    // 정상 응답 (200)에 JSON으로 날씨와 온도 정보를 보냅니다.
    return NextResponse.json({ weather, temp }, { status: 200 })
  } catch (e) {
    console.error('[GET /api/weather/current] 에러:', e)
    // 서버 내부 오류 발생 시 500과 오류 메시지를 리턴
    return NextResponse.json(
      { error: '날씨 정보를 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
