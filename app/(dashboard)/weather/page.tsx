// app/(dashboard)/weather/page.tsx

'use client'

import { Input } from '@/components/ui/input'
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Wind, Droplets, Thermometer, Eye, Sunrise,
  Sunset, MapPin, RefreshCw, AlertTriangle,
  Search, X, Sparkles, Bell, BellOff, ChevronDown, ChevronUp
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  fetchWeather, getWeatherEmoji, getFarmingAdvice,
  SA_CITIES, type WeatherData, searchCity
} from '@/lib/weather'
import { useFarm } from '@/lib/farm-context'
import { cn, getSeasonalGreeting } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { checkWeatherAlerts } from '@/lib/weather-alerts'

function formatTime(unix: number): string {
  return new Date(unix * 1000).toLocaleTimeString('en-ZA', {
    hour: '2-digit', minute: '2-digit'
  })
}

// Alert severity configuration
const SEVERITY_CONFIG = {
  warning: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    badge: 'bg-red-100 text-red-700 border-red-200',
    icon: '🔴'
  },
  watch: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-700',
    badge: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    icon: '🟡'
  },
  advisory: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: '🔵'
  }
}

const ALERT_ICONS = {
  severe_weather: '⚡',
  frost: '❄️',
  heavy_rain: '🌧️',
  extreme_heat: '🔥',
  strong_wind: '💨'
}

const ALERT_LABELS = {
  severe_weather: 'Severe Weather',
  frost: 'Frost Warning',
  heavy_rain: 'Heavy Rain',
  extreme_heat: 'Extreme Heat',
  strong_wind: 'Strong Wind'
}

export default function WeatherPage() {
  // ===== AUTH STATE =====
  const [user, setUser] = useState<any>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const supabase = createClient()

  // ===== FARM CONTEXT =====
  const { currentFarm, loading: farmLoading } = useFarm()

  // ===== WEATHER STATE =====
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [usingGPS, setUsingGPS] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [customSearch, setCustomSearch] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [greeting, setGreeting] = useState('')
  
  // ===== ALERT STATE =====
  const [alerts, setAlerts] = useState<any[]>([])
  const [alertCount, setAlertCount] = useState(0)
  const [showAlerts, setShowAlerts] = useState(false)
  const [checkingAlerts, setCheckingAlerts] = useState(false)
  const [autoCheckEnabled, setAutoCheckEnabled] = useState(true)
  const alertCheckInterval = useRef<NodeJS.Timeout | null>(null)

  // ===== CHECK AUTH =====
  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        if (user) {
          const seasonal = getSeasonalGreeting(
            user.user_metadata?.full_name?.split(' ')[0] || 'Farmer'
          )
          setGreeting(seasonal.greeting)
        }
      } catch (err) {
        console.error('Auth check error:', err)
        setError('Failed to authenticate. Please refresh the page.')
      } finally {
        setAuthChecked(true)
      }
    }
    checkAuth()
  }, [supabase])

  // ===== FETCH EXISTING ALERTS =====
  const fetchExistingAlerts = useCallback(async () => {
    if (!currentFarm || !user) return
    
    try {
      const { data: existingAlerts, error: fetchError } = await supabase
        .from('weather_alerts')
        .select('*')
        .eq('farm_id', currentFarm.id)
        .eq('user_id', user.id)
        .order('date', { ascending: false })
      
      if (fetchError) throw fetchError
      
      if (existingAlerts) {
        const unread = existingAlerts.filter(a => !a.is_read)
        setAlerts(existingAlerts)
        setAlertCount(unread.length)
      }
    } catch (err) {
      console.error('Failed to fetch alerts:', err)
    }
  }, [currentFarm, user, supabase])

  // ===== CHECK AND SAVE ALERTS =====
  const checkAndSaveAlerts = useCallback(async (lat: number, lon: number) => {
    if (!user || !currentFarm) return
    
    setCheckingAlerts(true)
    try {
      const newAlerts = await checkWeatherAlerts(lat, lon, currentFarm.id, user.id)
      if (newAlerts && newAlerts.length > 0) {
        setAlerts(prev => [...newAlerts, ...prev])
        setAlertCount(prev => prev + newAlerts.length)
        
        // Show a notification in the UI
        setError(`⚠️ ${newAlerts.length} new weather alert${newAlerts.length > 1 ? 's' : ''} detected!`)
        setTimeout(() => setError(''), 5000)
      }
      
      // Refresh existing alerts
      await fetchExistingAlerts()
    } catch (err) {
      console.error('Failed to check weather alerts:', err)
    } finally {
      setCheckingAlerts(false)
    }
  }, [user, currentFarm, fetchExistingAlerts])

  // ===== LOAD WEATHER FUNCTIONS =====
  const loadWeatherByGPS = useCallback(async () => {
    setLoading(true)
    setError('')
    setUsingGPS(true)
    setIsRefreshing(false)
    
    if (!navigator.geolocation) {
      setUsingGPS(false)
      const jozi = SA_CITIES[0]
      const data = await fetchWeather(jozi.lat, jozi.lon)
      if (data) {
        setWeather(data)
        setLastUpdated(new Date())
        setSelectedCity(jozi.name)
        await checkAndSaveAlerts(jozi.lat, jozi.lon)
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
            await checkAndSaveAlerts(pos.coords.latitude, pos.coords.longitude)
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
        setUsingGPS(false)
        const jozi = SA_CITIES[0]
        try {
          const data = await fetchWeather(jozi.lat, jozi.lon)
          if (data) {
            setWeather(data)
            setLastUpdated(new Date())
            setSelectedCity(jozi.name)
            await checkAndSaveAlerts(jozi.lat, jozi.lon)
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
  }, [checkAndSaveAlerts])

  const loadWeatherByCity = useCallback(async (cityName: string) => {
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
        await checkAndSaveAlerts(city.lat, city.lon)
      } else {
        setError('Could not load weather data.')
      }
    } catch (err) {
      setError('Failed to fetch weather data.')
      console.error('Weather fetch error:', err)
    }
    setLoading(false)
  }, [checkAndSaveAlerts])

  const handleCustomSearch = useCallback(async () => {
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
          await checkAndSaveAlerts(coords.lat, coords.lon)
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
  }, [customSearch, checkAndSaveAlerts])

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    if (usingGPS) {
      await loadWeatherByGPS()
    } else if (selectedCity && SA_CITIES.some(c => c.name === selectedCity)) {
      await loadWeatherByCity(selectedCity)
    } else if (weather) {
      await loadWeatherByGPS()
    } else {
      await loadWeatherByGPS()
    }
  }, [usingGPS, selectedCity, weather, loadWeatherByGPS, loadWeatherByCity])

  // ===== ALERT MANAGEMENT =====
  const markAlertAsRead = useCallback(async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('weather_alerts')
        .update({ is_read: true })
        .eq('id', alertId)
      
      if (error) throw error
      
      setAlerts(prev => prev.map(a => 
        a.id === alertId ? { ...a, is_read: true } : a
      ))
      setAlertCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Failed to mark alert as read:', err)
    }
  }, [supabase])

  const markAllAlertsAsRead = useCallback(async () => {
    try {
      const alertIds = alerts.filter(a => !a.is_read).map(a => a.id)
      if (alertIds.length === 0) return
      
      const { error } = await supabase
        .from('weather_alerts')
        .update({ is_read: true })
        .in('id', alertIds)
      
      if (error) throw error
      
      setAlerts(prev => prev.map(a => ({ ...a, is_read: true })))
      setAlertCount(0)
    } catch (err) {
      console.error('Failed to mark all alerts as read:', err)
    }
  }, [alerts, supabase])

  const deleteAlert = useCallback(async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('weather_alerts')
        .delete()
        .eq('id', alertId)
      
      if (error) throw error
      
      setAlerts(prev => prev.filter(a => a.id !== alertId))
      const wasUnread = alerts.find(a => a.id === alertId && !a.is_read)
      if (wasUnread) {
        setAlertCount(prev => Math.max(0, prev - 1))
      }
    } catch (err) {
      console.error('Failed to delete alert:', err)
    }
  }, [alerts, supabase])

  const clearSearch = useCallback(() => {
    setCustomSearch('')
    setError('')
  }, [])

  // ===== AUTO-CHECK ALERTS EVERY 30 MINUTES =====
  useEffect(() => {
    if (autoCheckEnabled && weather && currentFarm && user) {
      alertCheckInterval.current = setInterval(async () => {
        // Get current location
        const lat = weather.city ? SA_CITIES.find(c => c.name === weather.city)?.lat : null
        const lon = weather.city ? SA_CITIES.find(c => c.name === weather.city)?.lon : null
        
        if (lat && lon) {
          await checkAndSaveAlerts(lat, lon)
        }
      }, 30 * 60 * 1000) // 30 minutes
    }
    
    return () => {
      if (alertCheckInterval.current) {
        clearInterval(alertCheckInterval.current)
      }
    }
  }, [autoCheckEnabled, weather, currentFarm, user, checkAndSaveAlerts])

  // ===== INITIAL LOAD =====
  useEffect(() => {
    if (authChecked && user) {
      // Load weather
      loadWeatherByGPS()
      // Fetch existing alerts
      fetchExistingAlerts()
    }
  }, [authChecked, user, loadWeatherByGPS, fetchExistingAlerts])

  const advice = weather ? getFarmingAdvice(weather) : []

  // ===== LOADING STATE =====
  if (!authChecked || farmLoading || (loading && !isRefreshing)) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#2D6A4F] border-t-transparent mx-auto mb-3"></div>
          <p className="text-sm text-gray-400">
            {!authChecked ? 'Checking authentication...' : 
             farmLoading ? 'Loading farms...' : 'Loading weather data...'}
          </p>
        </div>
      </div>
    )
  }

  // ===== NOT LOGGED IN =====
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-xl font-semibold text-[#1B4332] mb-2">Please Log In</h2>
        <p className="text-sm text-gray-500">You need to be logged in to view weather data.</p>
        <Link href="/login">
          <Button className="mt-4 bg-[#2D6A4F] hover:bg-[#1B4332] text-white">
            Go to Login
          </Button>
        </Link>
      </div>
    )
  }

  // ===== NO FARM SELECTED =====
  if (!currentFarm) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-5xl mb-4">🏠</div>
        <h2 className="text-xl font-semibold text-[#1B4332] mb-2">No Farm Selected</h2>
        <p className="text-sm text-gray-500">Please select a farm to view weather data.</p>
        <Link href="/settings">
          <Button className="mt-4 bg-[#2D6A4F] hover:bg-[#1B4332] text-white">
            Go to Settings
          </Button>
        </Link>
      </div>
    )
  }

  // ===== ACTUAL PAGE =====
  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#1B4332]">Farm Weather</h1>
            <Badge className="bg-[#D8F3DC] text-[#2D6A4F] text-xs font-medium">
              {currentFarm?.name || 'Farm'}
            </Badge>
            {alertCount > 0 && (
              <Badge className="bg-red-500 text-white text-xs font-medium animate-pulse">
                <Bell size={12} className="mr-1" />
                {alertCount} Alert{alertCount !== 1 ? 's' : ''}
              </Badge>
            )}
            {checkingAlerts && (
              <Badge className="bg-gray-500 text-white text-xs font-medium">
                <RefreshCw size={12} className="mr-1 animate-spin" />
                Checking
              </Badge>
            )}
          </div>
          <p className="text-gray-500 text-sm mt-1">
            {lastUpdated
              ? `Updated at ${lastUpdated.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}`
              : 'Loading weather data...'
            }
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAlerts(!showAlerts)}
            className={`border-[#2D6A4F] ${alertCount > 0 ? 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100' : 'text-[#2D6A4F] hover:bg-[#D8F3DC]'}`}
          >
            {alertCount > 0 ? (
              <>
                <Bell size={14} className="mr-1" />
                {alertCount}
              </>
            ) : (
              <>
                <BellOff size={14} className="mr-1" />
                No Alerts
              </>
            )}
          </Button>
          <Select value={selectedCity} onValueChange={(val) => {
            setSelectedCity(val ?? '')
            if (val) loadWeatherByCity(val)
          }}>
            <SelectTrigger className="w-44 border-gray-200 focus:border-[#2D6A4F] focus:ring-[#2D6A4F]">
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

      {/* Weather Alerts Panel */}
      {showAlerts && (
        <Card className="shadow-sm border-red-200 bg-gradient-to-br from-red-50 to-white">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-red-700 flex items-center gap-2">
              <Bell size={16} />
              Weather Alerts
              {alertCount > 0 && (
                <Badge className="bg-red-500 text-white text-xs">
                  {alertCount} unread
                </Badge>
              )}
              <Badge className="bg-gray-200 text-gray-600 text-xs">
                {alerts.length} total
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              {alertCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAlertsAsRead}
                  className="text-xs text-red-600 hover:text-red-800 hover:bg-red-50"
                >
                  Mark all read
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAlerts(false)}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <div className="flex items-center gap-3 py-4 text-gray-500">
                <BellOff size={20} />
                <p className="text-sm">No weather alerts for your area</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {alerts.map((alert) => {
                  const severity = alert.severity as keyof typeof SEVERITY_CONFIG
                  const config = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.advisory
                  const alertIcon = ALERT_ICONS[alert.type as keyof typeof ALERT_ICONS] || '⚠️'
                  const alertLabel = ALERT_LABELS[alert.type as keyof typeof ALERT_LABELS] || alert.type
                  
                  return (
                    <div
                      key={alert.id}
                      className={cn(
                        'flex items-start justify-between p-3 rounded-lg border transition-all',
                        alert.is_read ? 'bg-white border-gray-200 opacity-60' : `${config.bg} ${config.border} shadow-sm`,
                      )}
                    >
                      <div className="flex gap-3 flex-1 min-w-0">
                        <span className="text-xl flex-shrink-0">{alertIcon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={cn(
                              'text-sm font-medium',
                              alert.is_read ? 'text-gray-600' : config.text
                            )}>
                              {alert.title}
                            </p>
                            <Badge className={config.badge}>
                              {alertLabel}
                            </Badge>
                            <Badge className={config.badge}>
                              {alert.severity.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5">{alert.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-400">
                              {new Date(alert.date).toLocaleDateString('en-ZA', { 
                                month: 'short', 
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                        {!alert.is_read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAlertAsRead(alert.id)}
                            className="text-xs text-gray-400 hover:text-gray-600"
                          >
                            Dismiss
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteAlert(alert.id)}
                          className="text-xs text-gray-300 hover:text-red-500"
                        >
                          <X size={14} />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Search */}
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

      {error && !error.includes('alert') && (
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
          <Card className="shadow-sm bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] text-white overflow-hidden">
            <CardContent className="pt-8 pb-8 relative">
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

                <div className="grid grid-cols-2 gap-3">
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

          {advice.length > 0 && (
            <Card className="shadow-sm border-[#52B788] bg-gradient-to-br from-white to-[#D8F3DC]/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-[#1B4332] flex items-center gap-2">
                  <Sparkles size={16} className="text-[#2D6A4F]" />
                  Today's Farming Advice
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

          <Card className="shadow-sm border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-gray-700">7-Day Forecast</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                {weather.forecast.map((day, i) => (
                  <div key={i} className="flex items-center justify-between px-4 sm:px-6 py-3 hover:bg-gray-50/50 transition-colors flex-wrap gap-2">
                    <div className="w-12">
                      <p className={`text-sm font-medium ${i === 0 ? 'text-[#2D6A4F]' : 'text-gray-700'}`}>
                        {i === 0 ? 'Today' : day.dayName}
                      </p>
                      <p className="text-xs text-gray-400">{day.date.slice(5)}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-1 min-w-[80px]">
                      <span className="text-xl">{getWeatherEmoji(day.description)}</span>
                      <p className="text-xs text-gray-500 capitalize truncate">{day.description}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
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
                        <div className="w-12 sm:w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
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

          {/* Weather warnings */}
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