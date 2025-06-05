import { NextResponse } from 'next/server'

export async function GET() {
  const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY
  const city = process.env.NEXT_PUBLIC_WEATHER_CITY

  if (!apiKey || !city) {
    return NextResponse.json(
      { error: '날씨 API 설정이 잘못되었습니다.' },
      { status: 400 }
    )
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
      city
    )}&appid=${apiKey}&units=metric&lang=kr`

    const r = await fetch(url)
    if (!r.ok) throw new Error('OpenWeatherMap API 호출 실패')

    const data = await r.json()

    const weather = data.weather?.[0]?.main ?? 'Unknown'
    const temp = data.main?.temp ?? 0

    return NextResponse.json({ weather, temp }, { status: 200 })
  } catch (e) {
    console.error('[GET /api/weather/current] 에러:', e)

    return NextResponse.json(
      { error: '날씨 정보를 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
