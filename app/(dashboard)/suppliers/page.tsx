'use client'

import { useState, useEffect } from 'react'
import { Plus, Building2, Trash2, Phone, Mail, MapPin } from 'lucide-react'
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

type Supplier = {
  id: string
  name: string
  category: string
  contactPerson: string
  phone: string
  email: string
  address: string
  notes: string
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
  Seeds:       'bg-lime-100 text-lime-700',
  Fertiliser:  'bg-green-100 text-green-700',
  Chemicals:   'bg-blue-100 text-blue-700',
  Feed:        'bg-yellow-100 text-yellow-700',
  Equipment:   'bg-orange-100 text-orange-700',
  Fuel:        'bg-red-100 text-red-700',
  Packaging:   'bg-purple-100 text-purple-700',
  Veterinary:  'bg-pink-100 text-pink-700',
  Transport:   'bg-cyan-100 text-cyan-700',
  General:     'bg-gray-100 text-gray-600',
  Other:       'bg-gray-100 text-gray-500',
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [open, setOpen] = useState(false)
  const [filterCategory, setFilterCategory] = useState('All')
  const [loading, setLoading] = useState(false);


  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
  fetchSuppliers();
}, []);

  const filtered =
    filterCategory === 'All'
      ? suppliers
      : suppliers.filter((s) => s.category === filterCategory)

  async function fetchSuppliers() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  const suppliers = (data || []).map((supplier) => ({
    id: supplier.id,
    name: supplier.name,
    category: supplier.category,
    contactPerson: supplier.contact_person,
    phone: supplier.phone,
    email: supplier.email,
    address: supplier.address,
    notes: supplier.notes,
  }));

  setSuppliers(suppliers);
}

  async function handleAdd() {
  if (!name || !category) return
  setLoading(true)
  console.log('Saving supplier...')
  const supabase = createClient()
  const { data, error } = await supabase
    .from('suppliers')
    .insert([{ name, category, contact_person: contactPerson, phone, email, address, notes }])
    .select()
    .single()
  console.log('Supplier data:', data)
  console.log('Supplier error:', error)
  if (!error && data) {
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
  setLoading(false)
}

  async function handleDelete(id: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from("suppliers")
    .delete()
    .eq("id", id);

  if (!error) {
    fetchSuppliers();
  }
}

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B4332]">Suppliers</h1>
          <p className="text-gray-500 text-sm mt-1">
            {suppliers.length} supplier{suppliers.length !== 1 ? 's' : ''} saved
          </p>
        </div>

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
                <Label>Supplier Name</Label>
                <Input
                  placeholder="e.g. Agri Mega Seeds"
                  value={name}
                  onChange={(e) => setName((e.target as HTMLInputElement).value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={(val) => setCategory(val ?? '')}>
                  <SelectTrigger><SelectValue placeholder="Select category..." /></SelectTrigger>
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
                  onChange={(e) => setContactPerson((e.target as HTMLInputElement).value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Phone <span className="text-gray-400">(optional)</span></Label>
                  <Input
                    placeholder="e.g. 011 123 4567"
                    value={phone}
                    onChange={(e) => setPhone((e.target as HTMLInputElement).value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email <span className="text-gray-400">(optional)</span></Label>
                  <Input
                    type="email"
                    placeholder="e.g. info@supplier.co.za"
                    value={email}
                    onChange={(e) => setEmail((e.target as HTMLInputElement).value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Address <span className="text-gray-400">(optional)</span></Label>
                <Input
                  placeholder="e.g. 12 Main St, Pretoria"
                  value={address}
                  onChange={(e) => setAddress((e.target as HTMLInputElement).value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Notes <span className="text-gray-400">(optional)</span></Label>
                <Input
                  placeholder="Payment terms, delivery info, etc."
                  value={notes}
                  onChange={(e) => setNotes((e.target as HTMLInputElement).value)}
                />
              </div>

              <Button
                className="w-full bg-[#2D6A4F] hover:bg-[#1B4332] text-white"
                onClick={handleAdd}
                disabled={!name || !category}
              >
                Save Supplier
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Category filter */}
      {suppliers.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {['All', ...CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                filterCategory === cat
                  ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-[#2D6A4F]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Suppliers list */}
      {suppliers.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Building2 size={40} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">No suppliers saved yet</p>
            <p className="text-xs mt-1">Click "Add Supplier" to save your first supplier</p>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12 text-gray-400">
            <p className="text-sm">No suppliers in this category</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((supplier) => (
            <Card key={supplier.id} className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#D8F3DC] flex items-center justify-center flex-shrink-0">
                      <Building2 size={16} className="text-[#2D6A4F]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{supplier.name}</p>
                      {supplier.contactPerson && (
                        <p className="text-xs text-gray-400">{supplier.contactPerson}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(supplier.id)}
                    className="text-gray-300 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <Badge className={`text-xs mb-3 ${CATEGORY_COLOURS[supplier.category] || 'bg-gray-100 text-gray-600'}`}>
                  {supplier.category}
                </Badge>

                <div className="space-y-1.5">
                  {supplier.phone && (
                    <p className="flex items-center gap-2 text-xs text-gray-500">
                      <Phone size={12} /> {supplier.phone}
                    </p>
                  )}
                  {supplier.email && (
                    <p className="flex items-center gap-2 text-xs text-gray-500">
                      <Mail size={12} /> {supplier.email}
                    </p>
                  )}
                  {supplier.address && (
                    <p className="flex items-center gap-2 text-xs text-gray-500">
                      <MapPin size={12} /> {supplier.address}
                    </p>
                  )}
                  {supplier.notes && (
                    <p className="text-xs text-gray-400 italic mt-2">{supplier.notes}</p>
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

