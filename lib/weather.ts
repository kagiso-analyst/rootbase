export type WeatherData = {
  temp: number
  feelsLike: number
  humidity: number
  windSpeed: number
  description: string
  icon: string
  city: string
  country: string
  sunrise: number
  sunset: number
  forecast: ForecastDay[]
}

export type ForecastDay = {
  date: string
  dayName: string
  tempMin: number
  tempMax: number
  description: string
  icon: string
  humidity: number
  windSpeed: number
  rainChance: number
}

export async function fetchWeather(lat: number, lon: number): Promise<WeatherData | null> {
  try {
    const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`)
    const json = await res.json()
    if (!json.current || json.current.cod !== 200) return null

    const current = json.current
    const forecastData = json.forecast

    const dailyMap: Record<string, any[]> = {}
    forecastData.list?.forEach((item: any) => {
      const date = item.dt_txt.split(' ')[0]
      if (!dailyMap[date]) dailyMap[date] = []
      dailyMap[date].push(item)
    })

    const forecast: ForecastDay[] = Object.entries(dailyMap)
      .slice(0, 7)
      .map(([date, items]) => {
        const temps = items.map((i: any) => i.main.temp)
        const noon = items.find((i: any) => i.dt_txt.includes('12:00')) || items[0]
        const avgRain = items.filter((i: any) => i.pop > 0).length > 0
          ? Math.round((items.reduce((s: number, i: any) => s + i.pop, 0) / items.length) * 100)
          : 0
        return {
          date,
          dayName: new Date(date).toLocaleDateString('en-ZA', { weekday: 'short' }),
          tempMin: Math.round(Math.min(...temps)),
          tempMax: Math.round(Math.max(...temps)),
          description: noon.weather[0].description,
          icon: noon.weather[0].icon,
          humidity: noon.main.humidity,
          windSpeed: Math.round(noon.wind.speed * 3.6),
          rainChance: avgRain,
        }
      })

    return {
      temp: Math.round(current.main.temp),
      feelsLike: Math.round(current.main.feels_like),
      humidity: current.main.humidity,
      windSpeed: Math.round(current.wind.speed * 3.6),
      description: current.weather[0].description,
      icon: current.weather[0].icon,
      city: current.name,
      country: current.sys.country,
      sunrise: current.sys.sunrise,
      sunset: current.sys.sunset,
      forecast,
    }
  } catch (err) {
    console.error('Weather error:', err)
    return null
  }
}

export async function searchCity(query: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const res = await fetch(`/api/weather?q=${encodeURIComponent(query)}`)
    const data = await res.json()
    if (data && data[0]) return { lat: data[0].lat, lon: data[0].lon }
    return null
  } catch {
    return null
  }
}

export function getWeatherEmoji(description: string): string {
  const d = description.toLowerCase()
  if (d.includes('thunder')) return '⛈️'
  if (d.includes('drizzle')) return '🌦️'
  if (d.includes('rain')) return '🌧️'
  if (d.includes('snow')) return '❄️'
  if (d.includes('mist') || d.includes('fog') || d.includes('haze')) return '🌫️'
  if (d.includes('clear')) return '☀️'
  if (d.includes('few clouds')) return '🌤️'
  if (d.includes('scattered')) return '⛅'
  if (d.includes('cloud')) return '☁️'
  return '🌡️'
}

export function getFarmingAdvice(weather: WeatherData): string[] {
  const advice: string[] = []
  const desc = weather.description.toLowerCase()
  const temp = weather.temp
  const humidity = weather.humidity
  const wind = weather.windSpeed

  if (desc.includes('rain') || desc.includes('drizzle')) {
    advice.push('🌧️ Rain expected — avoid spraying today')
    advice.push('💧 Check drainage channels and low-lying fields')
  }
  if (desc.includes('thunder')) {
    advice.push('⛈️ Storm warning — secure equipment and livestock')
    advice.push('🚫 Do not operate machinery in lightning conditions')
  }
  if (temp > 35) {
    advice.push('🌡️ Extreme heat — increase livestock water supply')
    advice.push('💧 Monitor irrigation — high evaporation today')
    advice.push('🕕 Schedule heavy outdoor work for early morning')
  }
  if (temp < 5) {
    advice.push('🥶 Near-freezing temperatures — protect sensitive crops')
    advice.push('🐄 Ensure livestock have adequate shelter and feed')
  }
  if (wind > 30) {
    advice.push('💨 High winds — avoid spraying (drift risk)')
    advice.push('🌱 Check young plants and seedlings for wind damage')
  }
  if (humidity > 80 && !desc.includes('rain')) {
    advice.push('💦 High humidity — monitor for fungal diseases')
    advice.push('🍅 Check tomatoes and grapes for blight conditions')
  }
  if (humidity < 30) {
    advice.push('🏜️ Very dry conditions — increase irrigation frequency')
    advice.push('🔥 High fire risk — clear dry brush around buildings')
  }
  if (advice.length === 0) {
    advice.push('✅ Good conditions for most farm activities today')
    advice.push('🌱 Ideal weather for planting, spraying, and field work')
  }

  return advice
}

// SA cities for quick selection
export const SA_CITIES = [
  { name: 'Johannesburg', lat: -26.2041, lon: 28.0473 },
  { name: 'Cape Town', lat: -33.9249, lon: 18.4241 },
  { name: 'Durban', lat: -29.8587, lon: 31.0218 },
  { name: 'Pretoria', lat: -25.7479, lon: 28.2293 },
  { name: 'Bloemfontein', lat: -29.0852, lon: 26.1596 },
  { name: 'Port Elizabeth', lat: -33.9608, lon: 25.6022 },
  { name: 'Polokwane', lat: -23.9045, lon: 29.4688 },
  { name: 'Nelspruit', lat: -25.4745, lon: 30.9703 },
  { name: 'Kimberley', lat: -28.7323, lon: 24.7623 },
  { name: 'George', lat: -33.9636, lon: 22.4597 },
  { name: 'Upington', lat: -28.4478, lon: 21.2561 },
  { name: 'Rustenburg', lat: -25.6674, lon: 27.2423 },
  { name: 'Tzaneen', lat: -23.8333, lon: 30.1667 },
  { name: 'Limpopo', lat: -23.4013, lon: 29.4179 },
]
