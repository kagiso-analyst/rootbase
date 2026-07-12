'use client'

import { Input } from '@/components/ui/input'
import { useState, useEffect } from 'react'
import {
  Wind, Droplets, Thermometer, Eye, Sunrise,
  Sunset, MapPin, RefreshCw, AlertTriangle,
  Search, X // 👈 ADD Search and X
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  fetchWeather, getWeatherEmoji, getFarmingAdvice,
  SA_CITIES, type WeatherData, searchCity
} from '@/lib/weather'
import { useFarm } from '@/lib/farm-context' // 👈 ADD THIS for farm name display

function formatTime(unix: number): string {
  return new Date(unix * 1000).toLocaleTimeString('en-ZA', {
    hour: '2-digit', minute: '2-digit'
  })
}

export default function WeatherPage() {
  // ===== STATE =====
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [usingGPS, setUsingGPS] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [customSearch, setCustomSearch] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false) // 👈 ADD THIS

  // 👇 Get current farm for display
  const { currentFarm } = useFarm()

  // ===== LOAD WEATHER =====
  async function loadWeatherByGPS() {
    setLoading(true)
    setError('')
    setUsingGPS(true)
    setIsRefreshing(false)
    
    if (!navigator.geolocation) {
      // Browser doesn't support geolocation
      setUsingGPS(false)
      const jozi = SA_CITIES[0]
      const data = await fetchWeather(jozi.lat, jozi.lon)
      if (data) {
        setWeather(data)
        setLastUpdated(new Date())
        setSelectedCity(jozi.name)
      } else {
        setError('Could not load weather. Please check your connection.')
      }
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const data = await fetchWeather(pos.coords.latitude, pos.coords.longitude)
          if (data) {
            setWeather(data)
            setLastUpdated(new Date())
            setSelectedCity('')
          } else {
            setError('Could not load weather data. Please try again.')
          }
        } catch (err) {
          setError('Failed to fetch weather data.')
          console.error('Weather fetch error:', err)
        }
        setLoading(false)
        setIsRefreshing(false)
      },
      async (err) => {
        console.error('GPS error:', err)
        // GPS denied — fall back to Johannesburg
        setUsingGPS(false)
        const jozi = SA_CITIES[0]
        try {
          const data = await fetchWeather(jozi.lat, jozi.lon)
          if (data) {
            setWeather(data)
            setLastUpdated(new Date())
            setSelectedCity(jozi.name)
          } else {
            setError('Could not load weather. Please check your connection.')
          }
        } catch (err) {
          setError('Failed to fetch weather data.')
        }
        setLoading(false)
        setIsRefreshing(false)
      }
    )
  }

  async function loadWeatherByCity(cityName: string) {
    setLoading(true)
    setError('')
    setUsingGPS(false)
    setIsRefreshing(false)
    
    try {
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
        setSelectedCity(cityName)
      } else {
        setError('Could not load weather data.')
      }
    } catch (err) {
      setError('Failed to fetch weather data.')
      console.error('Weather fetch error:', err)
    }
    setLoading(false)
  }

  async function handleCustomSearch() {
    if (!customSearch.trim()) return
    
    setLoading(true)
    setError('')
    setIsRefreshing(false)
    
    try {
      const coords = await searchCity(customSearch)
      if (coords) {
        const w = await fetchWeather(coords.lat, coords.lon)
        if (w) { 
          setWeather(w)
          setLastUpdated(new Date())
          setSelectedCity(w.city || customSearch)
          setUsingGPS(false)
        } else {
          setError('Could not load weather for that location.')
        }
      } else {
        setError(`"${customSearch}" not found. Try a different spelling.`)
      }
    } catch (err) {
      setError('Failed to search for location.')
      console.error('Search error:', err)
    }
    setLoading(false)
  }

  // ===== REFRESH =====
  async function handleRefresh() {
    setIsRefreshing(true)
    if (usingGPS) {
      await loadWeatherByGPS()
    } else if (selectedCity && SA_CITIES.some(c => c.name === selectedCity)) {
      await loadWeatherByCity(selectedCity)
    } else if (weather) {
      // Try to refresh with current location
      await loadWeatherByGPS()
    } else {
      await loadWeatherByGPS()
    }
  }

  // ===== CLEAR SEARCH =====
  function clearSearch() {
    setCustomSearch('')
    setError('')
  }

  useEffect(() => {
    loadWeatherByGPS()
  }, [])

  const advice = weather ? getFarmingAdvice(weather) : []

  // ===== LOADING STATE =====
  if (loading && !isRefreshing) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#2D6A4F] border-t-transparent mx-auto mb-3"></div>
          <p className="text-sm text-gray-400">Loading weather data...</p>
        </div>
      </div>
    )
  }

  // ===== ACTUAL PAGE =====
  return (
    <div className="space-y-6">
      {/* Header with farm name */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#1B4332]">Farm Weather</h1>
            {currentFarm && (
              <span className="text-xs bg-[#D8F3DC] text-[#2D6A4F] px-2 py-0.5 rounded-full font-medium">
                {currentFarm.name}
              </span>
            )}
          </div>
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
            <SelectTrigger className="w-48 border-gray-200 focus:border-[#2D6A4F] focus:ring-[#2D6A4F]">
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
            className="border-gray-200 hover:border-[#2D6A4F] hover:text-[#2D6A4F]"
          >
            <MapPin size={16} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="border-gray-200 hover:border-[#2D6A4F] hover:text-[#2D6A4F]"
            title="Refresh weather"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      {/* Custom location search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Type any city name..."
            value={customSearch}
            onChange={(e) => setCustomSearch((e.target as HTMLInputElement).value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCustomSearch()}
            className="pl-9 pr-9 border-gray-200 focus:border-[#2D6A4F] focus:ring-[#2D6A4F]"
          />
          {customSearch && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <Button 
          variant="outline" 
          onClick={handleCustomSearch}
          className="border-gray-200 hover:border-[#2D6A4F] hover:text-[#2D6A4F]"
        >
          Search
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <Card className="shadow-sm border-red-200 bg-red-50">
          <CardContent className="py-3 px-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle size={18} className="text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setError('')}
              className="text-red-700 hover:bg-red-100"
            >
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      {weather ? (
        <>
          {/* Current weather hero */}
          <Card className="shadow-sm bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] text-white overflow-hidden">
            <CardContent className="pt-8 pb-8 relative">
              {/* Decorative circle */}
              <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5"></div>
              <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-white/5"></div>
              
              <div className="flex items-center justify-between flex-wrap gap-6 relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin size={14} className="text-[#52B788]" />
                    <p className="text-[#52B788] text-sm font-medium">
                      {weather.city}, {weather.country}
                      {usingGPS && <span className="ml-1 text-xs text-[#52B788]/60">(GPS)</span>}
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
                  <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                    <Droplets size={16} className="text-[#52B788]" />
                    <div>
                      <p className="text-xs text-[#D8F3DC]">Humidity</p>
                      <p className="text-sm font-semibold">{weather.humidity}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                    <Wind size={16} className="text-[#52B788]" />
                    <div>
                      <p className="text-xs text-[#D8F3DC]">Wind</p>
                      <p className="text-sm font-semibold">{weather.windSpeed} km/h</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                    <Sunrise size={16} className="text-[#52B788]" />
                    <div>
                      <p className="text-xs text-[#D8F3DC]">Sunrise</p>
                      <p className="text-sm font-semibold">{formatTime(weather.sunrise)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
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
          {advice.length > 0 && (
            <Card className="shadow-sm border-[#52B788] bg-gradient-to-br from-white to-[#D8F3DC]/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-[#1B4332] flex items-center gap-2">
                  <span>🌱</span> Today's Farming Advice
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {advice.map((tip, i) => (
                    <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
                      <span className="text-[#2D6A4F] text-sm">•</span>
                      <p className="text-sm text-gray-700">{tip}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 7-day forecast */}
          <Card className="shadow-sm border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-gray-700">7-Day Forecast</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                {weather.forecast.map((day, i) => (
                  <div key={i} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50/50 transition-colors">
                    <div className="w-12">
                      <p className={`text-sm font-medium ${i === 0 ? 'text-[#2D6A4F]' : 'text-gray-700'}`}>
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
                          <p className="text-xs text-blue-500 font-medium">{day.rainChance}%</p>
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

          {/* Warnings */}
          {weather.forecast.slice(0, 3).some(d => d.rainChance > 50) && (
            <Card className="shadow-sm border-blue-200 bg-gradient-to-br from-blue-50 to-white">
              <CardContent className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Droplets size={16} className="text-blue-500" />
                  </div>
                  <p className="text-sm font-medium text-blue-700">
                    Rain expected in the next 3 days — plan spraying and harvesting accordingly
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {weather.forecast.slice(0, 3).some(d => d.tempMin < 4) && (
            <Card className="shadow-sm border-indigo-200 bg-gradient-to-br from-indigo-50 to-white">
              <CardContent className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <Thermometer size={16} className="text-indigo-500" />
                  </div>
                  <p className="text-sm font-medium text-indigo-700">
                    Frost risk detected in the next 3 days — protect sensitive crops and livestock water supply
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