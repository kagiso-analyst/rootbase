'use client'

import { useState } from 'react'
import { Plus, PawPrint, Trash2, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type LivestockStatus = 'active' | 'sold' | 'deceased' | 'culled'

type Animal = {
  id: string
  tagNumber: string
  species: string
  breed: string
  sex: string
  dateOfBirth: string
  purchaseDate: string
  purchasePrice: number
  currentWeightKg: number
  status: LivestockStatus
  notes: string
}

type HealthEvent = {
  id: string
  animalId: string
  animalTag: string
  eventType: string
  description: string
  product: string
  date: string
}

const SPECIES = [
  'Cattle', 'Sheep', 'Goats', 'Pigs',
  'Chickens', 'Ducks', 'Turkeys', 'Rabbits',
  'Horses', 'Donkeys', 'Other',
]

const STATUS_COLOURS: Record<LivestockStatus, string> = {
  active:   'bg-green-100 text-green-700',
  sold:     'bg-blue-100 text-blue-700',
  deceased: 'bg-red-100 text-red-700',
  culled:   'bg-gray-100 text-gray-600',
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
  const [animals, setAnimals] = useState<Animal[]>([])
  const [healthEvents, setHealthEvents] = useState<HealthEvent[]>([])
  const [animalOpen, setAnimalOpen] = useState(false)
  const [healthOpen, setHealthOpen] = useState(false)

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

  const activeAnimals = animals.filter((a) => a.status === 'active')

  function handleAddAnimal() {
    if (!species) return
    const newAnimal: Animal = {
      id: crypto.randomUUID(),
      tagNumber,
      species,
      breed,
      sex,
      dateOfBirth,
      purchaseDate,
      purchasePrice: parseFloat(purchasePrice) || 0,
      currentWeightKg: parseFloat(currentWeightKg) || 0,
      status,
      notes,
    }
    setAnimals((prev) => [newAnimal, ...prev])
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

  function handleAddHealthEvent() {
    if (!selectedAnimalId || !eventType || !eventDescription) return
    const animal = animals.find((a) => a.id === selectedAnimalId)
    const newEvent: HealthEvent = {
      id: crypto.randomUUID(),
      animalId: selectedAnimalId,
      animalTag: animal?.tagNumber || animal?.species || 'Unknown',
      eventType,
      description: eventDescription,
      product: eventProduct,
      date: eventDate,
    }
    setHealthEvents((prev) => [newEvent, ...prev])
    setSelectedAnimalId('')
    setEventType('')
    setEventDescription('')
    setEventProduct('')
    setEventDate(new Date().toISOString().split('T')[0])
    setHealthOpen(false)
  }

  function handleDeleteAnimal(id: string) {
    setAnimals((prev) => prev.filter((a) => a.id !== id))
  }

  const speciesGroups = animals.reduce((groups, animal) => {
    if (!groups[animal.species]) groups[animal.species] = 0
    if (animal.status === 'active') groups[animal.species]++
    return groups
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B4332]">Livestock</h1>
          <p className="text-gray-500 text-sm mt-1">
            {activeAnimals.length} active animal{activeAnimals.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={healthOpen} onOpenChange={setHealthOpen}>
            <DialogTrigger>
              <Button variant="outline" className="border-[#2D6A4F] text-[#2D6A4F]">
                <Heart size={16} className="mr-2" /> Log Health Event
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Log Health Event</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Animal</Label>
                  <Select value={selectedAnimalId} onValueChange={(val) => setSelectedAnimalId(val ?? '')}>
                    <SelectTrigger><SelectValue placeholder="Select animal..." /></SelectTrigger>
                    <SelectContent>
                      {animals.filter(a => a.status === 'active').map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.tagNumber ? `${a.tagNumber} — ` : ''}{a.species} {a.breed}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Event Type</Label>
                  <Select value={eventType} onValueChange={(val) => setEventType(val ?? '')}>
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
                    onChange={(e) => setEventDescription((e.target as HTMLInputElement).value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Product Used <span className="text-gray-400">(optional)</span></Label>
                  <Input
                    placeholder="e.g. Multivax P"
                    value={eventProduct}
                    onChange={(e) => setEventProduct((e.target as HTMLInputElement).value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate((e.target as HTMLInputElement).value)}
                  />
                </div>
                <Button
                  className="w-full bg-[#2D6A4F] hover:bg-[#1B4332] text-white"
                  onClick={handleAddHealthEvent}
                  disabled={!selectedAnimalId || !eventType || !eventDescription}
                >
                  Save Health Event
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={animalOpen} onOpenChange={setAnimalOpen}>
            <DialogTrigger>
              <Button className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white">
                <Plus size={16} className="mr-2" /> Add Animal
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Animal</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Species</Label>
                    <Select value={species} onValueChange={(val) => setSpecies(val ?? '')}>
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
                      onChange={(e) => setTagNumber((e.target as HTMLInputElement).value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Breed <span className="text-gray-400">(optional)</span></Label>
                    <Input
                      placeholder="e.g. Bonsmara"
                      value={breed}
                      onChange={(e) => setBreed((e.target as HTMLInputElement).value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Sex</Label>
                    <Select value={sex} onValueChange={(val) => setSex(val ?? '')}>
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
                      onChange={(e) => setDateOfBirth((e.target as HTMLInputElement).value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Weight (kg) <span className="text-gray-400">(optional)</span></Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={currentWeightKg}
                      onChange={(e) => setCurrentWeightKg((e.target as HTMLInputElement).value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Purchase Date <span className="text-gray-400">(optional)</span></Label>
                    <Input
                      type="date"
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate((e.target as HTMLInputElement).value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Purchase Price (ZAR)</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={purchasePrice}
                      onChange={(e) => setPurchasePrice((e.target as HTMLInputElement).value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={status} onValueChange={(val) => setStatus((val ?? 'active') as LivestockStatus)}>
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
                      onChange={(e) => setNotes((e.target as HTMLInputElement).value)}
                    />
                  </div>
                </div>

                <Button
                  className="w-full bg-[#2D6A4F] hover:bg-[#1B4332] text-white"
                  onClick={handleAddAnimal}
                  disabled={!species}
                >
                  Save Animal
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Herd summary */}
      {Object.keys(speciesGroups).length > 0 && (
        <div className="flex gap-3 flex-wrap">
          {Object.entries(speciesGroups).map(([sp, count]) => (
            <Card key={sp} className="shadow-sm">
              <CardContent className="px-4 py-3 text-center">
                <p className="text-xl font-bold text-[#2D6A4F]">{count}</p>
                <p className="text-xs text-gray-400">{sp}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Tabs defaultValue="animals">
        <TabsList className="bg-[#D8F3DC]">
          <TabsTrigger value="animals" className="data-[state=active]:bg-[#2D6A4F] data-[state=active]:text-white">
            Animals ({animals.length})
          </TabsTrigger>
          <TabsTrigger value="health" className="data-[state=active]:bg-[#2D6A4F] data-[state=active]:text-white">
            Health Events ({healthEvents.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="animals" className="mt-4">
          {animals.length === 0 ? (
            <Card className="shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-16 text-gray-400">
                <PawPrint size={40} className="mb-3 opacity-30" />
                <p className="text-sm font-medium">No animals recorded yet</p>
                <p className="text-xs mt-1">Click "Add Animal" to record your first animal</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-sm">
              <CardContent className="p-0">
                <div className="divide-y divide-gray-100">
                  {animals.map((animal) => (
                    <div key={animal.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        <div className="w-9 h-9 rounded-lg bg-[#D8F3DC] flex items-center justify-center">
                          <PawPrint size={16} className="text-[#2D6A4F]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {animal.tagNumber ? `${animal.tagNumber} — ` : ''}{animal.species}
                            {animal.breed ? ` (${animal.breed})` : ''}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge className={`text-xs ${STATUS_COLOURS[animal.status]}`}>
                              {animal.status}
                            </Badge>
                            {animal.sex && <span className="text-xs text-gray-400">{animal.sex}</span>}
                            {animal.currentWeightKg > 0 && (
                              <span className="text-xs text-gray-400">{animal.currentWeightKg}kg</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {animal.purchasePrice > 0 && (
                          <span className="text-sm text-gray-500">R{animal.purchasePrice.toFixed(0)}</span>
                        )}
                        <button
                          onClick={() => handleDeleteAnimal(animal.id)}
                          className="text-gray-300 hover:text-red-400 transition-colors"
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
            <Card className="shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Heart size={40} className="mb-3 opacity-30" />
                <p className="text-sm font-medium">No health events recorded yet</p>
                <p className="text-xs mt-1">Log vaccinations, treatments, and vet visits</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-sm">
              <CardContent className="p-0">
                <div className="divide-y divide-gray-100">
                  {healthEvents.map((event) => (
                    <div key={event.id} className="flex items-start gap-4 px-6 py-4">
                      <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                        <Heart size={14} className="text-red-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{event.description}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge className="text-xs bg-gray-100 text-gray-600">{event.eventType}</Badge>
                          <span className="text-xs text-gray-400">{event.animalTag}</span>
                          {event.product && <span className="text-xs text-gray-400">· {event.product}</span>}
                          <span className="text-xs text-gray-400">· {event.date}</span>
                        </div>
                      </div>
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