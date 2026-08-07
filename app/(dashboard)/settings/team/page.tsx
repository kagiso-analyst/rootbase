// app/(dashboard)/settings/team/page.tsx

'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Card, CardContent, CardHeader, CardTitle 
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { useFarm } from '@/lib/farm-context'
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
  XCircle,
  Clock,
  AlertCircle,
  Loader2
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
import { toast } from 'sonner'

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

const ROLE_LABELS = {
  owner: { label: 'Owner', color: 'bg-amber-100 text-amber-700', icon: Crown },
  admin: { label: 'Admin', color: 'bg-purple-100 text-purple-700', icon: Shield },
  manager: { label: 'Manager', color: 'bg-blue-100 text-blue-700', icon: UserCog },
  viewer: { label: 'Viewer', color: 'bg-gray-100 text-gray-600', icon: Eye },
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
  const [user, setUser] = useState<any>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openInviteDialog, setOpenInviteDialog] = useState(false)
  const [openRoleDialog, setOpenRoleDialog] = useState(false)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  
  // Invite form
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'manager' | 'viewer'>('viewer')
  const [inviting, setInviting] = useState(false)
  
  const supabase = createClient()
  const { currentFarm } = useFarm()

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
    setError(null)

    try {
      // First, check if current user is a member
      const { data: currentUserMember } = await supabase
        .from('team_members')
        .select('role')
        .eq('farm_id', currentFarm.id)
        .eq('user_id', user.id)
        .maybeSingle()

      // If user is not a member yet, add them as owner
      if (!currentUserMember) {
        const { error: insertError } = await supabase
          .from('team_members')
          .insert([{
            farm_id: currentFarm.id,
            user_id: user.id,
            role: 'owner',
            status: 'active',
            email: user.email,
          }])

        if (insertError) {
          console.error('Error adding user as owner:', insertError)
        }
      }

      // Fetch team members
      const { data: membersData, error: membersError } = await supabase
        .from('team_members')
        .select('*')
        .eq('farm_id', currentFarm.id)
        .order('invited_at', { ascending: false })

      if (membersError) {
        console.error('Members fetch error:', membersError)
        throw membersError
      }

      // Manually fetch profiles for each member
      const transformedMembers: TeamMember[] = []
      for (const member of (membersData || [])) {
        let fullName = 'Unknown User'
        let email = member.email || ''
        
        if (member.user_id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email, avatar_url')
            .eq('user_id', member.user_id)
            .maybeSingle()
          
          if (profile) {
            fullName = profile.full_name || 'Unknown User'
            email = profile.email || member.email || ''
          }
        }

        transformedMembers.push({
          id: member.id,
          user_id: member.user_id,
          email: email,
          full_name: fullName,
          role: member.role,
          status: member.status || 'active',
          avatar_url: undefined,
          invited_at: member.invited_at,
          accepted_at: member.accepted_at,
          invited_by: member.invited_by,
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
      // First, check if user already exists in the system
      const { data: existingUser, error: userError } = await supabase
        .from('profiles')
        .select('user_id, email')
        .eq('email', inviteEmail.trim())
        .maybeSingle()

      if (userError && userError.code !== 'PGRST116') {
        console.error('User lookup error:', userError)
      }

      if (existingUser) {
        // Check if already a member
        const { data: existingMember, error: memberCheckError } = await supabase
          .from('team_members')
          .select('id')
          .eq('farm_id', currentFarm.id)
          .eq('user_id', existingUser.user_id)
          .maybeSingle()

        if (memberCheckError && memberCheckError.code !== 'PGRST116') {
          console.error('Member check error:', memberCheckError)
        }

        if (existingMember) {
          setError('User is already a member of this farm')
          setInviting(false)
          return
        }

        // Add existing user to team
        const { error: addError } = await supabase
          .from('team_members')
          .insert([{
            farm_id: currentFarm.id,
            user_id: existingUser.user_id,
            role: inviteRole,
            status: 'active',
            invited_by: user.id,
            email: inviteEmail.trim(),
          }])

        if (addError) {
          console.error('Add member error:', addError)
          throw new Error(`Failed to add team member: ${addError.message}`)
        }

        toast.success(`${inviteEmail} has been added to the team`)
        setOpenInviteDialog(false)
        setInviteEmail('')
        await fetchTeam()
        setInviting(false)
        return
      }

      // User doesn't exist - create invitation
      const token = Math.random().toString(36).substring(2, 15) + 
                    Math.random().toString(36).substring(2, 15)
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)

      // Check if there's already a pending invitation
      const { data: existingInvite, error: inviteCheckError } = await supabase
        .from('invitations')
        .select('id')
        .eq('email', inviteEmail.trim())
        .eq('farm_id', currentFarm.id)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle()

      if (inviteCheckError && inviteCheckError.code !== 'PGRST116') {
        console.error('Invite check error:', inviteCheckError)
      }

      if (existingInvite) {
        setError('An invitation has already been sent to this email')
        setInviting(false)
        return
      }

      const { error: inviteError } = await supabase
        .from('invitations')
        .insert([{
          email: inviteEmail.trim(),
          farm_id: currentFarm.id,
          role: inviteRole,
          invited_by: user.id,
          token,
          expires_at: expiresAt.toISOString(),
        }])

      if (inviteError) {
        console.error('Invite creation error:', inviteError)
        
        if (inviteError.code === '23505') {
          setError('An invitation has already been sent to this email')
          setInviting(false)
          return
        }
        
        if (inviteError.code === '42501') {
          setError('You do not have permission to invite members')
          setInviting(false)
          return
        }
        
        throw new Error(`Failed to create invitation: ${inviteError.message}`)
      }

      toast.success(`Invitation sent to ${inviteEmail}`)
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
      const { error } = await supabase
        .from('team_members')
        .update({ role: newRole })
        .eq('id', memberId)
        .eq('farm_id', currentFarm.id)

      if (error) throw error

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
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId)
        .eq('farm_id', currentFarm.id)

      if (error) throw error
      
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
      const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', inviteId)
        .eq('farm_id', currentFarm?.id)

      if (error) throw error
      
      toast.success('Invitation cancelled')
      await fetchTeam()
    } catch (err) {
      console.error('Cancel invitation error:', err)
      setError('Failed to cancel invitation')
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-[#1B4332]">Team Management</h1>
            <Badge className="bg-[#D8F3DC] text-[#2D6A4F] text-xs font-medium">
              {currentFarm.name}
            </Badge>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            Manage your team members and their access levels
          </p>
        </div>
      </div>

      {/* Stats */}
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

      {/* Team Members List */}
      <Card className="shadow-sm border-0">
        <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100">
          <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2">
            <Users size={16} className="text-[#2D6A4F]" />
            Team Members
          </CardTitle>
          <Dialog open={openInviteDialog} onOpenChange={setOpenInviteDialog}>
            <Button
              className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white"
              onClick={() => setOpenInviteDialog(true)}
            >
              <UserPlus size={16} className="mr-2" />
              Invite Member
            </Button>
            <DialogContent className="sm:max-w-md" showCloseButton={false}>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
                <DialogDescription>
                  Send an invitation to join your farm team.
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
                    onValueChange={(val) => setInviteRole(val as any)}
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
                      <li key={p} className="text-xs text-gray-400 flex items-center gap-1">
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
        </CardHeader>
        <CardContent className="p-0">
          {members.length === 0 && invitations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Users size={32} className="mb-3 opacity-30" />
              <p className="text-sm font-medium text-gray-600">No team members yet</p>
              <p className="text-xs text-gray-400 mt-1">Invite your first team member to collaborate</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {members.map((member) => {
                const roleConfig = getRoleDisplay(member.role)
                const isSelf = member.user_id === user.id
                const displayName = member.full_name || member.email

                return (
                  <div key={member.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#D8F3DC] flex items-center justify-center text-[#2D6A4F] font-semibold text-sm flex-shrink-0">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {displayName}
                          {isSelf && <span className="text-xs text-gray-400 ml-2">(You)</span>}
                        </p>
                        <p className="text-xs text-gray-400">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <Badge className={`text-xs ${roleConfig.color}`}>
                          {roleConfig.icon}
                          {roleConfig.label}
                        </Badge>
                        {member.status === 'pending' && (
                          <Badge className="text-xs bg-amber-100 text-amber-700">
                            <Clock size={10} className="mr-1" />
                            Pending
                          </Badge>
                        )}
                      </div>
                      {!isSelf && member.role !== 'owner' && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedMember(member)
                              setOpenRoleDialog(true)
                            }}
                            className="text-gray-400 hover:text-[#2D6A4F]"
                          >
                            <Shield size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMember(member.id)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Pending Invitations */}
              {invitations.map((invite) => (
                <div key={invite.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors bg-amber-50/30">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
                      <Clock size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{invite.email}</p>
                      <p className="text-xs text-gray-400">
                        Invited {new Date(invite.created_at).toLocaleDateString()} 
                        {invite.expires_at && ` · Expires ${new Date(invite.expires_at).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="text-xs bg-amber-100 text-amber-700">
                      <Clock size={10} className="mr-1" />
                      Pending
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => cancelInvitation(invite.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <XCircle size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Change Dialog */}
      <Dialog open={openRoleDialog} onOpenChange={setOpenRoleDialog}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Change Role</DialogTitle>
            <DialogDescription>
              Update the permissions for this team member.
            </DialogDescription>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-[#D8F3DC] flex items-center justify-center text-[#2D6A4F] font-semibold text-sm">
                  {selectedMember.full_name?.charAt(0).toUpperCase() || '?'}
                </div>
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
                  onValueChange={(val) => {
                    setSelectedMember({ ...selectedMember, role: val as any })
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
                    <li key={p} className="text-xs text-gray-400 flex items-center gap-1">
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