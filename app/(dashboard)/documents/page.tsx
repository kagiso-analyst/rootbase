'use client'

import { useState } from 'react'
import { Plus, FolderOpen, Trash2, FileText, Download } from 'lucide-react'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Document = {
  id: string
  name: string
  category: string
  description: string
  fileUrl: string
  fileName: string
  uploadedAt: string
  expiryDate: string
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
  'Farm Registration': 'bg-green-100 text-green-700',
  'Land Title':        'bg-blue-100 text-blue-700',
  'Insurance':         'bg-purple-100 text-purple-700',
  'Compliance':        'bg-orange-100 text-orange-700',
  'Spray Records':     'bg-cyan-100 text-cyan-700',
  'Audit Reports':     'bg-yellow-100 text-yellow-700',
  'Contracts':         'bg-red-100 text-red-700',
  'Invoices':          'bg-gray-100 text-gray-600',
  'Permits':           'bg-lime-100 text-lime-700',
  'Certificates':      'bg-pink-100 text-pink-700',
  'Other':             'bg-gray-100 text-gray-500',
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [open, setOpen] = useState(false)
  const [filterCategory, setFilterCategory] = useState('All')

  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

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

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setSelectedFile(file)
  }

  function handleAdd() {
    if (!name || !category) return
    const newDoc: Document = {
      id: crypto.randomUUID(),
      name,
      category,
      description,
      fileUrl: selectedFile ? URL.createObjectURL(selectedFile) : '',
      fileName: selectedFile?.name || '',
      uploadedAt: new Date().toISOString().split('T')[0],
      expiryDate,
    }
    setDocuments((prev) => [newDoc, ...prev])
    setName('')
    setCategory('')
    setDescription('')
    setExpiryDate('')
    setSelectedFile(null)
    setOpen(false)
  }

  function handleDelete(id: string) {
    setDocuments((prev) => prev.filter((d) => d.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B4332]">Documents</h1>
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
          <DialogTrigger>
            <Button className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white">
              <Plus size={16} className="mr-2" /> Upload Document
            </Button>
          </DialogTrigger>
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
                disabled={!name || !category}
              >
                Save Document
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {expiringSoon.length > 0 && (
        <Card className="shadow-sm border-orange-200 bg-orange-50">
          <CardContent className="py-3 px-4">
            <p className="text-sm font-medium text-orange-700">
              Expiring within 30 days: {expiringSoon.map((d) => d.name).join(', ')}
            </p>
          </CardContent>
        </Card>
      )}

      {documents.length > 0 && (
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

      {documents.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-gray-400">
            <FolderOpen size={40} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">No documents uploaded yet</p>
            <p className="text-xs mt-1">
              Store farm registrations, insurance, spray records and more
            </p>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12 text-gray-400">
            <p className="text-sm">No documents in this category</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((doc) => {
            const isExpiring = expiringSoon.some((d) => d.id === doc.id)
            return (
              <Card
                key={doc.id}
                className={`shadow-sm hover:shadow-md transition-shadow ${
                  isExpiring ? 'border-orange-200' : ''
                }`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#D8F3DC] flex items-center justify-center flex-shrink-0">
                        <FileText size={16} className="text-[#2D6A4F]" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{doc.name}</p>
                        <p className="text-xs text-gray-400">Uploaded {doc.uploadedAt}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="text-gray-300 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <Badge
                    className={`text-xs mb-2 ${
                      CATEGORY_COLOURS[doc.category] || 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {doc.category}
                  </Badge>

                  {doc.description && (
                    <p className="text-xs text-gray-500 mt-2">{doc.description}</p>
                  )}

                  {doc.expiryDate && (
                    <p className={`text-xs mt-2 ${isExpiring ? 'text-orange-500 font-medium' : 'text-gray-400'}`}>
                      {isExpiring ? '⚠ ' : ''}Expires: {doc.expiryDate}
                    </p>
                  )}

                  {doc.fileUrl && (
                    <p className="inline-flex items-center gap-1.5 mt-3 text-xs text-[#2D6A4F]">
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