// app/(dashboard)/suppliers/page.tsx

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Building2, Trash2, Phone, Mail, MapPin, RefreshCw, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
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
import { useFarm } from '@/lib/farm-context'
import Link from 'next/link'

type Supplier = {
  id: string
  name: string
  category: string
  contact_person: string | null
  phone: string | null
  email: string | null
  address: string | null
  notes: string | null
  user_id: string
  farm_id: string | null
}

const CATEGORIES = [
  'Seeds',
  'Fertiliser',
  'Chemicals',
  'Feed',
  'Equipment',
  'Fuel',
  'Packaging',
  'Veterinary',
  'Transport',
  'General',
  'Other',
]

const CATEGORY_COLOURS: Record<string, string> = {
  Seeds:       'bg-lime-100 text-lime-700 border-lime-200',
  Fertiliser:  'bg-green-100 text-green-700 border-green-200',
  Chemicals:   'bg-blue-100 text-blue-700 border-blue-200',
  Feed:        'bg-yellow-100 text-yellow-700 border-yellow-200',
  Equipment:   'bg-orange-100 text-orange-700 border-orange-200',
  Fuel:        'bg-red-100 text-red-700 border-red-200',
  Packaging:   'bg-purple-100 text-purple-700 border-purple-200',
  Veterinary:  'bg-pink-100 text-pink-700 border-pink-200',
  Transport:   'bg-cyan-100 text-cyan-700 border-cyan-200',
  General:     'bg-gray-100 text-gray-600 border-gray-200',
  Other:       'bg-gray-100 text-gray-500 border-gray-200',
}

export default function SuppliersPage() {
  // ===== AUTH STATE =====
  const [user, setUser] = useState<any>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const supabase = createClient()

  // ===== FARM CONTEXT =====
  const { currentFarm, loading: farmLoading } = useFarm()

  // ===== DATA STATE =====
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [open, setOpen] = useState(false)
  const [filterCategory, setFilterCategory] = useState('All')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Form state
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')

  // ===== CHECK AUTH =====
  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
      } catch (err) {
        console.error('Auth check error:', err)
        setAuthError('Failed to authenticate. Please refresh the page.')
      } finally {
        setAuthChecked(true)
      }
    }
    checkAuth()
  }, [supabase])

  // ===== FETCH SUPPLIERS =====
  const fetchSuppliers = useCallback(async () => {
    if (!currentFarm || !user) {
      setSuppliers([])
      setFetching(false)
      return
    }

    setFetching(true)
    setError(null)
    
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('user_id', user.id)
        .eq('farm_id', currentFarm.id)
        .order('created_at', { ascending: false })

      if (error) throw new Error('Failed to fetch suppliers: ' + error.message)
      if (data) setSuppliers(data)
      
    } catch (err) {
      console.error('Suppliers error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load suppliers. Please refresh the page.')
    } finally {
      setFetching(false)
      setIsRefreshing(false)
    }
  }, [currentFarm, user, supabase])

  useEffect(() => {
    if (authChecked && user) {
      fetchSuppliers()
    }
  }, [authChecked, user, fetchSuppliers])

  // ===== REFRESH HANDLER =====
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchSuppliers()
  }

  // ===== FILTER AND SEARCH =====
  const filtered = suppliers.filter((s) => {
    const matchesCategory = filterCategory === 'All' ? true : s.category === filterCategory
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (s.contact_person && s.contact_person.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  // ===== ADD SUPPLIER =====
  async function handleAdd() {
    if (!name || !category) return
    if (!currentFarm || !user) {
      setError('Please select a farm first')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .insert([{ 
          name, 
          category, 
          contact_person: contactPerson || null, 
          phone: phone || null, 
          email: email || null, 
          address: address || null, 
          notes: notes || null,
          user_id: user.id,
          farm_id: currentFarm.id
        }])
        .select()
        .single()

      if (error) throw new Error('Failed to save supplier: ' + error.message)

      if (data) {
        setSuppliers((prev) => [data, ...prev])
        setName('') 
        setCategory('') 
        setContactPerson('') 
        setPhone('')
        setEmail('') 
        setAddress('') 
        setNotes('')
        setOpen(false)
      }
      
    } catch (err) {
      console.error('Supplier save error:', err)
      setError(err instanceof Error ? err.message : 'Failed to save supplier. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ===== DELETE SUPPLIER =====
  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this supplier?')) return
    if (!currentFarm || !user) return
    
    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
        .eq('farm_id', currentFarm.id)

      if (error) throw new Error('Failed to delete supplier: ' + error.message)

      setSuppliers(prev => prev.filter(s => s.id !== id))
      
    } catch (err) {
      console.error('Delete error:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete supplier')
    }
  }

  // ===== LOADING STATE =====
  if (!authChecked || farmLoading || (fetching && !isRefreshing)) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#2D6A4F] border-t-transparent mx-auto mb-3"></div>
          <p className="text-sm text-gray-400">
            {!authChecked ? 'Checking authentication...' : 
             farmLoading ? 'Loading farms...' : 'Loading suppliers...'}
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
        <p className="text-sm text-gray-500">You need to be logged in to manage your suppliers.</p>
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
        <p className="text-sm text-gray-500">Please select or create a farm to manage your suppliers.</p>
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
            <h1 className="text-2xl font-bold text-[#1B4332]">Suppliers</h1>
            <p className="text-gray-500 text-sm mt-1">Manage your farm suppliers</p>
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
              onClick={() => {
                setError(null)
                fetchSuppliers()
              }}
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
      {/* Error message inline */}
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

      {/* Header with refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#1B4332]">Suppliers</h1>
            <Badge className="bg-[#D8F3DC] text-[#2D6A4F] text-xs font-medium">
              🏢 {currentFarm.name}
            </Badge>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            {suppliers.length} supplier{suppliers.length !== 1 ? 's' : ''} saved
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
              <Plus size={16} className="mr-2" /> Add Supplier
            </Button>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Supplier</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Supplier Name <span className="text-red-500">*</span></Label>
                  <Input
                    placeholder="e.g. Agri Mega Seeds"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="border-gray-200 focus:border-[#2D6A4F] focus:ring-[#2D6A4F]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Category <span className="text-red-500">*</span></Label>
                  <Select value={category} onValueChange={(val) => setCategory(val || '')}>
                    <SelectTrigger className="border-gray-200">
                      <SelectValue placeholder="Select category..." />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Contact Person <span className="text-gray-400">(optional)</span></Label>
                  <Input
                    placeholder="e.g. John Smith"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="border-gray-200 focus:border-[#2D6A4F] focus:ring-[#2D6A4F]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Phone <span className="text-gray-400">(optional)</span></Label>
                    <Input
                      placeholder="e.g. 011 123 4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="border-gray-200 focus:border-[#2D6A4F] focus:ring-[#2D6A4F]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email <span className="text-gray-400">(optional)</span></Label>
                    <Input
                      type="email"
                      placeholder="e.g. info@supplier.co.za"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="border-gray-200 focus:border-[#2D6A4F] focus:ring-[#2D6A4F]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Address <span className="text-gray-400">(optional)</span></Label>
                  <Input
                    placeholder="e.g. 12 Main St, Pretoria"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="border-gray-200 focus:border-[#2D6A4F] focus:ring-[#2D6A4F]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notes <span className="text-gray-400">(optional)</span></Label>
                  <Input
                    placeholder="Payment terms, delivery info, etc."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="border-gray-200 focus:border-[#2D6A4F] focus:ring-[#2D6A4F]"
                  />
                </div>

                <Button
                  className="w-full bg-[#2D6A4F] hover:bg-[#1B4332] text-white"
                  onClick={handleAdd}
                  disabled={!name || !category || loading}
                >
                  {loading ? 'Saving...' : 'Save Supplier'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filter */}
      {suppliers.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              className="pl-8 border-gray-200 focus:border-[#2D6A4F] focus:ring-[#2D6A4F]"
              placeholder="Search suppliers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['All', ...CATEGORIES].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-200 ${
                  filterCategory === cat
                    ? 'bg-[#2D6A4F] text-white border-[#2D6A4F] shadow-sm'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-[#2D6A4F] hover:text-[#2D6A4F]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Suppliers list */}
      {suppliers.length === 0 ? (
        <Card className="shadow-sm border-0 bg-gradient-to-br from-[#D8F3DC]/20 to-white">
          <CardContent className="flex flex-col items-center justify-center py-16 text-gray-400">
            <div className="w-16 h-16 rounded-full bg-[#D8F3DC] flex items-center justify-center mb-4">
              <Building2 size={32} className="text-[#2D6A4F] opacity-30" />
            </div>
            <p className="text-sm font-medium text-gray-600">No suppliers saved yet</p>
            <p className="text-xs text-gray-400 mt-1">Click "Add Supplier" to save your first supplier</p>
            <Button 
              variant="outline" 
              className="mt-4 border-[#2D6A4F] text-[#2D6A4F] hover:bg-[#D8F3DC]"
              onClick={() => setOpen(true)}
            >
              <Plus size={14} className="mr-2" /> Add Your First Supplier
            </Button>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Search size={32} className="mb-3 opacity-30" />
            <p className="text-sm">No suppliers match your filters</p>
            <p className="text-xs mt-1">Try adjusting your search or filter</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((supplier) => (
            <Card key={supplier.id} className="shadow-sm hover:shadow-md transition-all duration-200 border-l-4 hover:border-l-[#2D6A4F]">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#D8F3DC] flex items-center justify-center flex-shrink-0">
                      <Building2 size={18} className="text-[#2D6A4F]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{supplier.name}</p>
                      {supplier.contact_person && (
                        <p className="text-xs text-gray-400">{supplier.contact_person}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(supplier.id)}
                    className="text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <Badge className={`text-xs font-medium mb-3 ${CATEGORY_COLOURS[supplier.category] || 'bg-gray-100 text-gray-600'}`}>
                  {supplier.category}
                </Badge>

                <div className="space-y-1.5">
                  {supplier.phone && (
                    <p className="flex items-center gap-2 text-xs text-gray-500">
                      <Phone size={12} className="text-gray-400" /> {supplier.phone}
                    </p>
                  )}
                  {supplier.email && (
                    <p className="flex items-center gap-2 text-xs text-gray-500">
                      <Mail size={12} className="text-gray-400" /> {supplier.email}
                    </p>
                  )}
                  {supplier.address && (
                    <p className="flex items-center gap-2 text-xs text-gray-500">
                      <MapPin size={12} className="text-gray-400" /> {supplier.address}
                    </p>
                  )}
                  {supplier.notes && (
                    <p className="text-xs text-gray-400 italic mt-2 border-t border-gray-100 pt-2">
                      {supplier.notes}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}