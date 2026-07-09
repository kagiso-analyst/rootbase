'use client'

import { useState, useEffect } from 'react'
import {
  Wind, Droplets, Thermometer, Eye, Sunrise,
  Sunset, MapPin, RefreshCw, AlertTriangle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  fetchWeather, getWeatherEmoji, getFarmingAdvice,
  SA_CITIES, type WeatherData
} from '@/lib/weather'

function formatTime(unix: number): string {
  return new Date(unix * 1000).toLocaleTimeString('en-ZA', {
    hour: '2-digit', minute: '2-digit'
  })
}

export default function WeatherPage() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [usingGPS, setUsingGPS] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  async function loadWeatherByGPS() {
    setLoading(true)
    setError('')
    setUsingGPS(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const data = await fetchWeather(pos.coords.latitude, pos.coords.longitude)
        if (data) {
          setWeather(data)
          setLastUpdated(new Date())
        } else {
          setError('Could not load weather data. Check your API key.')
        }
        setLoading(false)
      },
      async () => {
        // GPS denied — fall back to Johannesburg
        setUsingGPS(false)
        const jozi = SA_CITIES[0]
        const data = await fetchWeather(jozi.lat, jozi.lon)
        if (data) {
          setWeather(data)
          setLastUpdated(new Date())
          setSelectedCity(jozi.name)
        } else {
          setError('Could not load weather. Check your API key in .env.local')
        }
        setLoading(false)
      }
    )
  }

  async function loadWeatherByCity(cityName: string) {
    setLoading(true)
    setError('')
    setUsingGPS(false)
    const city = SA_CITIES.find(c => c.name === cityName)
    if (!city) return
    const data = await fetchWeather(city.lat, city.lon)
    if (data) {
      setWeather(data)
      setLastUpdated(new Date())
    } else {
      setError('Could not load weather data.')
    }
    setLoading(false)
  }

  useEffect(() => {
    loadWeatherByGPS()
  }, [])

  const advice = weather ? getFarmingAdvice(weather) : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1B4332]">Farm Weather</h1>
          <p className="text-gray-500 text-sm mt-1">
            {lastUpdated
              ? `Updated at ${lastUpdated.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}`
              : 'Loading weather data...'
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedCity} onValueChange={(val) => {
            setSelectedCity(val ?? '')
            if (val) loadWeatherByCity(val)
          }}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={usingGPS ? '📍 My Location' : 'Select city'} />
            </SelectTrigger>
            <SelectContent>
              {SA_CITIES.map(city => (
                <SelectItem key={city.name} value={city.name}>{city.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={loadWeatherByGPS}
            title="Use my location"
          >
            <MapPin size={16} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => weather && loadWeatherByGPS()}
            title="Refresh"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      {error && (
        <Card className="shadow-sm border-red-200 bg-red-50">
          <CardContent className="py-4 flex items-center gap-3">
            <AlertTriangle size={18} className="text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <Card className="shadow-sm">
          <CardContent className="flex items-center justify-center py-20 text-gray-400">
            <div className="text-center">
              <div className="text-4xl mb-3 animate-pulse">🌤️</div>
              <p className="text-sm">Loading weather data...</p>
            </div>
          </CardContent>
        </Card>
      ) : weather ? (
        <>
          {/* Current weather hero */}
          <Card className="shadow-sm bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] text-white">
            <CardContent className="pt-8 pb-8">
              <div className="flex items-center justify-between flex-wrap gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin size={14} className="text-[#52B788]" />
                    <p className="text-[#52B788] text-sm font-medium">
                      {weather.city}, {weather.country}
                    </p>
                  </div>
                  <div className="flex items-end gap-3">
                    <p className="text-7xl font-bold">{weather.temp}°</p>
                    <div className="mb-2">
                      <p className="text-2xl">{getWeatherEmoji(weather.description)}</p>
                      <p className="text-[#D8F3DC] capitalize text-sm">{weather.description}</p>
                    </div>
                  </div>
                  <p className="text-[#D8F3DC] text-sm mt-1">
                    Feels like {weather.feelsLike}°C
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Droplets size={16} className="text-[#52B788]" />
                    <div>
                      <p className="text-xs text-[#D8F3DC]">Humidity</p>
                      <p className="text-sm font-semibold">{weather.humidity}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wind size={16} className="text-[#52B788]" />
                    <div>
                      <p className="text-xs text-[#D8F3DC]">Wind</p>
                      <p className="text-sm font-semibold">{weather.windSpeed} km/h</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sunrise size={16} className="text-[#52B788]" />
                    <div>
                      <p className="text-xs text-[#D8F3DC]">Sunrise</p>
                      <p className="text-sm font-semibold">{formatTime(weather.sunrise)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sunset size={16} className="text-[#52B788]" />
                    <div>
                      <p className="text-xs text-[#D8F3DC]">Sunset</p>
                      <p className="text-sm font-semibold">{formatTime(weather.sunset)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Farming advice */}
          <Card className="shadow-sm border-[#52B788]">
            <CardHeader>
              <CardTitle className="text-base text-[#1B4332]">
                🌱 Today's Farming Advice
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {advice.map((tip, i) => (
                  <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                    <p className="text-sm text-gray-700">{tip}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 7-day forecast */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">7-Day Forecast</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                {weather.forecast.map((day, i) => (
                  <div key={i} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50">
                    <div className="w-12">
                      <p className="text-sm font-medium text-gray-700">
                        {i === 0 ? 'Today' : day.dayName}
                      </p>
                      <p className="text-xs text-gray-400">{day.date.slice(5)}</p>
                    </div>
                    <div className="flex items-center gap-2 w-32">
                      <span className="text-xl">{getWeatherEmoji(day.description)}</span>
                      <p className="text-xs text-gray-500 capitalize truncate">{day.description}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {day.rainChance > 0 && (
                        <div className="flex items-center gap-1">
                          <Droplets size={12} className="text-blue-400" />
                          <p className="text-xs text-blue-500">{day.rainChance}%</p>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Wind size={12} className="text-gray-400" />
                        <p className="text-xs text-gray-400">{day.windSpeed}km/h</p>
                      </div>
                      <div className="flex items-center gap-2 w-20 justify-end">
                        <p className="text-xs text-blue-500 font-medium">{day.tempMin}°</p>
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-300 to-orange-400 rounded-full"
                            style={{ width: `${Math.min(((day.tempMax - day.tempMin) / 20) * 100, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-orange-500 font-medium">{day.tempMax}°</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Rain warning if any */}
          {weather.forecast.slice(0, 3).some(d => d.rainChance > 50) && (
            <Card className="shadow-sm border-blue-200 bg-blue-50">
              <CardContent className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <Droplets size={16} className="text-blue-500" />
                  <p className="text-sm font-medium text-blue-700">
                    Rain expected in the next 3 days —
                    plan spraying and harvesting accordingly
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Frost warning */}
          {weather.forecast.slice(0, 3).some(d => d.tempMin < 4) && (
            <Card className="shadow-sm border-indigo-200 bg-indigo-50">
              <CardContent className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <Thermometer size={16} className="text-indigo-500" />
                  <p className="text-sm font-medium text-indigo-700">
                    Frost risk detected in the next 3 days —
                    protect sensitive crops and livestock water supply
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : null}
    </div>
  )
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
