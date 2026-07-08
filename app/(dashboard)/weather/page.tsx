'use client'

import { useEffect, useState } from 'react'
import { Cloud, CloudRain, Sun, Wind, Droplets, Eye, Gauge, AlertCircle, MapPin } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface WeatherData {
  current: {
    temp: number
    feels_like: number
    humidity: number
    pressure: number
    wind_speed: number
    description: string
    icon: string
    visibility: number
    uvi: number
  }
  hourly: Array<{
    dt: number
    temp: number
    rain?: number
    weather: Array<{ main: string; icon: string }>
  }>
  daily: Array<{
    dt: number
    temp: { day: number; min: number; max: number }
    rain?: number
    weather: Array<{ main: string; icon: string }>
  }>
  timezone: string
}

const getWeatherIcon = (description: string, size = 24) => {
  const desc = description.toLowerCase()
  if (desc.includes('rain')) return <CloudRain size={size} className="text-blue-400" />
  if (desc.includes('cloud')) return <Cloud size={size} className="text-gray-400" />
  if (desc.includes('clear') || desc.includes('sunny')) return <Sun size={size} className="text-yellow-400" />
  return <Sun size={size} className="text-yellow-400" />
}

export default function WeatherPage() {
  const [location, setLocation] = useState('Johannesburg')
  const [searchInput, setSearchInput] = useState('')
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lat, setLat] = useState<number | null>(null)
  const [lon, setLon] = useState<number | null>(null)

  const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || 'demo'

  // Fetch weather data
  const fetchWeather = async (latitude: number, longitude: number) => {
    try {
      setLoading(true)
      setError(null)

      // For demo purposes, using a different approach if no real API key
      if (API_KEY === 'demo') {
        // Mock data for demonstration
        setWeather({
          current: {
            temp: 22,
            feels_like: 20,
            humidity: 65,
            pressure: 1013,
            wind_speed: 12,
            description: 'Partly Cloudy',
            icon: '02d',
            visibility: 10000,
            uvi: 6,
          },
          hourly: Array(12)
            .fill(null)
            .map((_, i) => ({
              dt: Date.now() / 1000 + i * 3600,
              temp: 22 - i * 0.5,
              rain: i % 3 === 0 ? 2 : 0,
              weather: [{ main: 'Clouds', icon: '02d' }],
            })),
          daily: Array(7)
            .fill(null)
            .map((_, i) => ({
              dt: Date.now() / 1000 + i * 86400,
              temp: { day: 24 - i * 0.2, min: 18 - i * 0.1, max: 28 - i * 0.3 },
              rain: i % 2 === 0 ? 5 : 0,
              weather: [{ main: 'Partly Cloudy', icon: '02d' }],
            })),
          timezone: 'Africa/Johannesburg',
        })
        setLocation('Johannesburg (Demo)')
        setLoading(false)
        return
      }

      const response = await fetch(
        `https://api.openweathermap.org/data/3.0/onecall?lat=${latitude}&lon=${longitude}&units=metric&appid=${API_KEY}`
      )

      if (!response.ok) throw new Error('Failed to fetch weather data')

      const data = await response.json()
      setWeather(data)
      setLat(latitude)
      setLon(longitude)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Get user's location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setLat(latitude)
          setLon(longitude)
          fetchWeather(latitude, longitude)
        },
        () => {
          // Default to Johannesburg if geolocation fails
          setLat(-26.2023)
          setLon(28.0436)
          fetchWeather(-26.2023, 28.0436)
        }
      )
    }
  }, [])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchInput.trim()) return

    try {
      setLoading(true)
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${searchInput}&limit=1&appid=${API_KEY}`
      )

      if (!response.ok) throw new Error('Location not found')

      const data = await response.json()
      if (data.length === 0) {
        setError('Location not found. Using demo data.')
        return
      }

      const { lat: newLat, lon: newLon, name } = data[0]
      setLocation(name)
      setSearchInput('')
      await fetchWeather(newLat, newLon)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  if (loading && !weather) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2D6A4F]"></div>
      </div>
    )
  }

  const currentWeather = weather?.current
  const forecastDaily = weather?.daily || []

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-2 text-[#1B4332]">Weather & Farm Conditions</h1>
      <p className="text-gray-600 mb-6">Real-time weather data and forecast for optimal farming decisions</p>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-6 flex gap-2">
        <Input
          type="text"
          placeholder="Search location..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" className="bg-[#2D6A4F] hover:bg-[#1B4332]">
          Search
        </Button>
      </form>

      {error && (
        <Card className="mb-6 border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6 flex gap-2">
            <AlertCircle className="text-yellow-600 flex-shrink-0" />
            <p className="text-yellow-800">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Current Weather */}
      {currentWeather && (
        <Card className="mb-6 bg-gradient-to-br from-[#D8F3DC] to-[#52B788] border-0">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin size={20} className="text-[#1B4332]" />
                  <h2 className="text-2xl font-bold text-[#1B4332]">{location}</h2>
                </div>
                <p className="text-sm text-[#2D6A4F]">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <div className="text-right">
                <div className="text-5xl font-bold text-[#1B4332]">{Math.round(currentWeather.temp)}°C</div>
                <p className="text-[#2D6A4F]">Feels like {Math.round(currentWeather.feels_like)}°C</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Droplets size={20} className="text-blue-500" />
                  <p className="text-sm font-semibold text-[#1B4332]">Humidity</p>
                </div>
                <p className="text-2xl font-bold text-[#2D6A4F]">{currentWeather.humidity}%</p>
              </div>

              <div className="bg-white/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Wind size={20} className="text-cyan-500" />
                  <p className="text-sm font-semibold text-[#1B4332]">Wind Speed</p>
                </div>
                <p className="text-2xl font-bold text-[#2D6A4F]">{Math.round(currentWeather.wind_speed)} m/s</p>
              </div>

              <div className="bg-white/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Eye size={20} className="text-purple-500" />
                  <p className="text-sm font-semibold text-[#1B4332]">Visibility</p>
                </div>
                <p className="text-2xl font-bold text-[#2D6A4F]">{(currentWeather.visibility / 1000).toFixed(1)} km</p>
              </div>

              <div className="bg-white/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Gauge size={20} className="text-orange-500" />
                  <p className="text-sm font-semibold text-[#1B4332]">Pressure</p>
                </div>
                <p className="text-2xl font-bold text-[#2D6A4F]">{currentWeather.pressure} hPa</p>
              </div>
            </div>

            <div className="mt-4 p-4 bg-white/50 rounded-lg">
              <p className="text-[#1B4332] font-semibold capitalize">{currentWeather.description}</p>
              <p className="text-sm text-[#2D6A4F]">UV Index: {currentWeather.uvi} {currentWeather.uvi > 6 ? '⚠️ High' : currentWeather.uvi > 3 ? '⚡ Moderate' : '✓ Low'}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 7-Day Forecast */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[#1B4332]">7-Day Forecast</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {forecastDaily.slice(0, 7).map((day, idx) => {
              const date = new Date(day.dt * 1000)
              const dayName = idx === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' })
              const rain = day.rain || 0

              return (
                <div key={idx} className="bg-gradient-to-b from-[#D8F3DC] to-[#D8F3DC] rounded-lg p-4 text-center border border-[#52B788]">
                  <p className="font-semibold text-[#1B4332] mb-2">{dayName}</p>
                  <div className="flex justify-center mb-2">{getWeatherIcon(day.weather[0]?.main || 'clear', 32)}</div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-[#1B4332]">
                      {Math.round(day.temp.max)}° / {Math.round(day.temp.min)}°
                    </p>
                    {rain > 0 && <p className="text-xs text-blue-600 font-semibold">🌧️ {rain}mm</p>}
                    <p className="text-xs text-gray-600 capitalize">{day.weather[0]?.main}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Farm Alerts */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-[#1B4332]">Farm Insights & Alerts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {currentWeather && (
            <>
              {currentWeather.humidity > 80 && (
                <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                  <p className="font-semibold text-blue-900">💧 High Humidity Alert</p>
                  <p className="text-sm text-blue-800">High humidity increases risk of fungal diseases. Improve ventilation and reduce irrigation.</p>
                </div>
              )}

              {currentWeather.wind_speed > 25 && (
                <div className="p-4 bg-orange-50 border-l-4 border-orange-500 rounded">
                  <p className="font-semibold text-orange-900">💨 Strong Wind Alert</p>
                  <p className="text-sm text-orange-800">High winds can damage crops and livestock. Secure outdoor equipment and shelter animals.</p>
                </div>
              )}

              {currentWeather.uvi > 8 && (
                <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded">
                  <p className="font-semibold text-red-900">☀️ Extreme UV Alert</p>
                  <p className="text-sm text-red-800">Very high UV index. Ensure livestock has shade and workers use sun protection.</p>
                </div>
              )}

              {forecastDaily.length > 0 && forecastDaily[0].rain && forecastDaily[0].rain > 10 && (
                <div className="p-4 bg-cyan-50 border-l-4 border-cyan-500 rounded">
                  <p className="font-semibold text-cyan-900">🌧️ Heavy Rain Expected</p>
                  <p className="text-sm text-cyan-800">Significant rainfall forecast. Ensure drainage systems are working and postpone spraying.</p>
                </div>
              )}

              {currentWeather.humidity < 40 && currentWeather.temp > 25 && (
                <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded">
                  <p className="font-semibold text-yellow-900">🌤️ Dry Conditions</p>
                  <p className="text-sm text-yellow-800">Dry and warm conditions require additional irrigation. Monitor soil moisture.</p>
                </div>
              )}

              {!currentWeather.humidity || !currentWeather.wind_speed ? (
                <div className="p-4 bg-gray-50 border-l-4 border-gray-300 rounded">
                  <p className="text-sm text-gray-600">✓ Current conditions are favorable for farming operations</p>
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      {/* API Key Notice */}
      {API_KEY === 'demo' && (
        <Card className="mt-6 border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> This demo uses simulated weather data. To enable real weather data:
            </p>
            <ol className="text-sm text-yellow-800 mt-2 ml-4 list-decimal space-y-1">
              <li>Sign up for a free account at <a href="https://openweathermap.org" className="underline">openweathermap.org</a></li>
              <li>Get your API key from the API keys section</li>
              <li>Add <code className="bg-yellow-100 px-2 py-1 rounded">NEXT_PUBLIC_OPENWEATHER_API_KEY</code> to your <code className="bg-yellow-100 px-2 py-1 rounded">.env.local</code> file</li>
              <li>Restart your development server</li>
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
