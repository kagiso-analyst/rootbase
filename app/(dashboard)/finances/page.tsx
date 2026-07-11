'use client'

import { Input } from '@/components/ui/input'
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
  const [customSearch, setCustomSearch] = useState('')

  async function handleCustomSearch() {
    if (!customSearch.trim()) return
    setLoading(true)
    setError('')
    const key = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY
    try {
      const res = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(customSearch)}&limit=1&appid=${key}`
      )
      const data = await res.json()
      if (data && data[0]) {
        const w = await fetchWeather(data[0].lat, data[0].lon)
        if (w) {
          setWeather(w)
          setLastUpdated(new Date())
          setSelectedCity('')
        } else {
          setError(`Could not get weather for "${customSearch}"`)
        }
      } else {
        setError(`City "${customSearch}" not found. Try a different spelling.`)
      }
    } catch {
      setError('Search failed. Check your connection.')
    }
    setLoading(false)
  }

  async function loadWeatherByGPS() {
    setLoading(true)
    setError('')
    setUsingGPS(true)
    
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      setLoading(false)
      return
    }
    
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const data = await fetchWeather(pos.coords.latitude, pos.coords.longitude)
        if (data) {
          setWeather(data)
          setLastUpdated(new Date())
          setSelectedCity('')
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
    if (!city) {
      setError('City not found')
      setLoading(false)
      return
    }
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

      {/* Custom location search */}
      <div className="flex gap-2">
        <Input
          placeholder="Type any city name..."
          value={customSearch}
          onChange={(e) => setCustomSearch((e.target as HTMLInputElement).value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCustomSearch()}
          className="flex-1"
        />
        <Button variant="outline" onClick={handleCustomSearch}>
          Search
        </Button>
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
              {advice.length === 0 ? (
                <p className="text-sm text-gray-400">No specific advice for today's conditions.</p>
              ) : (
                <div className="space-y-2">
                  {advice.map((tip, i) => (
                    <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                      <p className="text-sm text-gray-700">{tip}</p>
                    </div>
                  ))}
                </div>
              )}
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
      ) : (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-gray-400">
            <div className="text-4xl mb-3">🌍</div>
            <p className="text-sm font-medium">No weather data available</p>
            <p className="text-xs mt-1">Try searching for a city or using GPS</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}