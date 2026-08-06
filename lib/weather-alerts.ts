// lib/weather-alerts.ts

import { createClient } from '@/lib/supabase/client'

export type WeatherAlert = {
  id: string
  type: 'severe_weather' | 'frost' | 'heavy_rain' | 'extreme_heat' | 'strong_wind'
  title: string
  description: string
  severity: 'warning' | 'watch' | 'advisory'
  date: string
  farm_id: string
  user_id: string
  is_read: boolean
}

export async function checkWeatherAlerts(
  lat: number, 
  lon: number, 
  farmId: string, 
  userId: string
): Promise<WeatherAlert[]> {
  const alerts: WeatherAlert[] = []
  const today = new Date().toISOString().split('T')[0]
  const supabase = createClient()

  try {
    // Fetch weather data
    const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_KEY
    if (!apiKey) {
      console.warn('OpenWeather API key not found. Skipping weather alerts.')
      return []
    }

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly&units=metric&appid=${apiKey}`
    )
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`)
    }
    
    const data = await response.json()

    // Check for severe weather alerts from the API
    if (data.alerts && data.alerts.length > 0) {
      data.alerts.forEach((alert: any) => {
        // Check if this alert already exists in the database
        alerts.push({
          id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'severe_weather',
          title: alert.event || 'Severe Weather Alert',
          description: alert.description || alert.event,
          severity: 'warning',
          date: today,
          farm_id: farmId,
          user_id: userId,
          is_read: false,
        })
      })
    }

    // Check for frost (temp < 2°C)
    if (data.daily && data.daily[0]?.temp?.min < 2) {
      alerts.push({
        id: `frost-${Date.now()}`,
        type: 'frost',
        title: 'Frost Warning',
        description: `Temperatures are expected to drop to ${Math.round(data.daily[0].temp.min)}°C. Protect sensitive crops and livestock.`,
        severity: 'warning',
        date: today,
        farm_id: farmId,
        user_id: userId,
        is_read: false,
      })
    }

    // Check for extreme heat (temp > 35°C)
    if (data.daily && data.daily[0]?.temp?.max > 35) {
      alerts.push({
        id: `heat-${Date.now()}`,
        type: 'extreme_heat',
        title: 'Extreme Heat Warning',
        description: `Temperatures are expected to reach ${Math.round(data.daily[0].temp.max)}°C. Ensure livestock have adequate water.`,
        severity: 'warning',
        date: today,
        farm_id: farmId,
        user_id: userId,
        is_read: false,
      })
    }

    // Check for heavy rain (> 20mm)
    if (data.daily && data.daily[0]?.rain && data.daily[0].rain > 20) {
      alerts.push({
        id: `rain-${Date.now()}`,
        type: 'heavy_rain',
        title: 'Heavy Rain Warning',
        description: `${Math.round(data.daily[0].rain)}mm of rain expected. Plan harvesting and spraying accordingly.`,
        severity: 'watch',
        date: today,
        farm_id: farmId,
        user_id: userId,
        is_read: false,
      })
    }

    // Check for strong winds (> 40km/h)
    if (data.daily && data.daily[0]?.wind_speed > 40) {
      alerts.push({
        id: `wind-${Date.now()}`,
        type: 'strong_wind',
        title: 'Strong Wind Warning',
        description: `Wind speeds of ${Math.round(data.daily[0].wind_speed)}km/h expected. Secure equipment and shelters.`,
        severity: 'watch',
        date: today,
        farm_id: farmId,
        user_id: userId,
        is_read: false,
      })
    }

    // Save alerts to database (only if they don't already exist for today)
    for (const alert of alerts) {
      // Check if similar alert already exists for today
      const { data: existing } = await supabase
        .from('weather_alerts')
        .select('id')
        .eq('farm_id', farmId)
        .eq('user_id', userId)
        .eq('type', alert.type)
        .eq('date', alert.date)
        .maybeSingle()

      if (!existing) {
        // Remove the generated id (let DB generate UUID)
        const { type, title, description, severity, date, farm_id, user_id, is_read } = alert
        await supabase
          .from('weather_alerts')
          .insert([{ type, title, description, severity, date, farm_id, user_id, is_read }])
      }
    }

    return alerts
  } catch (err) {
    console.error('Weather alerts check failed:', err)
    return []
  }
}