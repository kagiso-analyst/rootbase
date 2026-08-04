// app/(dashboard)/livestock/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { Plus, PawPrint, Trash2, Heart, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { createClient } from '@/lib/supabase/client'
import { useFarm } from '@/lib/farm-context'
import Link from 'next/link'

type LivestockStatus = 'active' | 'sold' | 'deceased' | 'culled'

type Animal = {
  id: string
  tag_number: string | null
  species: string
  breed: string | null
  sex: string | null
  date_of_birth: string | null
  purchase_date: string | null
  purchase_price: number
  current_weight_kg: number
  status: LivestockStatus
  notes: string | null
  user_id: string
  farm_id: string | null
}

type HealthEvent = {
  id: string
  animal_id: string
  animal_tag: string | null
  event_type: string
  description: string
  product: string | null
  date: string
  user_id: string
  farm_id: string | null
}

const SPECIES = [
  'Cattle', 'Sheep', 'Goats', 'Pigs',
  'Chickens', 'Ducks', 'Turkeys', 'Rabbits',
  'Horses', 'Donkeys', 'Other',
]

const STATUS_COLOURS: Record<LivestockStatus, string> = {
  active:   'bg-green-100 text-green-700 border-green-200',
  sold:     'bg-blue-100 text-blue-700 border-blue-200',
  deceased: 'bg-red-100 text-red-700 border-red-200',
  culled:   'bg-gray-100 text-gray-600 border-gray-200',
}

const HEALTH_EVENT_TYPES = [
  'Vaccination',
  'Deworming',
  'Treatment',
  'Vet Visit',
  'Weight Check',
  'Dipping',
  'Other',
]

export default function LivestockPage() {
  // ===== STATE =====
  const [animals, setAnimals] = useState<Animal[]>([])
  const [healthEvents, setHealthEvents] = useState<HealthEvent[]>([])
  const [animalOpen, setAnimalOpen] = useState(false)
  const [healthOpen, setHealthOpen] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Get current farm
  const { currentFarm, loading: farmLoading } = useFarm()

  // Animal form
  const [tagNumber, setTagNumber] = useState('')
  const [species, setSpecies] = useState('')
  const [breed, setBreed] = useState('')
  const [sex, setSex] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [purchaseDate, setPurchaseDate] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [currentWeightKg, setCurrentWeightKg] = useState('')
  const [status, setStatus] = useState<LivestockStatus>('active')
  const [notes, setNotes] = useState('')

  // Health form
  const [selectedAnimalId, setSelectedAnimalId] = useState('')
  const [eventType, setEventType] = useState('')
  const [eventDescription, setEventDescription] = useState('')
  const [eventProduct, setEventProduct] = useState('')
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0])

  const supabase = createClient()

  const activeAnimals = animals.filter((a) => a.status === 'active')

  // ===== FETCH ANIMALS =====
  async function fetchAnimals() {
    if (!currentFarm) {
      setAnimals([])
      setFetching(false)
      return
    }

    setFetching(true)
    setError(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setUser(null)
        setAnimals([])
        setFetching(false)
        return
      }
      
      setUser(user)

      const { data, error } = await supabase
        .from('livestock')
        .select('*')
        .eq('user_id', user.id)
        .eq('farm_id', currentFarm.id)
        .order('created_at', { ascending: false })

      if (error) throw new Error('Failed to fetch animals: ' + error.message)
      if (data) setAnimals(data)
      
    } catch (err) {
      console.error('Animals fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load animals. Please refresh the page.')
    } finally {
      setFetching(false)
      setIsRefreshing(false)
    }
  }

  // ===== FETCH HEALTH EVENTS =====
  async function fetchHealthEvents() {
    if (!currentFarm) return
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('health_events')
        .select('*')
        .eq('user_id', user.id)
        .eq('farm_id', currentFarm.id)
        .order('date', { ascending: false })

      if (error) throw new Error('Failed to fetch health events: ' + error.message)
      if (data) setHealthEvents(data)
      
    } catch (err) {
      console.error('Health events fetch error:', err)
    }
  }

  // ===== REFRESH HANDLER =====
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchAnimals()
    await fetchHealthEvents()
  }

  useEffect(() => {
    fetchAnimals()
    fetchHealthEvents()
  }, [currentFarm])

  // ===== ADD ANIMAL =====
  async function handleAddAnimal() {
    if (!species) return
    if (!currentFarm) {
      setError('Please select a farm first')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('You must be logged in to add animals')
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('livestock')
        .insert([{
          tag_number: tagNumber || null,
          species,
          breed: breed || null,
          sex: sex || null,
          date_of_birth: dateOfBirth || null,
          purchase_date: purchaseDate || null,
          purchase_price: parseFloat(purchasePrice) || 0,
          current_weight_kg: parseFloat(currentWeightKg) || 0,
          status,
          notes: notes || null,
          user_id: user.id,
          farm_id: currentFarm.id
        }])
        .select()
        .single()

      if (error) throw new Error('Failed to save animal: ' + error.message)

      if (data) {
        setAnimals((prev) => [data, ...prev])
        setTagNumber('')
        setSpecies('')
        setBreed('')
        setSex('')
        setDateOfBirth('')
        setPurchaseDate('')
        setPurchasePrice('')
        setCurrentWeightKg('')
        setStatus('active')
        setNotes('')
        setAnimalOpen(false)
      }
      
    } catch (err) {
      console.error('Animal save error:', err)
      setError(err instanceof Error ? err.message : 'Failed to save animal. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ===== ADD HEALTH EVENT =====
  async function handleAddHealthEvent() {
    if (!selectedAnimalId || !eventType || !eventDescription) return
    if (!currentFarm) return
    
    setLoading(true)
    setError(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('You must be logged in to log health events')
        setLoading(false)
        return
      }

      const animal = animals.find((a) => a.id === selectedAnimalId)

      const { data, error } = await supabase
        .from('health_events')
        .insert([{
          animal_id: selectedAnimalId,
          animal_tag: animal?.tag_number || animal?.species || 'Unknown',
          event_type: eventType,
          description: eventDescription,
          product: eventProduct || null,
          date: eventDate,
          user_id: user.id,
          farm_id: currentFarm.id
        }])
        .select()
        .single()

      if (error) throw new Error('Failed to save health event: ' + error.message)

      if (data) {
        setHealthEvents((prev) => [data, ...prev])
        setSelectedAnimalId('')
        setEventType('')
        setEventDescription('')
        setEventProduct('')
        setEventDate(new Date().toISOString().split('T')[0])
        setHealthOpen(false)
      }
      
    } catch (err) {
      console.error('Health event save error:', err)
      setError(err instanceof Error ? err.message : 'Failed to save health event. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ===== DELETE ANIMAL =====
  async function handleDeleteAnimal(id: string) {
    if (!confirm('Are you sure you want to delete this animal? This will also delete all associated health events.')) return
    if (!currentFarm) return
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('You must be logged in to delete animals')
        return
      }

      const { error } = await supabase
        .from('livestock')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
        .eq('farm_id', currentFarm.id)

      if (error) throw new Error('Failed to delete animal: ' + error.message)

      setAnimals((prev) => prev.filter((a) => a.id !== id))
      setHealthEvents((prev) => prev.filter((e) => e.animal_id !== id))
      
    } catch (err) {
      console.error('Delete animal error:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete animal')
    }
  }

  // ===== DELETE HEALTH EVENT =====
  async function handleDeleteHealthEvent(id: string) {
    if (!confirm('Are you sure you want to delete this health event?')) return
    if (!currentFarm) return
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('You must be logged in to delete health events')
        return
      }

      const { error } = await supabase
        .from('health_events')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
        .eq('farm_id', currentFarm.id)

      if (error) throw new Error('Failed to delete health event: ' + error.message)

      setHealthEvents((prev) => prev.filter((e) => e.id !== id))
      
    } catch (err) {
      console.error('Delete health event error:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete health event')
    }
  }

  const speciesGroups = animals.reduce((groups, animal) => {
    if (!groups[animal.species]) groups[animal.species] = 0
    if (animal.status === 'active') groups[animal.species]++
    return groups
  }, {} as Record<string, number>)

  // ===== LOADING STATE =====
  if (farmLoading || (fetching && !isRefreshing)) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#2D6A4F] border-t-transparent mx-auto mb-3"></div>
          <p className="text-sm text-gray-400">{farmLoading ? 'Loading farms...' : 'Loading livestock...'}</p>
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
        <p className="text-sm text-gray-500">You need to be logged in to manage your livestock.</p>
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
        <p className="text-sm text-gray-500">Please select a farm to manage your livestock.</p>
        <Link href="/settings">
          <Button className="mt-4 bg-[#2D6A4F] hover:bg-[#1B4332] text-white">
            Go to Settings
          </Button>
        </Link>
      </div>
    )
  }

  // ===== ERROR STATE =====
  if (error && !fetching) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1B4332]">Livestock</h1>
            <p className="text-gray-500 text-sm mt-1">Manage your farm animals and health records</p>
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

  // ===== ACTUAL PAGE =====
  return (
    <div className="space-y-6 px-4 sm:px-0">
      {/* Header with refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#1B4332]">Livestock</h1>
            <Badge className="bg-[#D8F3DC] text-[#2D6A4F] text-xs font-medium">
              🐄 {currentFarm.name}
            </Badge>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            {activeAnimals.length} active animal{activeAnimals.length !== 1 ? 's' : ''}
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
          <div className="flex gap-2">
            <Dialog open={healthOpen} onOpenChange={setHealthOpen}>
              <Button
                variant="outline"
                className="border-[#2D6A4F] text-[#2D6A4F] hover:bg-[#D8F3DC]"
                onClick={() => setHealthOpen(true)}
              >
                <Heart size={16} className="mr-2" /> Log Health Event
              </Button>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Log Health Event</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>Animal</Label>
                    <Select value={selectedAnimalId} onValueChange={(val) => setSelectedAnimalId(val || '')}>
                      <SelectTrigger><SelectValue placeholder="Select animal..." /></SelectTrigger>
                      <SelectContent>
                        {animals.filter(a => a.status === 'active').map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.tag_number ? `${a.tag_number} — ` : ''}{a.species} {a.breed}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Event Type</Label>
                    <Select value={eventType} onValueChange={(val) => setEventType(val || '')}>
                      <SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger>
                      <SelectContent>
                        {HEALTH_EVENT_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      placeholder="e.g. Annual FMD vaccination"
                      value={eventDescription}
                      onChange={(e) => setEventDescription(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Product Used <span className="text-gray-400">(optional)</span></Label>
                    <Input
                      placeholder="e.g. Multivax P"
                      value={eventProduct}
                      onChange={(e) => setEventProduct(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                    />
                  </div>
                  <Button
                    className="w-full bg-[#2D6A4F] hover:bg-[#1B4332] text-white"
                    onClick={handleAddHealthEvent}
                    disabled={!selectedAnimalId || !eventType || !eventDescription || loading}
                  >
                    {loading ? 'Saving...' : 'Save Health Event'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={animalOpen} onOpenChange={setAnimalOpen}>
              <Button
                className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white"
                onClick={() => setAnimalOpen(true)}
              >
                <Plus size={16} className="mr-2" /> Add Animal
              </Button>
              <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Animal</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Species</Label>
                      <Select value={species} onValueChange={(val) => setSpecies(val || '')}>
                        <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                        <SelectContent>
                          {SPECIES.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Tag / ID Number</Label>
                      <Input
                        placeholder="e.g. SA001"
                        value={tagNumber}
                        onChange={(e) => setTagNumber(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Breed <span className="text-gray-400">(optional)</span></Label>
                      <Input
                        placeholder="e.g. Bonsmara"
                        value={breed}
                        onChange={(e) => setBreed(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Sex</Label>
                      <Select value={sex} onValueChange={(val) => setSex(val || '')}>
                        <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Castrated">Castrated</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Date of Birth <span className="text-gray-400">(optional)</span></Label>
                      <Input
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Weight (kg) <span className="text-gray-400">(optional)</span></Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={currentWeightKg}
                        onChange={(e) => setCurrentWeightKg(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Purchase Date <span className="text-gray-400">(optional)</span></Label>
                      <Input
                        type="date"
                        value={purchaseDate}
                        onChange={(e) => setPurchaseDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Purchase Price (ZAR)</Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={purchasePrice}
                        onChange={(e) => setPurchasePrice(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={status} onValueChange={(val) => setStatus((val || 'active') as LivestockStatus)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="sold">Sold</SelectItem>
                          <SelectItem value="deceased">Deceased</SelectItem>
                          <SelectItem value="culled">Culled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Notes <span className="text-gray-400">(optional)</span></Label>
                      <Input
                        placeholder="Any notes..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>
                  </div>

                  <Button
                    className="w-full bg-[#2D6A4F] hover:bg-[#1B4332] text-white"
                    onClick={handleAddAnimal}
                    disabled={!species || loading}
                  >
                    {loading ? 'Saving...' : 'Save Animal'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Error message */}
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

      {/* Herd summary */}
      {Object.keys(speciesGroups).length > 0 && (
        <div className="flex gap-3 flex-wrap">
          {Object.entries(speciesGroups).map(([sp, count]) => (
            <Card key={sp} className="shadow-sm border-0 bg-gradient-to-br from-[#D8F3DC] to-white">
              <CardContent className="px-4 py-3 text-center">
                <p className="text-2xl font-bold text-[#2D6A4F]">{count}</p>
                <p className="text-xs text-gray-400 font-medium">{sp}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Tabs defaultValue="animals">
        <TabsList className="bg-[#D8F3DC] p-1 rounded-lg">
          <TabsTrigger 
            value="animals" 
            className="data-[state=active]:bg-[#2D6A4F] data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-all"
          >
            Animals ({animals.length})
          </TabsTrigger>
          <TabsTrigger 
            value="health" 
            className="data-[state=active]:bg-[#2D6A4F] data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-all"
          >
            Health Events ({healthEvents.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="animals" className="mt-4">
          {animals.length === 0 ? (
            <Card className="shadow-sm border-0 bg-gradient-to-br from-[#D8F3DC]/20 to-white">
              <CardContent className="flex flex-col items-center justify-center py-16 text-gray-400">
                <div className="w-16 h-16 rounded-full bg-[#D8F3DC] flex items-center justify-center mb-4">
                  <PawPrint size={32} className="text-[#2D6A4F] opacity-30" />
                </div>
                <p className="text-sm font-medium text-gray-600">No animals recorded yet</p>
                <p className="text-xs text-gray-400 mt-1">Click "Add Animal" to record your first animal</p>
                <Button 
                  variant="outline" 
                  className="mt-4 border-[#2D6A4F] text-[#2D6A4F] hover:bg-[#D8F3DC]"
                  onClick={() => setAnimalOpen(true)}
                >
                  <Plus size={14} className="mr-2" /> Add Your First Animal
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-sm border-0">
              <CardContent className="p-0">
                <div className="divide-y divide-gray-100">
                  {animals.map((animal) => (
                    <div key={animal.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                          ${animal.status === 'active' ? 'bg-[#D8F3DC]' : 
                            animal.status === 'sold' ? 'bg-blue-50' :
                            animal.status === 'deceased' ? 'bg-red-50' : 'bg-gray-100'}`}>
                          <PawPrint size={18} className={
                            animal.status === 'active' ? 'text-[#2D6A4F]' :
                            animal.status === 'sold' ? 'text-blue-500' :
                            animal.status === 'deceased' ? 'text-red-500' : 'text-gray-500'
                          } />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {animal.tag_number ? `${animal.tag_number} — ` : ''}{animal.species}
                            {animal.breed ? ` (${animal.breed})` : ''}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <Badge className={`text-xs font-medium ${STATUS_COLOURS[animal.status]}`}>
                              {animal.status}
                            </Badge>
                            {animal.sex && <span className="text-xs text-gray-400">• {animal.sex}</span>}
                            {animal.current_weight_kg > 0 && (
                              <span className="text-xs text-gray-400">• {animal.current_weight_kg}kg</span>
                            )}
                            {animal.date_of_birth && (
                              <span className="text-xs text-gray-400">• Born {animal.date_of_birth}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {animal.purchase_price > 0 && (
                          <span className="text-sm font-medium text-gray-500">R{animal.purchase_price.toFixed(0)}</span>
                        )}
                        <button
                          onClick={() => handleDeleteAnimal(animal.id)}
                          className="text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="health" className="mt-4">
          {healthEvents.length === 0 ? (
            <Card className="shadow-sm border-0 bg-gradient-to-br from-[#D8F3DC]/20 to-white">
              <CardContent className="flex flex-col items-center justify-center py-16 text-gray-400">
                <div className="w-16 h-16 rounded-full bg-[#D8F3DC] flex items-center justify-center mb-4">
                  <Heart size={32} className="text-[#2D6A4F] opacity-30" />
                </div>
                <p className="text-sm font-medium text-gray-600">No health events recorded yet</p>
                <p className="text-xs text-gray-400 mt-1">Log vaccinations, treatments, and vet visits</p>
                <Button 
                  variant="outline" 
                  className="mt-4 border-[#2D6A4F] text-[#2D6A4F] hover:bg-[#D8F3DC]"
                  onClick={() => setHealthOpen(true)}
                >
                  <Heart size={14} className="mr-2" /> Log Your First Health Event
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-sm border-0">
              <CardContent className="p-0">
                <div className="divide-y divide-gray-100">
                  {healthEvents.map((event) => (
                    <div key={event.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors group">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                          <Heart size={18} className="text-red-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{event.description}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <Badge className="text-xs bg-gray-100 text-gray-600 font-medium">{event.event_type}</Badge>
                            <span className="text-xs text-gray-400">• {event.animal_tag}</span>
                            {event.product && <span className="text-xs text-gray-400">• {event.product}</span>}
                            <span className="text-xs text-gray-400">• {event.date}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteHealthEvent(event.id)}
                        className="text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}