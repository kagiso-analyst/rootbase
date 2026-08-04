// app/(dashboard)/documents/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { Plus, FolderOpen, Trash2, FileText, Download, Sparkles, Clock } from 'lucide-react' // 👈 ADD Sparkles, Clock
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
import { createClient } from '@/lib/supabase/client'
import { useFarm } from '@/lib/farm-context' // 👈 ADD THIS
import { cn } from '@/lib/utils' // 👈 ADD THIS
import Link from 'next/link'

type Document = {
  id: string
  name: string
  category: string
  description: string
  fileUrl: string
  fileName: string
  uploadedAt: string
  expiryDate: string
  user_id: string
  farm_id: string // 👈 ADD THIS
}

const CATEGORIES = [
  'Farm Registration',
  'Land Title',
  'Insurance',
  'Compliance',
  'Spray Records',
  'Audit Reports',
  'Contracts',
  'Invoices',
  'Permits',
  'Certificates',
  'Other',
]

const CATEGORY_COLOURS: Record<string, string> = {
  'Farm Registration': 'bg-green-100 text-green-700 border-green-200',
  'Land Title':        'bg-blue-100 text-blue-700 border-blue-200',
  'Insurance':         'bg-purple-100 text-purple-700 border-purple-200',
  'Compliance':        'bg-orange-100 text-orange-700 border-orange-200',
  'Spray Records':     'bg-cyan-100 text-cyan-700 border-cyan-200',
  'Audit Reports':     'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Contracts':         'bg-red-100 text-red-700 border-red-200',
  'Invoices':          'bg-gray-100 text-gray-600 border-gray-200',
  'Permits':           'bg-lime-100 text-lime-700 border-lime-200',
  'Certificates':      'bg-pink-100 text-pink-700 border-pink-200',
  'Other':             'bg-gray-100 text-gray-500 border-gray-200',
}

export default function DocumentsPage() {
  // ===== STATE =====
  const [documents, setDocuments] = useState<Document[]>([])
  const [open, setOpen] = useState(false)
  const [filterCategory, setFilterCategory] = useState('All')
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  // 👇 GET CURRENT FARM
  const { currentFarm, loading: farmLoading } = useFarm()

  // Form state
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const supabase = createClient()

  const filtered =
    filterCategory === 'All'
      ? documents
      : documents.filter((d) => d.category === filterCategory)

  const expiringSoon = documents.filter((d) => {
    if (!d.expiryDate) return false
    const days = Math.ceil(
      (new Date(d.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
    return days <= 30 && days >= 0
  })

  // ===== FETCH DOCUMENTS =====
  async function fetchDocuments() {
    // 👇 CHECK IF FARM IS SELECTED
    if (!currentFarm) {
      setDocuments([])
      setFetching(false)
      return
    }

    setFetching(true)
    setError(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setUser(null)
        setDocuments([])
        setFetching(false)
        return
      }
      
      setUser(user)

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .eq('farm_id', currentFarm.id) // 👈 FILTER BY FARM
        .order('created_at', { ascending: false })

      if (error) throw new Error('Failed to fetch documents: ' + error.message)
      if (data) setDocuments(data)
      
    } catch (err) {
      console.error('Documents error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load documents. Please refresh the page.')
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [currentFarm]) // 👈 REFETCH WHEN FARM CHANGES

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setSelectedFile(file)
  }

  // ===== ADD DOCUMENT =====
  async function handleAdd() {
    if (!name || !category) return
    if (!currentFarm) {
      setError('Please select a farm first')
      return
    }
    
    setSaving(true)
    setError(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('You must be logged in to add documents')
        setSaving(false)
        return
      }

      const docData = {
        name,
        category,
        description: description || null,
        expiry_date: expiryDate || null,
        file_name: selectedFile?.name || null,
        file_url: selectedFile ? URL.createObjectURL(selectedFile) : null,
        uploaded_at: new Date().toISOString().split('T')[0],
        user_id: user.id,
        farm_id: currentFarm.id, // 👈 ADD farm_id
      }

      const { data, error } = await supabase
        .from('documents')
        .insert([docData])
        .select()
        .single()

      if (error) throw new Error('Failed to save document: ' + error.message)

      const newDoc: Document = {
        id: data.id,
        name: data.name,
        category: data.category,
        description: data.description || '',
        fileUrl: data.file_url || '',
        fileName: data.file_name || '',
        uploadedAt: data.uploaded_at || new Date().toISOString().split('T')[0],
        expiryDate: data.expiry_date || '',
        user_id: data.user_id,
        farm_id: data.farm_id,
      }

      setDocuments((prev) => [newDoc, ...prev])
      setName('')
      setCategory('')
      setDescription('')
      setExpiryDate('')
      setSelectedFile(null)
      setOpen(false)
      
    } catch (err) {
      console.error('Add document error:', err)
      setError(err instanceof Error ? err.message : 'Failed to save document. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // ===== DELETE DOCUMENT =====
  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this document?')) return
    if (!currentFarm) return
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('You must be logged in to delete documents')
        return
      }

      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
        .eq('farm_id', currentFarm.id) // 👈 FILTER BY FARM

      if (error) throw new Error('Failed to delete document: ' + error.message)

      setDocuments(prev => prev.filter(d => d.id !== id))
      
    } catch (err) {
      console.error('Delete error:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete document')
    }
  }

  // ===== LOADING STATE =====
  if (farmLoading || fetching) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#2D6A4F] border-t-transparent mx-auto mb-3"></div>
          <p className="text-sm text-gray-400">{farmLoading ? 'Loading farms...' : 'Loading documents...'}</p>
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
        <p className="text-sm text-gray-500">You need to be logged in to manage your documents.</p>
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
        <p className="text-sm text-gray-500">Please select a farm to manage your documents.</p>
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
    <div className="space-y-6">
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

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#1B4332]">Documents</h1>
            <Badge className="bg-[#D8F3DC] text-[#2D6A4F] text-xs font-medium">
              📁 {currentFarm.name}
            </Badge>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            {documents.length} document{documents.length !== 1 ? 's' : ''}
            {expiringSoon.length > 0 && (
              <span className="text-orange-500 ml-2">
                · {expiringSoon.length} expiring soon
              </span>
            )}
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <Button
            className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white"
            onClick={() => setOpen(true)}
          >
            <Plus size={16} className="mr-2" /> Upload Document
          </Button>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Document Name</Label>
                <Input
                  placeholder="e.g. Farm Insurance Policy 2026"
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
                <Label>Description <span className="text-gray-400">(optional)</span></Label>
                <Input
                  placeholder="Brief description of this document"
                  value={description}
                  onChange={(e) => setDescription((e.target as HTMLInputElement).value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Expiry Date <span className="text-gray-400">(optional)</span></Label>
                <Input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate((e.target as HTMLInputElement).value)}
                />
              </div>

              <div className="space-y-2">
                <Label>File <span className="text-gray-400">(optional for now)</span></Label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#D8F3DC] file:text-[#1B4332] file:font-medium hover:file:bg-[#52B788] file:cursor-pointer"
                />
              </div>

              <Button
                className="w-full bg-[#2D6A4F] hover:bg-[#1B4332] text-white"
                onClick={handleAdd}
                disabled={!name || !category || saving}
              >
                {saving ? 'Saving...' : 'Save Document'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Expiring soon alert */}
      {expiringSoon.length > 0 && (
        <Card className="shadow-sm border-orange-200 bg-gradient-to-br from-orange-50 to-white">
          <CardContent className="py-3 px-4 flex items-center gap-2">
            <Clock size={16} className="text-orange-500" />
            <p className="text-sm font-medium text-orange-700">
              Expiring within 30 days: {expiringSoon.map((d) => d.name).join(', ')}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Category filters */}
      {documents.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {['All', ...CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-full border transition-all duration-200",
                filterCategory === cat
                  ? "bg-[#2D6A4F] text-white border-[#2D6A4F] shadow-sm"
                  : "bg-white text-gray-500 border-gray-200 hover:border-[#2D6A4F] hover:text-[#2D6A4F]"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Documents list */}
      {documents.length === 0 ? (
        <Card className="shadow-sm border-0 bg-gradient-to-br from-[#D8F3DC]/20 to-white">
          <CardContent className="flex flex-col items-center justify-center py-16 text-gray-400">
            <div className="w-16 h-16 rounded-full bg-[#D8F3DC] flex items-center justify-center mb-4">
              <FolderOpen size={32} className="text-[#2D6A4F] opacity-30" />
            </div>
            <p className="text-sm font-medium text-gray-600">No documents uploaded yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Store farm registrations, insurance, spray records and more
            </p>
            <Button 
              variant="outline" 
              className="mt-4 border-[#2D6A4F] text-[#2D6A4F] hover:bg-[#D8F3DC]"
              onClick={() => setOpen(true)}
            >
              <Plus size={14} className="mr-2" /> Upload Your First Document
            </Button>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12 text-gray-400">
            <FolderOpen size={32} className="mb-3 opacity-30" />
            <p className="text-sm">No documents in this category</p>
            <p className="text-xs mt-1">Try selecting a different category</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((doc) => {
            const isExpiring = expiringSoon.some((d) => d.id === doc.id)
            return (
              <Card
                key={doc.id}
                className={cn(
                  "shadow-sm hover:shadow-md transition-all duration-200 border-l-4",
                  isExpiring ? 'border-l-orange-400' : 'border-l-[#2D6A4F]',
                  "hover:border-l-[#1B4332]"
                )}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                        isExpiring ? 'bg-orange-50' : 'bg-[#D8F3DC]'
                      )}>
                        <FileText size={16} className={isExpiring ? 'text-orange-500' : 'text-[#2D6A4F]'} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{doc.name}</p>
                        <p className="text-xs text-gray-400">Uploaded {doc.uploadedAt}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <Badge
                    className={cn(
                      "text-xs font-medium mb-2",
                      CATEGORY_COLOURS[doc.category] || 'bg-gray-100 text-gray-600'
                    )}
                  >
                    {doc.category}
                  </Badge>

                  {doc.description && (
                    <p className="text-xs text-gray-500 mt-2">{doc.description}</p>
                  )}

                  {doc.expiryDate && (
                    <p className={cn(
                      "text-xs mt-2 flex items-center gap-1",
                      isExpiring ? 'text-orange-500 font-medium' : 'text-gray-400'
                    )}>
                      {isExpiring ? <Clock size={12} /> : '📅'}
                      {isExpiring ? '⚠ ' : ''}Expires: {doc.expiryDate}
                      {isExpiring && (
                        <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full">
                          Soon!
                        </span>
                      )}
                    </p>
                  )}

                  {doc.fileUrl && (
                    <p className="inline-flex items-center gap-1.5 mt-3 text-xs text-[#2D6A4F] hover:underline cursor-pointer">
                      <Download size={12} /> {doc.fileName}
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}