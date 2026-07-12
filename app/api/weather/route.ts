// app/api/weather/route.ts

import { NextRequest, NextResponse } from 'next/server'

// ===== CACHE CONFIGURATION =====
// Cache weather data for 10 minutes to reduce API calls
const CACHE_DURATION = 600 // seconds (10 minutes)

// ===== ERROR TYPES =====
interface WeatherError {
  error: string
  code?: string
  message?: string
}

// ===== GET WEATHER DATA =====
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('lat')
  const lon = searchParams.get('lon')
  const q = searchParams.get('q') // City search query

  // ===== VALIDATE API KEY =====
  const apiKey = process.env.OPENWEATHER_API_KEY
  if (!apiKey) {
    console.error('❌ OpenWeather API key is missing!')
    return NextResponse.json(
      { error: 'Weather service is not configured' },
      { status: 500 }
    )
  }

  try {
    // ===== CITY SEARCH =====
    if (q) {
      return await handleCitySearch(q, apiKey)
    }

    // ===== WEATHER BY COORDINATES =====
    if (!lat || !lon) {
      return NextResponse.json(
        { error: 'Missing latitude or longitude parameters' },
        { status: 400 }
      )
    }

    // Validate coordinates
    const latNum = parseFloat(lat)
    const lonNum = parseFloat(lon)
    
    if (isNaN(latNum) || isNaN(lonNum) || latNum < -90 || latNum > 90 || lonNum < -180 || lonNum > 180) {
      return NextResponse.json(
        { error: 'Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180.' },
        { status: 400 }
      )
    }

    return await handleWeatherByCoordinates(latNum, lonNum, apiKey)

  } catch (error) {
    console.error('Weather API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch weather data. Please try again.' },
      { status: 500 }
    )
  }
}

// ===== HANDLE CITY SEARCH =====
async function handleCitySearch(query: string, apiKey: string) {
  try {
    const res = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${apiKey}`,
      {
        headers: {
          'Accept': 'application/json',
        },
        // Cache for 1 hour
        next: { revalidate: 3600 }
      }
    )

    if (!res.ok) {
      throw new Error(`Geo API error: ${res.status} ${res.statusText}`)
    }

    const data = await res.json()
    
    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { error: `No locations found for "${query}"` },
        { status: 404 }
      )
    }

    // Return only the first 5 results with relevant data
    const results = data.slice(0, 5).map((city: any) => ({
      name: city.name || '',
      country: city.country || '',
      state: city.state || '',
      lat: city.lat || 0,
      lon: city.lon || 0,
    }))

    return NextResponse.json(results)

  } catch (error) {
    console.error('City search error:', error)
    return NextResponse.json(
      { error: 'Failed to search for city. Please try again.' },
      { status: 500 }
    )
  }
}

// ===== HANDLE WEATHER BY COORDINATES =====
async function handleWeatherByCoordinates(lat: number, lon: number, apiKey: string) {
  try {
    // ===== FETCH CURRENT WEATHER =====
    const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
    const currentRes = await fetch(currentUrl, {
      headers: { 'Accept': 'application/json' },
      // Cache for 10 minutes
      next: { revalidate: CACHE_DURATION }
    })

    if (!currentRes.ok) {
      const errorText = await currentRes.text()
      console.error('Current weather API error:', currentRes.status, errorText)
      
      if (currentRes.status === 401) {
        return NextResponse.json(
          { error: 'Invalid API key. Please check your OpenWeather API key.' },
          { status: 401 }
        )
      }
      
      if (currentRes.status === 404) {
        return NextResponse.json(
          { error: 'Location not found. Please check your coordinates.' },
          { status: 404 }
        )
      }
      
      throw new Error(`Current weather API error: ${currentRes.status}`)
    }

    const current = await currentRes.json()

    // ===== FETCH FORECAST =====
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&cnt=40`
    const forecastRes = await fetch(forecastUrl, {
      headers: { 'Accept': 'application/json' },
      // Cache for 10 minutes
      next: { revalidate: CACHE_DURATION }
    })

    if (!forecastRes.ok) {
      const errorText = await forecastRes.text()
      console.error('Forecast API error:', forecastRes.status, errorText)
      // Return current weather even if forecast fails
      return NextResponse.json({ 
        current, 
        forecast: null,
        warning: 'Forecast data unavailable'
      })
    }

    const forecast = await forecastRes.json()

    // ===== RETURN SUCCESS RESPONSE =====
    return NextResponse.json(
      { current, forecast },
      {
        headers: {
          'Cache-Control': `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate=${CACHE_DURATION * 2}`,
        },
      }
    )

  } catch (error) {
    console.error('Weather fetch error:', error)
    throw error // Re-throw to be caught by the main handler
  }
}

// ===== OPTIONAL: POST for bulk requests =====
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cities } = body

    if (!Array.isArray(cities) || cities.length === 0) {
      return NextResponse.json(
        { error: 'Please provide an array of cities' },
        { status: 400 }
      )
    }

    const apiKey = process.env.OPENWEATHER_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Weather service is not configured' },
        { status: 500 }
      )
    }

    // Fetch weather for multiple cities
    const results = await Promise.all(
      cities.map(async (city: string) => {
        try {
          const res = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`
          )
          const data = await res.json()
          return { city, data, success: res.ok }
        } catch {
          return { city, data: null, success: false, error: 'Failed to fetch' }
        }
      })
    )

    return NextResponse.json({ results })

  } catch (error) {
    console.error('Bulk weather error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch weather data' },
      { status: 500 }
    )
  }
}