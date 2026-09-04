import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchWeather } from '../../lib/weather'

describe('fetchWeather', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('keeps current conditions when the forecast is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        current: {
          cod: 200,
          main: { temp: 24, feels_like: 25, humidity: 55 },
          wind: { speed: 3 },
          weather: [{ description: 'clear sky', icon: '01d' }],
          name: 'Johannesburg',
          sys: { country: 'ZA', sunrise: 100, sunset: 200 },
        },
        forecast: null,
      }),
    }))

    const weather = await fetchWeather(-26.2041, 28.0473)

    expect(weather).toMatchObject({
      temp: 24,
      feelsLike: 25,
      city: 'Johannesburg',
      forecast: [],
    })
  })

  it('returns null for an unsuccessful weather API response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Weather service unavailable' }),
    }))

    await expect(fetchWeather(-26.2041, 28.0473)).resolves.toBeNull()
  })
})
