'use client'

import { useState } from 'react'
import { Plus, BookOpen, Trash2, Tag, MapPin, Leaf, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
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
  entryType: EntryType
  fieldName: string
  cropName: string
  weatherConditions: string
  tags: string[]
  entryDate: string
  createdAt: string
}

const ENTRY_TYPE_COLOURS: Record<EntryType, string> = {
  General:     'bg-gray-100 text-gray-600',
  Spraying:    'bg-blue-100 text-blue-700',
  Fertilising: 'bg-green-100 text-green-700',
  Irrigation:  'bg-cyan-100 text-cyan-700',
  Harvesting:  'bg-purple-100 text-purple-700',
  Planting:    'bg-lime-100 text-lime-700',
  Scouting:    'bg-orange-100 text-orange-700',
  Maintenance: 'bg-yellow-100 text-yellow-700',
  Weather:     'bg-sky-100 text-sky-700',
  Other:       'bg-gray-100 text-gray-500',
}

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
    const date = entry.entryDate
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

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [entryType, setEntryType] = useState<EntryType>('General')
  const [fieldName, setFieldName] = useState('')
  const [cropName, setCropName] = useState('')
  const [weatherConditions, setWeatherConditions] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [entryDate, setEntryDate] = useState(
    new Date().toISOString().split('T')[0]
  )

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
  setLoading(true)
  console.log('Saving journal entry...')
  const supabase = createClient()
  const { data, error } = await supabase
    .from('journal_entries')
    .insert([{
      title, content, entry_type: entryType, field_name: fieldName,
      crop_name: cropName, weather_conditions: weatherConditions,
      tags, entry_date: entryDate,
    }])
    .select()
    .single()
  console.log('Journal data:', data)
  console.log('Journal error:', error)
  if (!error && data) {
    setEntries((prev) => [data, ...prev])
    setTitle('')
setContent('')
setEntryType('General')
setFieldName('')
setCropName('')
setWeatherConditions('')
setTags([])
setTagInput('')
    setEntryDate(new Date().toISOString().split('T')[0])
    setOpen(false)
  }
  setLoading(false)
}

  function handleDelete(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  const filtered = entries.filter((e) => {
    const q = search.toLowerCase()
    return (
      e.content.toLowerCase().includes(q) ||
      e.title.toLowerCase().includes(q) ||
      e.fieldName.toLowerCase().includes(q) ||
      e.cropName.toLowerCase().includes(q) ||
      e.tags.some((t) => t.toLowerCase().includes(q))
    )
  })

  const grouped = groupByDate(
    [...filtered].sort(
      (a, b) =>
        new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime()
    )
  )

  const sortedDates = Object.keys(grouped).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B4332]">Farm Journal</h1>
          <p className="text-gray-500 text-sm mt-1">
            {entries.length} entr{entries.length !== 1 ? 'ies' : 'y'} recorded
          </p>
        </div>

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
                        {tag} x
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

      {entries.length > 0 && (
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <Input
            className="pl-9"
            placeholder="Search journal entries..."
            value={search}
            onChange={(e) => setSearch((e.target as HTMLInputElement).value)}
          />
        </div>
      )}

      {entries.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-gray-400">
            <BookOpen size={40} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">No journal entries yet</p>
            <p className="text-xs mt-1">
              Click "New Entry" to write your first farm journal entry
            </p>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Search size={32} className="mb-3 opacity-30" />
            <p className="text-sm">No entries match your search</p>
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
                    className="shadow-sm hover:shadow-md transition-shadow"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            className={`text-xs ${ENTRY_TYPE_COLOURS[entry.entryType]}`}
                          >
                            {entry.entryType}
                          </Badge>
                          {entry.weatherConditions && (
                            <span className="text-xs text-gray-400">
                              {entry.weatherConditions}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
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

                      {(entry.fieldName || entry.cropName) && (
                        <div className="flex items-center gap-3">
                          {entry.fieldName && (
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <MapPin size={11} /> {entry.fieldName}
                            </span>
                          )}
                          {entry.cropName && (
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <Leaf size={11} /> {entry.cropName}
                            </span>
                          )}
                        </div>
                      )}

                      {entry.tags.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Tag size={11} className="text-gray-300" />
                          {entry.tags.map((tag) => (
                            <span
                              key={tag}
                              className="bg-[#D8F3DC] text-[#1B4332] text-xs px-2 py-0.5 rounded-full"
                            >
                              {tag}
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