import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('lat')
  const lon = searchParams.get('lon')
  const q = searchParams.get('q')

  const key = process.env.OPENWEATHER_API_KEY
  if (!key) return NextResponse.json({ error: 'No API key' }, { status: 500 })

  try {
    if (q) {
      const res = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=1&appid=${key}`
      )
      const data = await res.json()
      return NextResponse.json(data)
    }

    const [currentRes, forecastRes] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${key}&units=metric`),
      fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${key}&units=metric&cnt=40`),
    ])

    const current = await currentRes.json()
    const forecast = await forecastRes.json()
    return NextResponse.json({ current, forecast })
  } catch (err) {
    return NextResponse.json({ error: 'Weather fetch failed' }, { status: 500 })
  }
}