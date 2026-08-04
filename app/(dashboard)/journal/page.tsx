// app/(dashboard)/journal/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { 
  Plus, BookOpen, Trash2, Tag, MapPin, Leaf, Search, RefreshCw, Sparkles 
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useFarm } from '@/lib/farm-context'
import { cn, getSeasonalGreeting } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Link from 'next/link'

type EntryType =
  | 'General'
  | 'Spraying'
  | 'Fertilising'
  | 'Irrigation'
  | 'Harvesting'
  | 'Planting'
  | 'Scouting'
  | 'Maintenance'
  | 'Weather'
  | 'Other'

type JournalEntry = {
  id: string
  title: string
  content: string
  entry_type: EntryType
  field_name: string
  crop_name: string
  weather_conditions: string
  tags: string[]
  entry_date: string
  created_at: string
  user_id: string
  farm_id: string
}

const ENTRY_TYPE_COLOURS: Record<EntryType, string> = {
  General:     'bg-gray-100 text-gray-600 border-gray-200',
  Spraying:    'bg-blue-100 text-blue-700 border-blue-200',
  Fertilising: 'bg-green-100 text-green-700 border-green-200',
  Irrigation:  'bg-cyan-100 text-cyan-700 border-cyan-200',
  Harvesting:  'bg-purple-100 text-purple-700 border-purple-200',
  Planting:    'bg-lime-100 text-lime-700 border-lime-200',
  Scouting:    'bg-orange-100 text-orange-700 border-orange-200',
  Maintenance: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  Weather:     'bg-sky-100 text-sky-700 border-sky-200',
  Other:       'bg-gray-100 text-gray-500 border-gray-200',
}

const MOOD_OPTIONS = [
  { emoji: '😊', label: 'Good day', value: 'good' },
  { emoji: '😐', label: 'Okay', value: 'okay' },
  { emoji: '😔', label: 'Tough day', value: 'tough' },
  { emoji: '💪', label: 'Hard work', value: 'hard' },
  { emoji: '🌧️', label: 'Weather challenges', value: 'weather' },
]

const WEATHER_OPTIONS = [
  'Sunny ☀️',
  'Cloudy ☁️',
  'Partly Cloudy ⛅',
  'Rainy 🌧️',
  'Stormy ⛈️',
  'Windy 💨',
  'Hot 🌡️',
  'Cold 🥶',
  'Foggy 🌫️',
]

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-ZA', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function groupByDate(entries: JournalEntry[]): Record<string, JournalEntry[]> {
  return entries.reduce((groups, entry) => {
    const date = entry.entry_date
    if (!groups[date]) groups[date] = []
    groups[date].push(entry)
    return groups
  }, {} as Record<string, JournalEntry[]>)
}

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [greeting, setGreeting] = useState('')

  const { currentFarm, loading: farmLoading } = useFarm()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [entryType, setEntryType] = useState<EntryType>('General')
  const [fieldName, setFieldName] = useState('')
  const [cropName, setCropName] = useState('')
  const [weatherConditions, setWeatherConditions] = useState('')
  const [mood, setMood] = useState<string | null>(null)
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [entryDate, setEntryDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  
  const supabase = createClient()

  async function fetchEntries() {
    if (!currentFarm) {
      setEntries([])
      setFetching(false)
      return
    }

    setFetching(true)
    setError(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setUser(null)
        setEntries([])
        setFetching(false)
        return
      }
      
      setUser(user)

      const seasonal = getSeasonalGreeting(user.user_metadata?.full_name?.split(' ')[0] || 'Farmer')
      setGreeting(seasonal.greeting)

      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('farm_id', currentFarm.id)
        .order('created_at', { ascending: false })

      if (error) throw new Error('Failed to fetch journal entries: ' + error.message)
      if (data) setEntries(data)
      
    } catch (err) {
      console.error('Journal fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load journal entries. Please refresh the page.')
    } finally {
      setFetching(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchEntries()
  }, [currentFarm])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchEntries()
  }

  function handleAddTag() {
    const trimmed = tagInput.trim()
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed])
    }
    setTagInput('')
  }

  function handleRemoveTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag))
  }

  async function handleAdd() {
    if (!content) return
    if (!currentFarm) {
      setError('Please select a farm first')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('You must be logged in to add journal entries')
        setLoading(false)
        return
      }
      
      const { data, error } = await supabase
        .from('journal_entries')
        .insert([{
          title: title || null,
          content,
          entry_type: entryType,
          field_name: fieldName || null,
          crop_name: cropName || null,
          weather_conditions: weatherConditions || null,
          mood: mood || null,
          tags,
          entry_date: entryDate,
          user_id: user.id,
          farm_id: currentFarm.id
        }])
        .select()
        .single()

      if (error) throw new Error('Failed to save entry: ' + error.message)

      if (data) {
        setEntries((prev) => [data, ...prev])
        setTitle('')
        setContent('')
        setEntryType('General')
        setFieldName('')
        setCropName('')
        setWeatherConditions('')
        setMood(null)
        setTags([])
        setTagInput('')
        setEntryDate(new Date().toISOString().split('T')[0])
        setOpen(false)
      }
      
    } catch (err) {
      console.error('Journal save error:', err)
      setError(err instanceof Error ? err.message : 'Failed to save entry. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this journal entry?')) return
    if (!currentFarm) return
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('You must be logged in to delete entries')
        return
      }

      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
        .eq('farm_id', currentFarm.id)

      if (error) throw new Error('Failed to delete entry: ' + error.message)

      setEntries(prev => prev.filter(e => e.id !== id))
      
    } catch (err) {
      console.error('Delete error:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete entry')
    }
  }

  const filtered = entries.filter((e) => {
    const q = search.toLowerCase()
    return (
      e.content.toLowerCase().includes(q) ||
      e.title.toLowerCase().includes(q) ||
      e.field_name.toLowerCase().includes(q) ||
      e.crop_name.toLowerCase().includes(q) ||
      e.tags.some((t) => t.toLowerCase().includes(q))
    )
  })

  const grouped = groupByDate(
    [...filtered].sort(
      (a, b) =>
        new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime()
    )
  )

  const sortedDates = Object.keys(grouped).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  )

  if (farmLoading || (fetching && !isRefreshing)) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#2D6A4F] border-t-transparent mx-auto mb-3"></div>
          <p className="text-sm text-gray-400">{farmLoading ? 'Loading farms...' : 'Loading journal entries...'}</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-xl font-semibold text-[#1B4332] mb-2">Please Log In</h2>
        <p className="text-sm text-gray-500">You need to be logged in to manage your journal.</p>
        <Link href="/login">
          <Button className="mt-4 bg-[#2D6A4F] hover:bg-[#1B4332] text-white">
            Go to Login
          </Button>
        </Link>
      </div>
    )
  }

  if (!currentFarm) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-5xl mb-4">🏠</div>
        <h2 className="text-xl font-semibold text-[#1B4332] mb-2">No Farm Selected</h2>
        <p className="text-sm text-gray-500">Please select a farm to manage your journal.</p>
        <Link href="/settings">
          <Button className="mt-4 bg-[#2D6A4F] hover:bg-[#1B4332] text-white">
            Go to Settings
          </Button>
        </Link>
      </div>
    )
  }

  if (error && !fetching) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1B4332]">Farm Journal</h1>
            <p className="text-gray-500 text-sm mt-1">Record your farm observations and activities</p>
          </div>
        </div>
        <Card className="shadow-sm border-red-200 bg-red-50">
          <CardContent className="py-4 px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-red-500 text-lg">⚠️</span>
              </div>
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <Button 
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleRefresh}
            >
              <RefreshCw size={14} className="mr-2" /> Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#1B4332]">Farm Journal</h1>
            <Badge className="bg-[#D8F3DC] text-[#2D6A4F] text-xs font-medium">
              📖 {currentFarm.name}
            </Badge>
          </div>
          <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
            <span>{greeting || 'Record your farm observations'}</span>
            <span className="text-base">{getSeasonalGreeting(user?.user_metadata?.full_name?.split(' ')[0] || 'Farmer').emoji}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="border-[#2D6A4F] text-[#2D6A4F] hover:bg-[#D8F3DC]"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw size={14} className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <Button
              className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white"
              onClick={() => setOpen(true)}
            >
              <Plus size={16} className="mr-2" /> New Entry
            </Button>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>New Journal Entry</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={entryDate}
                      onChange={(e) =>
                        setEntryDate((e.target as HTMLInputElement).value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Entry Type</Label>
                    <Select
                      value={entryType}
                      onValueChange={(val) =>
                        setEntryType((val ?? 'General') as EntryType)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(ENTRY_TYPE_COLOURS) as EntryType[]).map(
                          (type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>
                    Title <span className="text-gray-400">(optional)</span>
                  </Label>
                  <Input
                    placeholder="e.g. First signs of early blight on tomatoes"
                    value={title}
                    onChange={(e) =>
                      setTitle((e.target as HTMLInputElement).value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <textarea
                    className="w-full min-h-[120px] rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] resize-none"
                    placeholder="What happened on the farm today? What did you observe, apply, or decide?"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>
                      Field / Block{' '}
                      <span className="text-gray-400">(optional)</span>
                    </Label>
                    <Input
                      placeholder="e.g. Field A"
                      value={fieldName}
                      onChange={(e) =>
                        setFieldName((e.target as HTMLInputElement).value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Crop <span className="text-gray-400">(optional)</span>
                    </Label>
                    <Input
                      placeholder="e.g. Tomatoes"
                      value={cropName}
                      onChange={(e) =>
                        setCropName((e.target as HTMLInputElement).value)
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>
                    Weather <span className="text-gray-400">(optional)</span>
                  </Label>
                  <Select
                    value={weatherConditions}
                    onValueChange={(val) => setWeatherConditions(val ?? '')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="How was the weather?" />
                    </SelectTrigger>
                    <SelectContent>
                      {WEATHER_OPTIONS.map((w) => (
                        <SelectItem key={w} value={w}>
                          {w}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>How was your day? <span className="text-gray-400">(optional)</span></Label>
                  <div className="flex gap-2 flex-wrap">
                    {MOOD_OPTIONS.map(({ emoji, label, value }) => (
                      <button
                        key={value}
                        onClick={() => setMood(mood === value ? null : value)}
                        className={cn(
                          "text-2xl p-2 rounded-lg border-2 transition-all",
                          mood === value 
                            ? "border-[#2D6A4F] bg-[#D8F3DC] scale-110" 
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        )}
                        title={label}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>
                    Tags <span className="text-gray-400">(optional)</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a tag and press Enter"
                      value={tagInput}
                      onChange={(e) =>
                        setTagInput((e.target as HTMLInputElement).value)
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddTag()
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddTag}
                    >
                      Add
                    </Button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 bg-[#D8F3DC] text-[#1B4332] text-xs px-2 py-1 rounded-full cursor-pointer hover:bg-red-100 hover:text-red-600 transition-colors"
                          onClick={() => handleRemoveTag(tag)}
                        >
                          {tag} ×
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  className="w-full bg-[#2D6A4F] hover:bg-[#1B4332] text-white"
                  onClick={handleAdd}
                  disabled={!content || loading}
                >
                  {loading ? 'Saving...' : 'Save Entry'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && (
        <Card className="shadow-sm border-red-200 bg-red-50">
          <CardContent className="py-3 px-4 flex items-center justify-between">
            <p className="text-sm text-red-700">❌ {error}</p>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setError(null)}
              className="text-red-700 hover:bg-red-100"
            >
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      {entries.length > 0 && (
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <Input
            className="pl-9 border-gray-200 focus:border-[#2D6A4F] focus:ring-[#2D6A4F]"
            placeholder="Search journal entries..."
            value={search}
            onChange={(e) => setSearch((e.target as HTMLInputElement).value)}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          )}
        </div>
      )}

      {entries.length === 0 ? (
        <Card className="shadow-sm border-0 bg-gradient-to-br from-[#D8F3DC]/20 to-white">
          <CardContent className="flex flex-col items-center justify-center py-16 text-gray-400">
            <div className="w-16 h-16 rounded-full bg-[#D8F3DC] flex items-center justify-center mb-4">
              <BookOpen size={32} className="text-[#2D6A4F] opacity-30" />
            </div>
            <p className="text-sm font-medium text-gray-600">No journal entries yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Click "New Entry" to write your first farm journal entry
            </p>
            <Button 
              variant="outline" 
              className="mt-4 border-[#2D6A4F] text-[#2D6A4F] hover:bg-[#D8F3DC]"
              onClick={() => setOpen(true)}
            >
              <Plus size={14} className="mr-2" /> Write Your First Entry
            </Button>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Search size={32} className="mb-3 opacity-30" />
            <p className="text-sm">No entries match your search</p>
            <p className="text-xs mt-1">Try adjusting your search terms</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((date) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px flex-1 bg-gray-100" />
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  {formatDate(date)}
                </span>
                <div className="h-px flex-1 bg-gray-100" />
              </div>

              <div className="space-y-3">
                {grouped[date].map((entry) => (
                  <Card
                    key={entry.id}
                    className="shadow-sm hover:shadow-md transition-all duration-200 border-l-4 hover:border-l-[#2D6A4F]"
                    style={{
                      borderLeftColor: entry.entry_type === 'General' ? '#9CA3AF' :
                                       entry.entry_type === 'Spraying' ? '#3B82F6' :
                                       entry.entry_type === 'Fertilising' ? '#22C55E' :
                                       entry.entry_type === 'Irrigation' ? '#06B6D4' :
                                       entry.entry_type === 'Harvesting' ? '#8B5CF6' :
                                       entry.entry_type === 'Planting' ? '#84CC16' :
                                       entry.entry_type === 'Scouting' ? '#F97316' :
                                       entry.entry_type === 'Maintenance' ? '#EAB308' :
                                       entry.entry_type === 'Weather' ? '#0EA5E9' : '#6B7280'
                    }}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            className={`text-xs font-medium ${ENTRY_TYPE_COLOURS[entry.entry_type]}`}
                          >
                            {entry.entry_type}
                          </Badge>
                          {entry.weather_conditions && (
                            <span className="text-xs text-gray-400">
                              {entry.weather_conditions}
                            </span>
                          )}
                          {entry.tags.length > 0 && (
                            <span className="text-xs text-gray-400">
                              · {entry.tags.length} tag{entry.tags.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0 opacity-0 hover:opacity-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      {entry.title && (
                        <CardTitle className="text-sm font-semibold text-gray-800 mt-1">
                          {entry.title}
                        </CardTitle>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {entry.content}
                      </p>

                      {(entry.field_name || entry.crop_name) && (
                        <div className="flex items-center gap-3 pt-1">
                          {entry.field_name && (
                            <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded">
                              <MapPin size={11} /> {entry.field_name}
                            </span>
                          )}
                          {entry.crop_name && (
                            <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded">
                              <Leaf size={11} /> {entry.crop_name}
                            </span>
                          )}
                        </div>
                      )}

                      {entry.tags.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          <Tag size={11} className="text-gray-300" />
                          {entry.tags.map((tag) => (
                            <span
                              key={tag}
                              className="bg-[#D8F3DC] text-[#1B4332] text-xs px-2 py-0.5 rounded-full"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}