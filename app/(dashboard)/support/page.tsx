// app/(dashboard)/support/page.tsx

'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Card, CardContent, CardHeader, CardTitle 
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import {
  MessageCircle,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Send,
  ChevronDown,
  ChevronUp,
  LifeBuoy,
  Zap,
  ArrowLeft,
  ChevronRight
} from 'lucide-react'

type Ticket = {
  id: string
  subject: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  category: string
  is_priority: boolean
  created_at: string
  updated_at: string
}

type Message = {
  id: string
  ticket_id: string
  user_id: string
  message: string
  created_at: string
}

const PRIORITY_LABELS = {
  low: { label: 'Low', color: 'bg-gray-100 text-gray-600' },
  medium: { label: 'Medium', color: 'bg-blue-100 text-blue-700' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-700' },
  urgent: { label: 'Urgent', color: 'bg-red-100 text-red-700' },
}

const STATUS_LABELS = {
  open: { label: 'Open', color: 'bg-green-100 text-green-700' },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
  resolved: { label: 'Resolved', color: 'bg-purple-100 text-purple-700' },
  closed: { label: 'Closed', color: 'bg-gray-100 text-gray-600' },
}

const CATEGORIES = [
  'Billing',
  'Technical Issue',
  'Feature Request',
  'Account Help',
  'Farm Data',
  'Payment',
  'Other'
]

export default function SupportPage() {
  const [user, setUser] = useState<any>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [newMessage, setNewMessage] = useState('')

  // Form state
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium')
  const [category, setCategory] = useState('')

  const supabase = createClient()
  const { currentFarm, loading: farmLoading } = useFarm()
  const isPro = user?.plan === 'pro' || user?.plan === 'business'

  // ===== CHECK AUTH =====
  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
      } catch (err) {
        console.error('Auth check error:', err)
        setError('Failed to authenticate.')
      } finally {
        setAuthChecked(true)
      }
    }
    checkAuth()
  }, [supabase])

  // ===== FETCH TICKETS =====
  const fetchTickets = useCallback(async () => {
    if (!currentFarm || !user) {
      setTickets([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .eq('farm_id', currentFarm.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTickets(data || [])
    } catch (err) {
      console.error('Fetch tickets error:', err)
      setError('Failed to load support tickets')
    } finally {
      setLoading(false)
    }
  }, [currentFarm, user, supabase])

  // ===== FETCH MESSAGES =====
  const fetchMessages = useCallback(async (ticketId: string) => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (err) {
      console.error('Fetch messages error:', err)
      setError('Failed to load messages')
    }
  }, [user, supabase])

  useEffect(() => {
    if (authChecked && user) {
      fetchTickets()
    }
  }, [authChecked, user, fetchTickets])

  // ===== CREATE TICKET =====
  async function createTicket() {
    if (!subject || !description || !category) {
      setError('Please fill in all required fields')
      return
    }
    if (!currentFarm || !user) return

    setSubmitting(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .insert([{
          user_id: user.id,
          farm_id: currentFarm.id,
          subject,
          description,
          priority,
          category,
          status: 'open',
          is_priority: isPro || priority === 'urgent',
        }])
        .select()
        .single()

      if (error) throw error

      setTickets(prev => [data, ...prev])
      setOpenDialog(false)
      resetForm()
    } catch (err) {
      console.error('Create ticket error:', err)
      setError('Failed to create support ticket')
    } finally {
      setSubmitting(false)
    }
  }

  // ===== SEND MESSAGE =====
  async function sendMessage() {
    if (!newMessage.trim() || !selectedTicket || !user) return

    setSubmitting(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('support_messages')
        .insert([{
          ticket_id: selectedTicket.id,
          user_id: user.id,
          message: newMessage.trim(),
        }])
        .select()
        .single()

      if (error) throw error

      setMessages(prev => [...prev, data])
      setNewMessage('')

      // Update ticket status if closed
      if (selectedTicket.status === 'closed') {
        const { error: updateError } = await supabase
          .from('support_tickets')
          .update({ status: 'open', updated_at: new Date().toISOString() })
          .eq('id', selectedTicket.id)

        if (!updateError) {
          setSelectedTicket(prev => prev ? { ...prev, status: 'open' } : null)
          fetchTickets()
        }
      }
    } catch (err) {
      console.error('Send message error:', err)
      setError('Failed to send message')
    } finally {
      setSubmitting(false)
    }
  }

  // ===== SELECT TICKET =====
  const selectTicket = async (ticket: Ticket) => {
    setSelectedTicket(ticket)
    await fetchMessages(ticket.id)
  }

  const resetForm = () => {
    setSubject('')
    setDescription('')
    setPriority('medium')
    setCategory('')
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-ZA', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!authChecked || farmLoading || (loading && !selectedTicket)) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#2D6A4F] border-t-transparent mx-auto mb-3"></div>
          <p className="text-sm text-gray-400">Loading support...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-xl font-semibold text-[#1B4332] mb-2">Please Log In</h2>
        <p className="text-sm text-gray-500">You need to be logged in to access support.</p>
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
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <div className="text-5xl mb-4">🏠</div>
        <h2 className="text-xl font-semibold text-[#1B4332] mb-2">No Farm Selected</h2>
        <p className="text-sm text-gray-500">Please select a farm to access support.</p>
        <Link href="/settings">
          <Button className="mt-4 bg-[#2D6A4F] hover:bg-[#1B4332] text-white">
            Go to Settings
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 px-4 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft size={18} />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-[#1B4332]">Support</h1>
                <Badge className="bg-[#D8F3DC] text-[#2D6A4F] text-xs font-medium">
                  {currentFarm.name}
                </Badge>
                {isPro && (
                  <Badge className="bg-purple-100 text-purple-700 text-xs font-medium animate-pulse">
                    <Zap size={12} className="mr-1" />
                    Priority Support
                  </Badge>
                )}
              </div>
              <p className="text-gray-500 text-sm mt-1">
                {isPro 
                  ? 'Priority support — responses within 4 hours'
                  : 'Standard support — responses within 24 hours'
                }
              </p>
            </div>
          </div>
        </div>
        <Button
          className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white"
          onClick={() => setOpenDialog(true)}
        >
          <Plus size={16} className="mr-2" /> New Ticket
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <Card className="shadow-sm border-red-200 bg-red-50">
          <CardContent className="py-3 px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-red-500" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
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

      {/* Create Ticket Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Support Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                placeholder="Brief summary of your issue"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={(val) => setCategory(val || '')}>
                <SelectTrigger>
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
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(val) => setPriority(val as any || 'medium')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Detailed description of your issue..."
                value={description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                rows={4}
              />
            </div>
            <Button
              className="w-full bg-[#2D6A4F] hover:bg-[#1B4332] text-white"
              onClick={createTicket}
              disabled={!subject || !description || !category || submitting}
            >
              {submitting ? 'Creating...' : 'Create Ticket'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tickets List */}
      {selectedTicket ? (
        // Ticket Detail View
        <Card className="shadow-sm border-0">
          <CardHeader className="pb-2 border-b border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedTicket(null)
                    setMessages([])
                  }}
                  className="text-gray-400 hover:text-gray-600 -ml-2"
                >
                  ← Back
                </Button>
                <div className="flex items-center gap-2 mt-1">
                  <h2 className="text-base font-semibold text-gray-800">{selectedTicket.subject}</h2>
                  <Badge className={`text-xs ${PRIORITY_LABELS[selectedTicket.priority].color}`}>
                    {PRIORITY_LABELS[selectedTicket.priority].label}
                  </Badge>
                  <Badge className={`text-xs ${STATUS_LABELS[selectedTicket.status].color}`}>
                    {STATUS_LABELS[selectedTicket.status].label}
                  </Badge>
                  {selectedTicket.is_priority && (
                    <Badge className="bg-purple-100 text-purple-700 text-xs">
                      Priority
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Category: {selectedTicket.category} · Created {formatDate(selectedTicket.created_at)}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Messages */}
            <div className="px-6 py-4 max-h-[400px] overflow-y-auto space-y-3">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                  <MessageCircle size={32} className="opacity-30 mb-2" />
                  <p className="text-sm font-medium text-gray-600">No messages yet</p>
                  <p className="text-xs text-gray-400">Be the first to reply</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-lg ${
                      msg.user_id === user.id
                        ? 'bg-[#D8F3DC]/30 border border-[#D8F3DC] ml-auto max-w-[80%]'
                        : 'bg-gray-50 border border-gray-100 mr-auto max-w-[80%]'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-700">
                        {msg.user_id === user.id ? 'You' : 'Support Team'}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {formatDate(msg.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{msg.message}</p>
                  </div>
                ))
              )}
            </div>

            {/* Reply input */}
            <div className="border-t border-gray-100 px-6 py-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Type your reply..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  className="flex-1"
                />
                <Button
                  className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white"
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || submitting}
                >
                  <Send size={16} className="mr-2" />
                  Send
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        // Ticket List
        <div className="space-y-4">
          {tickets.length === 0 ? (
            <Card className="shadow-sm border-0 bg-gradient-to-br from-[#D8F3DC]/20 to-white">
              <CardContent className="flex flex-col items-center justify-center py-16 text-gray-400">
                <LifeBuoy size={48} className="text-[#2D6A4F] opacity-30 mb-4" />
                <p className="text-sm font-medium text-gray-600">No support tickets yet</p>
                <p className="text-xs text-gray-400 mt-1">Create a ticket and we'll help you out</p>
                <Button
                  variant="outline"
                  className="mt-4 border-[#2D6A4F] text-[#2D6A4F] hover:bg-[#D8F3DC]"
                  onClick={() => setOpenDialog(true)}
                >
                  <Plus size={14} className="mr-2" /> Create Your First Ticket
                </Button>
              </CardContent>
            </Card>
          ) : (
            tickets.map((ticket) => (
              <Card
                key={ticket.id}
                className="shadow-sm border-0 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => selectTicket(ticket)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-medium text-gray-800 truncate">
                          {ticket.subject}
                        </h3>
                        <Badge className={`text-xs ${PRIORITY_LABELS[ticket.priority].color}`}>
                          {PRIORITY_LABELS[ticket.priority].label}
                        </Badge>
                        <Badge className={`text-xs ${STATUS_LABELS[ticket.status].color}`}>
                          {STATUS_LABELS[ticket.status].label}
                        </Badge>
                        {ticket.is_priority && (
                          <Badge className="bg-purple-100 text-purple-700 text-xs">
                            Priority
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Category: {ticket.category} · {formatDate(ticket.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {ticket.status === 'open' && (
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      )}
                      <ChevronRight size={16} className="text-gray-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}