// app/(dashboard)/support/admin/page.tsx

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { useFarm } from '@/lib/farm-context'
import Link from 'next/link'
import {
  MessageCircle,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  ArrowLeft,
  Send,
  User,
  Calendar,
  Filter,
  ChevronDown,
  ChevronUp,
  ChevronRight
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Ticket = {
  id: string
  user_id: string
  farm_id: string
  subject: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  category: string
  is_priority: boolean
  created_at: string
  updated_at: string
  profiles?: {
    full_name: string
    email: string
  }
  farms?: {
    name: string
  }
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

export default function AdminSupportPage() {
  const [user, setUser] = useState<any>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const supabase = createClient()

  // ===== CHECK AUTH =====
  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setAuthChecked(true)
    }
    checkAuth()
  }, [supabase])

  // ===== FETCH TICKETS =====
  const fetchTickets = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('support_tickets')
        .select(`
          *,
          profiles!user_id(full_name, email),
          farms!farm_id(name)
        `)
        .order('created_at', { ascending: false })

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus)
      }
      if (filterPriority !== 'all') {
        query = query.eq('priority', filterPriority)
      }

      const { data, error } = await query

      if (error) throw error
      setTickets(data || [])
    } catch (err) {
      console.error('Fetch tickets error:', err)
      setError('Failed to load tickets')
    } finally {
      setLoading(false)
    }
  }, [filterStatus, filterPriority, supabase])

  useEffect(() => {
    if (authChecked) {
      fetchTickets()
    }
  }, [authChecked, fetchTickets])

  // ===== FETCH MESSAGES =====
  const fetchMessages = useCallback(async (ticketId: string) => {
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
    }
  }, [supabase])

  // ===== SELECT TICKET =====
  const selectTicket = async (ticket: Ticket) => {
    setSelectedTicket(ticket)
    await fetchMessages(ticket.id)
  }

  // ===== UPDATE TICKET STATUS =====
  const updateStatus = async (ticketId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', ticketId)

      if (error) throw error

      setSelectedTicket(prev => prev ? { ...prev, status: status as any } : null)
      fetchTickets()
    } catch (err) {
      console.error('Update status error:', err)
    }
  }

  // ===== SEND REPLY =====
  const sendReply = async () => {
    if (!newMessage.trim() || !selectedTicket) return

    setSubmitting(true)

    try {
      const { data, error } = await supabase
        .from('support_messages')
        .insert([{
          ticket_id: selectedTicket.id,
          user_id: user.id,
          message: newMessage.trim(),
          is_internal: false,
        }])
        .select()
        .single()

      if (error) throw error

      setMessages(prev => [...prev, data])
      setNewMessage('')

      // Update ticket status to in_progress if it was open
      if (selectedTicket.status === 'open') {
        await updateStatus(selectedTicket.id, 'in_progress')
      }
    } catch (err) {
      console.error('Send reply error:', err)
    } finally {
      setSubmitting(false)
    }
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

  const getPriorityCount = (priority: string) => {
    return tickets.filter(t => t.priority === priority).length
  }

  if (!authChecked || loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#2D6A4F] border-t-transparent mx-auto mb-3"></div>
          <p className="text-sm text-gray-400">Loading support dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 px-4 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/support">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft size={18} />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-[#1B4332]">Support Admin</h1>
              <p className="text-gray-500 text-sm mt-1">Manage support tickets across all farms</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="border-[#2D6A4F] text-[#2D6A4F] hover:bg-[#D8F3DC]"
            onClick={fetchTickets}
          >
            <RefreshCw size={14} className="mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: tickets.length, color: 'text-gray-600 bg-gray-50' },
          { label: 'Urgent', value: getPriorityCount('urgent'), color: 'text-red-600 bg-red-50' },
          { label: 'High', value: getPriorityCount('high'), color: 'text-orange-600 bg-orange-50' },
          { label: 'Open', value: tickets.filter(t => t.status === 'open').length, color: 'text-green-600 bg-green-50' },
        ].map(({ label, value, color }) => (
          <Card key={label} className="shadow-sm border-0">
            <CardContent className={`py-3 px-4 text-center rounded-lg ${color}`}>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs font-medium opacity-70">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Select value={filterStatus} onValueChange={(val) => setFilterStatus(val || 'all')}>
          <SelectTrigger className="w-36">
            <Filter size={14} className="mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterPriority} onValueChange={(val) => setFilterPriority(val || 'all')}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

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
                  ← Back to tickets
                </Button>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <h2 className="text-base font-semibold text-gray-800">{selectedTicket.subject}</h2>
                  <Badge className={`text-xs ${PRIORITY_LABELS[selectedTicket.priority].color}`}>
                    {PRIORITY_LABELS[selectedTicket.priority].label}
                  </Badge>
                  <Badge className={`text-xs ${STATUS_LABELS[selectedTicket.status].color}`}>
                    {STATUS_LABELS[selectedTicket.status].label}
                  </Badge>
                  {selectedTicket.is_priority && (
                    <Badge className="bg-purple-100 text-purple-700 text-xs">Priority</Badge>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Category: {selectedTicket.category} · Created {formatDate(selectedTicket.created_at)}
                </p>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <User size={12} className="text-gray-400" />
                  <span>{selectedTicket.profiles?.full_name || 'Unknown'}</span>
                  <span>·</span>
                  <span>{selectedTicket.profiles?.email || 'No email'}</span>
                  <span>·</span>
                  <span>Farm: {selectedTicket.farms?.name || 'Unknown'}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={selectedTicket.status}
                  onValueChange={(val) => {
                    if (val) updateStatus(selectedTicket.id, val)
                  }}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
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
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-lg ${
                      msg.user_id === user?.id
                        ? 'bg-[#D8F3DC]/30 border border-[#D8F3DC] ml-auto max-w-[80%]'
                        : 'bg-gray-50 border border-gray-100 mr-auto max-w-[80%]'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-700">
                        {msg.user_id === user?.id ? 'Support Team' : selectedTicket.profiles?.full_name || 'User'}
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
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendReply()}
                  className="flex-1"
                />
                <Button
                  className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white"
                  onClick={sendReply}
                  disabled={!newMessage.trim() || submitting}
                >
                  <Send size={16} className="mr-2" />
                  Send Reply
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        // Ticket List
        <div className="space-y-3">
          {tickets.length === 0 ? (
            <Card className="shadow-sm border-0 bg-gradient-to-br from-[#D8F3DC]/20 to-white">
              <CardContent className="flex flex-col items-center justify-center py-16 text-gray-400">
                <CheckCircle size={48} className="text-[#2D6A4F] opacity-30 mb-4" />
                <p className="text-sm font-medium text-gray-600">No tickets found</p>
                <p className="text-xs text-gray-400 mt-1">All caught up! No support tickets matching your filters.</p>
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
                          <Badge className="bg-purple-100 text-purple-700 text-xs">Priority</Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {ticket.profiles?.full_name || 'Unknown'} · {ticket.farms?.name || 'Unknown'} · {ticket.category}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4 text-xs text-gray-400">
                      <Calendar size={12} />
                      <span>{formatDate(ticket.created_at)}</span>
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