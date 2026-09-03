// app/(dashboard)/settings/team/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import { 
  Card, CardContent, CardHeader, CardTitle 
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { useFarm } from '@/lib/farm-context'
import { usePlanRestrictions } from '@/lib/use-plan-restrictions'
import Link from 'next/link'
import {
  Users,
  UserPlus,
  Trash2,
  Mail,
  Shield,
  Crown,
  UserCog,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  RefreshCw,
  Search,
  MoreVertical,
  X
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'

// ===== TYPES =====
type TeamMember = {
  id: string
  user_id: string
  email: string
  full_name: string
  role: 'owner' | 'admin' | 'manager' | 'viewer'
  status: 'pending' | 'active' | 'declined' | 'inactive'
  invited_at: string
  accepted_at: string | null
  invited_by: string
  avatar_url?: string
}

type Invitation = {
  id: string
  email: string
  role: string
  token: string
  expires_at: string
  created_at: string
}

// ===== CONSTANTS =====
// ✅ FIX: Use consistent plan names that match the app
const TEAM_PLANS = ['pro', 'business'] as const
const PLAN_NAMES = {
  free: 'Free',
  starter: 'Starter',
  professional: 'Professional',
  premium: 'Premium',
  business: 'Business',
  enterprise: 'Enterprise'
}

const ROLE_LABELS = {
  owner: { label: 'Owner', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Crown },
  admin: { label: 'Admin', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Shield },
  manager: { label: 'Manager', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: UserCog },
  viewer: { label: 'Viewer', color: 'bg-gray-100 text-gray-600 border-gray-200', icon: Eye },
}

const STATUS_LABELS = {
  active: { label: 'Active', color: 'bg-green-100 text-green-700' },
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
  declined: { label: 'Declined', color: 'bg-red-100 text-red-700' },
  inactive: { label: 'Inactive', color: 'bg-gray-100 text-gray-500' },
}

const ROLE_PERMISSIONS = {
  owner: [
    'Full access to all settings',
    'Add/remove team members',
    'Delete farm',
    'Change subscription',
  ],
  admin: [
    'Full access to all modules',
    'Add/remove team members',
    'Manage settings',
  ],
  manager: [
    'Create and edit all records',
    'Manage tasks',
    'View reports',
  ],
  viewer: [
    'View all data',
    'Export reports',
    'Cannot edit or delete',
  ],
}

const ROLE_OPTIONS = ['admin', 'manager', 'viewer']

export default function TeamPage() {
  const [user, setUser] = useState<User | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openInviteDialog, setOpenInviteDialog] = useState(false)
  const [openRoleDialog, setOpenRoleDialog] = useState(false)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Invite form
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'manager' | 'viewer'>('viewer')
  const [inviting, setInviting] = useState(false)
  
  const supabase = createClient()
  const { currentFarm } = useFarm()
  const { plan } = usePlanRestrictions()

  // ===== CHECK AUTH =====
  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setAuthChecked(true)
    }
    checkAuth()
  }, [supabase])

  // ===== FETCH TEAM MEMBERS =====
  const fetchTeam = useCallback(async () => {
    if (!currentFarm || !user) {
      setLoading(false)
      return
    }

    setLoading(true)
    setIsRefreshing(true)
    setError(null)

    try {
      // First, check if current user is a member
      const { data: currentUserMember, error: currentUserError } = await supabase
        .from('team_members')
        .select('id, role')
        .eq('farm_id', currentFarm.id)
        .eq('user_id', user.id)
        .maybeSingle()

      if (currentUserError) {
        console.error('Current user check error:', currentUserError)
      }

      // Only add if not already a member
      if (!currentUserMember) {
        const { error: insertError } = await supabase
          .from('team_members')
          .insert([{
            farm_id: currentFarm.id,
            user_id: user.id,
            role: 'owner',
            status: 'active',
            email: user.email || '',
          }])

        if (insertError && insertError.code !== '23505') {
          console.error('Error adding user as owner:', insertError)
        }
      }

      // Fetch team members - simplified query without join
      const { data: membersData, error: membersError } = await supabase
        .from('team_members')
        .select('*')
        .eq('farm_id', currentFarm.id)
        .order('created_at', { ascending: false })

      if (membersError) {
        console.error('Members fetch error:', membersError)
        throw membersError
      }

      // Transform data
      const transformedMembers: TeamMember[] = []
      for (const member of (membersData || [])) {
        let fullName = member.email || 'Unknown User'
        let email = member.email || ''
        
        // Try to get profile info if user_id exists
        if (member.user_id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('user_id', member.user_id)
            .maybeSingle()
          
          if (profile) {
            fullName = profile.full_name || member.email || 'Unknown User'
            email = profile.email || member.email || ''
          }
        }

        transformedMembers.push({
          id: member.id,
          user_id: member.user_id || '',
          email: email,
          full_name: fullName,
          role: member.role as TeamMember['role'],
          status: (member.status || 'active') as TeamMember['status'],
          avatar_url: undefined,
          invited_at: member.created_at,
          accepted_at: member.updated_at,
          invited_by: member.invited_by || '',
        })
      }

      setMembers(transformedMembers)

      // Fetch pending invitations
      const { data: invitesData, error: invitesError } = await supabase
        .from('invitations')
        .select('*')
        .eq('farm_id', currentFarm.id)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })

      if (invitesError) {
        console.error('Invitations fetch error:', invitesError)
      }
      
      setInvitations(invitesData || [])
      
    } catch (err) {
      console.error('Fetch team error:', err)
      setError('Failed to load team members. Please try again.')
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [currentFarm, user, supabase])

  useEffect(() => {
    if (authChecked && user) {
      fetchTeam()
    }
  }, [authChecked, user, fetchTeam])

  // ===== INVITE TEAM MEMBER =====
  const inviteMember = async () => {
    if (!inviteEmail || !inviteRole || !currentFarm || !user) {
      setError('Please fill in all fields')
      return
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(inviteEmail)) {
      setError('Please enter a valid email address')
      return
    }

    setInviting(true)
    setError(null)

    try {
      // ✅ FIX: Check if already a member using server API
      const response = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: inviteRole,
          farmId: currentFarm.id,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send invitation')
      }

      toast.success(result.message || `Invitation sent to ${inviteEmail}`)
      setOpenInviteDialog(false)
      setInviteEmail('')
      await fetchTeam()
      
    } catch (err) {
      console.error('Invite error:', err)
      setError(err instanceof Error ? err.message : 'Failed to send invitation')
    } finally {
      setInviting(false)
    }
  }

  // ===== UPDATE ROLE =====
  const updateRole = async (memberId: string, newRole: string) => {
    if (!currentFarm || !user) return

    try {
      // ✅ FIX: Use server API for role update
      const response = await fetch('/api/team/update-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId,
          role: newRole,
          farmId: currentFarm.id,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update role')
      }

      toast.success('Role updated successfully')
      setSelectedMember(null)
      setOpenRoleDialog(false)
      await fetchTeam()
    } catch (err) {
      console.error('Update role error:', err)
      setError('Failed to update role')
    }
  }

  // ===== REMOVE MEMBER =====
  const removeMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return
    if (!currentFarm || !user) return

    try {
      // ✅ FIX: Use server API for removal
      const response = await fetch('/api/team/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId,
          farmId: currentFarm.id,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to remove team member')
      }

      toast.success('Team member removed')
      await fetchTeam()
    } catch (err) {
      console.error('Remove member error:', err)
      setError('Failed to remove team member')
    }
  }

  // ===== CANCEL INVITATION =====
  const cancelInvitation = async (inviteId: string) => {
    if (!confirm('Cancel this invitation?')) return

    try {
      // ✅ FIX: Use server API
      const response = await fetch('/api/team/cancel-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteId }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to cancel invitation')
      }

      toast.success('Invitation cancelled')
      await fetchTeam()
    } catch (err) {
      console.error('Cancel invitation error:', err)
      setError('Failed to cancel invitation')
    }
  }

  // ===== RESEND INVITATION =====
  const resendInvitation = async (inviteId: string) => {
    try {
      const response = await fetch('/api/team/resend-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteId }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to resend invitation')
      }

      toast.success('Invitation resent successfully')
      await fetchTeam()
    } catch (err) {
      console.error('Resend invitation error:', err)
      setError('Failed to resend invitation')
    }
  }

  const getRoleDisplay = (role: string) => {
    const config = ROLE_LABELS[role as keyof typeof ROLE_LABELS] || ROLE_LABELS.viewer
    const Icon = config.icon
    return {
      ...config,
      icon: <Icon size={14} className="mr-1" />
    }
  }

  const getStatusDisplay = (status: string) => {
    const config = STATUS_LABELS[status as keyof typeof STATUS_LABELS] || STATUS_LABELS.inactive
    return config
  }

  const getInitials = (name: string) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  // ===== FILTERED MEMBERS =====
  const filteredMembers = members.filter(member => {
    const name = member.full_name?.toLowerCase() || ''
    const email = member.email?.toLowerCase() || ''
    const query = searchQuery.toLowerCase()
    const matchesSearch = name.includes(query) || email.includes(query)
    const matchesRole = filterRole === 'all' || member.role === filterRole
    return matchesSearch && matchesRole
  })

  // ✅ FIX: Use consistent plan checking
  const canManageTeam = TEAM_PLANS.includes(plan as (typeof TEAM_PLANS)[number])

  if (!authChecked || loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-[#2D6A4F] mx-auto mb-3" />
          <p className="text-sm text-gray-400">Loading team members...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-xl font-semibold text-[#1B4332] mb-2">Please Log In</h2>
        <p className="text-sm text-gray-500">You need to be logged in to manage team members.</p>
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
        <p className="text-sm text-gray-500">Please select a farm to manage team members.</p>
        <Link href="/settings">
          <Button className="mt-4 bg-[#2D6A4F] hover:bg-[#1B4332] text-white">
            Go to Settings
          </Button>
        </Link>
      </div>
    )
  }

  // ===== PLAN RESTRICTION =====
  if (!canManageTeam) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Users size={32} className="text-gray-300" />
        </div>
        <h2 className="text-xl font-semibold text-[#1B4332] mb-2">Team Management</h2>
        <p className="text-sm text-gray-500 max-w-md mb-4">
          Team management is available on Premium, Business, and Enterprise plans. Upgrade to add team members and collaborate.
        </p>
        <Link href="/subscription">
          <Button className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white">
            <Crown size={14} className="mr-2" />
            Upgrade Plan
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header - unchanged */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-[#1B4332]">Team Management</h1>
            <Badge className="bg-[#D8F3DC] text-[#2D6A4F] text-xs font-medium">
              {currentFarm.name}
            </Badge>
            <Badge className="bg-amber-100 text-amber-700 text-xs font-medium">
              <Crown size={12} className="mr-1" />
              {PLAN_NAMES[plan as keyof typeof PLAN_NAMES] || plan}
            </Badge>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            Manage your team members and their access levels
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTeam}
            disabled={isRefreshing}
            className="border-gray-200 hover:border-[#2D6A4F] hover:text-[#2D6A4F]"
          >
            <RefreshCw size={14} className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button
            className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white"
            onClick={() => setOpenInviteDialog(true)}
          >
            <UserPlus size={16} className="mr-2" />
            Invite Member
          </Button>
        </div>
      </div>

      {/* Stats - unchanged */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="shadow-sm border-0 bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{members.length}</p>
            <p className="text-xs text-gray-400 font-medium">Team Members</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-0 bg-gradient-to-br from-amber-50 to-white">
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{invitations.length}</p>
            <p className="text-xs text-gray-400 font-medium">Pending Invitations</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-0 bg-gradient-to-br from-green-50 to-white">
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-green-600">
              {members.filter(m => m.role === 'owner' || m.role === 'admin').length}
            </p>
            <p className="text-xs text-gray-400 font-medium">Admins</p>
          </CardContent>
        </Card>
      </div>

      {/* Error message - unchanged */}
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

      {/* Search and Filter - unchanged */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 border-gray-200 focus:border-[#2D6A4F] focus:ring-[#2D6A4F] h-9 text-sm"
          />
        </div>
        <Select value={filterRole} onValueChange={(value) => setFilterRole(value || 'all')}>
          <SelectTrigger className="w-32 border-gray-200 h-9 text-sm">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="owner">Owner</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="viewer">Viewer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Team Members List - unchanged except actions use new functions */}
      <Card className="shadow-sm border-0">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2">
            <Users size={16} className="text-[#2D6A4F]" />
            Team Members
            <Badge className="bg-[#D8F3DC] text-[#2D6A4F] text-xs">
              {filteredMembers.length} / {members.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredMembers.length === 0 && invitations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Users size={32} className="mb-3 opacity-30" />
              <p className="text-sm font-medium text-gray-600">No team members yet</p>
              <p className="text-xs text-gray-400 mt-1">Invite your first team member to collaborate</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredMembers.map((member) => {
                const roleConfig = getRoleDisplay(member.role)
                const statusConfig = getStatusDisplay(member.status)
                const isSelf = member.user_id === user.id
                const displayName = member.full_name || member.email

                return (
                  <div key={member.id} className="flex items-center justify-between px-4 sm:px-6 py-4 hover:bg-gray-50/50 transition-colors group">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={member.avatar_url || ''} />
                        <AvatarFallback className="bg-[#D8F3DC] text-[#2D6A4F] text-xs font-medium">
                          {getInitials(displayName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {displayName}
                          {isSelf && <span className="text-xs text-gray-400 ml-2">(You)</span>}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs text-gray-400 truncate">{member.email}</p>
                          <Badge className={`text-[10px] ${roleConfig.color}`}>
                            {roleConfig.icon}
                            {roleConfig.label}
                          </Badge>
                          <Badge className={`text-[10px] ${statusConfig.color}`}>
                            {statusConfig.label}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isSelf && member.role !== 'owner' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical size={14} className="text-gray-400" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Manage Member</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => {
                              setSelectedMember(member)
                              setOpenRoleDialog(true)
                            }}>
                              <Shield size={14} className="mr-2 text-blue-500" />
                              Change Role
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => removeMember(member.id)}
                              className="text-red-500 hover:text-red-600"
                            >
                              <Trash2 size={14} className="mr-2" />
                              Remove Member
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Pending Invitations */}
              {invitations.map((invite) => {
                const roleConfig = getRoleDisplay(invite.role)
                return (
                  <div key={invite.id} className="flex items-center justify-between px-4 sm:px-6 py-4 bg-amber-50/30">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <Mail size={16} className="text-amber-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{invite.email}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className="text-[10px] bg-amber-100 text-amber-700">
                            <Clock size={10} className="mr-1" />
                            Pending
                          </Badge>
                          <Badge className={`text-[10px] ${roleConfig.color}`}>
                            {roleConfig.icon}
                            {roleConfig.label}
                          </Badge>
                          <span className="text-xs text-gray-400">
                            Expires {new Date(invite.expires_at).toLocaleDateString('en-ZA', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => resendInvitation(invite.id)}
                        className="text-gray-400 hover:text-[#2D6A4F]"
                        title="Resend invitation"
                      >
                        <RefreshCw size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => cancelInvitation(invite.id)}
                        className="text-gray-400 hover:text-red-500"
                        title="Cancel invitation"
                      >
                        <X size={14} />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Dialog - unchanged */}
      <Dialog open={openInviteDialog} onOpenChange={setOpenInviteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus size={18} className="text-[#2D6A4F]" />
              Invite Team Member
            </DialogTitle>
            <DialogDescription>
              Add a new member to your farm team. They will receive an email invitation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input
                type="email"
                placeholder="colleague@farm.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={inviteRole}
                onValueChange={(value) => setInviteRole(value as 'admin' | 'manager' | 'viewer')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs font-medium text-gray-700">Role permissions:</p>
              <ul className="mt-1 space-y-0.5">
                {ROLE_PERMISSIONS[inviteRole]?.map((p) => (
                  <li key={p} className="text-xs text-gray-500 flex items-center gap-1">
                    <CheckCircle size={10} className="text-[#2D6A4F]" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setOpenInviteDialog(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white"
                onClick={inviteMember}
                disabled={!inviteEmail || !inviteRole || inviting}
              >
                {inviting ? (
                  <><Loader2 size={14} className="mr-2 animate-spin" /> Sending...</>
                ) : (
                  <><Mail size={14} className="mr-2" /> Send Invitation</>
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Role Change Dialog - unchanged */}
      <Dialog open={openRoleDialog} onOpenChange={setOpenRoleDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield size={18} className="text-[#2D6A4F]" />
              Change Role
            </DialogTitle>
            <DialogDescription>
              Update the role and permissions for this team member.
            </DialogDescription>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={selectedMember.avatar_url || ''} />
                  <AvatarFallback className="bg-[#D8F3DC] text-[#2D6A4F] text-xs font-medium">
                    {getInitials(selectedMember.full_name || selectedMember.email)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {selectedMember.full_name || selectedMember.email}
                  </p>
                  <p className="text-xs text-gray-400">{selectedMember.email}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Select Role</Label>
                <Select
                  value={selectedMember.role}
                  onValueChange={(value) => {
                    if (value === 'admin' || value === 'manager' || value === 'viewer') {
                      setSelectedMember({ ...selectedMember, role: value })
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((role) => {
                      const config = getRoleDisplay(role)
                      return (
                        <SelectItem key={role} value={role}>
                          <div className="flex items-center gap-2">
                            {config.icon}
                            {config.label}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-700">Permissions for this role:</p>
                <ul className="mt-1 space-y-0.5">
                  {ROLE_PERMISSIONS[selectedMember.role as keyof typeof ROLE_PERMISSIONS]?.map((p) => (
                    <li key={p} className="text-xs text-gray-500 flex items-center gap-1">
                      <CheckCircle size={10} className="text-[#2D6A4F]" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedMember(null)
                    setOpenRoleDialog(false)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white"
                  onClick={() => updateRole(selectedMember.id, selectedMember.role)}
                >
                  Update Role
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}