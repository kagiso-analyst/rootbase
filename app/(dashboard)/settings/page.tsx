// app/(dashboard)/settings/page.tsx

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Save, User, Bell, Shield, Palette, Import, RefreshCw, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { useFarm } from '@/lib/farm-context'
import { usePlanRestrictions } from '@/lib/use-plan-restrictions'

export default function SettingsPage() {
  // ===== AUTH STATE =====
  const [user, setUser] = useState<any>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const supabase = createClient()

  // ===== FARM CONTEXT =====
  const { currentFarm, refreshFarms, loading: farmLoading } = useFarm()

  // ===== PLAN RESTRICTIONS =====
  const { plan, hasFeature, loading: planLoading } = usePlanRestrictions()

  // ===== DATA STATE =====
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [farmName, setFarmName] = useState('')
  const [province, setProvince] = useState('')
  const [farmType, setFarmType] = useState('')
  const [totalHectares, setTotalHectares] = useState('')
  const [currency, setCurrency] = useState('ZAR')
  const [language, setLanguage] = useState('en')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // ===== PASSWORD STATE =====
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // ===== DELETE ACCOUNT STATE =====
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)

  // ===== CHECK AUTH =====
  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
      } catch (err) {
        console.error('Auth check error:', err)
        setError('Failed to authenticate. Please refresh the page.')
      } finally {
        setAuthChecked(true)
      }
    }
    checkAuth()
  }, [supabase])

  // ===== LOAD DATA =====
  const loadData = useCallback(async () => {
    if (!user) {
      setLoadingProfile(false)
      return
    }

    setLoadingProfile(true)
    setError(null)
    
    try {
      // Load user profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, email, phone, avatar_url')
        .eq('user_id', user.id)
        .single()

      if (profileError && profileError.code !== 'PGRST116' && profileError.code !== '42P01') {
        console.error('Profile fetch error:', profileError)
      }
      
      if (profile) {
        setFullName(profile.full_name || '')
        setEmail(profile.email || '')
        setPhone(profile.phone || '')
      } else {
        setFullName(user.user_metadata?.full_name || '')
        setEmail(user.email || '')
      }

      // Load farm data if available
      if (currentFarm) {
        setFarmName(currentFarm.name || '')
        setProvince(currentFarm.province || '')
        setFarmType(currentFarm.farm_type || '')
        setTotalHectares(currentFarm.total_hectares?.toString() || '')
      }
      
    } catch (err) {
      console.error('Load data error:', err)
      setError('Failed to load your settings. Please refresh the page.')
    } finally {
      setLoadingProfile(false)
    }
  }, [user, currentFarm, supabase])

  useEffect(() => {
    if (authChecked && user) {
      loadData()
    }
  }, [authChecked, user, loadData])

  // ===== SAVE PROFILE =====
  // ===== SAVE PROFILE =====
async function handleProfileSave() {
  setLoading(true)
  setSaveMessage(null)
  setError(null)
  
  try {
    if (!user) {
      setSaveMessage({ type: 'error', text: 'You must be logged in to save settings' })
      setLoading(false)
      return
    }

    // Update email if changed
    if (email !== user.email) {
      const { error: emailError } = await supabase.auth.updateUser({
        email: email
      })
      if (emailError) throw new Error('Failed to update email: ' + emailError.message)
    }

    // Update profile
    const { error } = await supabase
      .from('profiles')
      .upsert({
        user_id: user.id,
        full_name: fullName,
        email: email,
        phone: phone,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

    if (error) throw new Error('Failed to save profile: ' + error.message)

    setSaveMessage({ type: 'success', text: 'Profile saved successfully!' })
    
    // Refresh user data
    const { data: { user: updatedUser } } = await supabase.auth.getUser()
    if (updatedUser) setUser(updatedUser)
    
    // 🔥 FIX: Dispatch event for TopBar to update
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('profile-updated'))
    }
    
  } catch (err) {
    console.error('Profile save error:', err)
    setSaveMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save profile' })
  } finally {
    setLoading(false)
    setTimeout(() => setSaveMessage(null), 3000)
  }
}

  // ===== UPDATE PASSWORD =====
  async function handleUpdatePassword() {
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Please fill in all password fields' })
      return
    }

    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 8 characters' })
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match' })
      return
    }

    setPasswordLoading(true)
    setPasswordMessage(null)

    try {
      // First verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      })

      if (signInError) {
        setPasswordMessage({ type: 'error', text: 'Current password is incorrect' })
        setPasswordLoading(false)
        return
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw new Error('Failed to update password: ' + error.message)

      setPasswordMessage({ type: 'success', text: 'Password updated successfully!' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      
    } catch (err) {
      console.error('Password update error:', err)
      setPasswordMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update password' })
    } finally {
      setPasswordLoading(false)
      setTimeout(() => setPasswordMessage(null), 5000)
    }
  }

  // ===== SAVE FARM =====
  async function handleFarmSave() {
    setLoading(true)
    setSaveMessage(null)
    setError(null)
    
    try {
      if (!user) {
        setSaveMessage({ type: 'error', text: 'You must be logged in to save farm settings' })
        setLoading(false)
        return
      }

      if (!farmName.trim()) {
        setSaveMessage({ type: 'error', text: 'Please enter a farm name' })
        setLoading(false)
        return
      }

      // Check if farm exists
      const { data: existing } = await supabase
        .from('farms')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', farmName)
        .maybeSingle()

      let error
      if (existing) {
        // Update existing farm
        const { error: updateError } = await supabase
          .from('farms')
          .update({
            farm_type: farmType || null,
            province: province || null,
            total_hectares: parseFloat(totalHectares) || 0,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
        error = updateError
      } else {
        // Create new farm
        const { error: insertError } = await supabase
          .from('farms')
          .insert([{
            user_id: user.id,
            name: farmName,
            farm_type: farmType || null,
            province: province || null,
            total_hectares: parseFloat(totalHectares) || 0,
            is_active: true,
          }])
        error = insertError
      }

      if (error) throw new Error('Failed to save farm: ' + error.message)

      setSaveMessage({ type: 'success', text: 'Farm settings saved successfully!' })
      
      // Refresh farms in context
      await refreshFarms()
      
    } catch (err) {
      console.error('Farm save error:', err)
      setSaveMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save farm settings' })
    } finally {
      setLoading(false)
      setTimeout(() => setSaveMessage(null), 3000)
    }
  }

  // ===== DELETE ACCOUNT =====
  async function handleDeleteAccount() {
    if (deleteConfirmText !== 'DELETE') {
      setPasswordMessage({ type: 'error', text: 'Please type DELETE to confirm' })
      return
    }

    setDeleteLoading(true)
    setPasswordMessage(null)

    try {
      // Delete user data from all tables
      const tables = ['profiles', 'farms', 'income', 'expenses', 'crops', 'livestock', 'equipment', 'journal_entries']
      
      for (const table of tables) {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq('user_id', user.id)
        
        if (error && error.code !== 'PGRST116' && error.code !== '42P01') {
          console.error(`Error deleting from ${table}:`, error)
        }
      }

      // Delete the user account
      const { error } = await supabase.auth.admin.deleteUser(user.id)
      
      if (error) {
        // If admin delete fails, try to sign out
        await supabase.auth.signOut()
        window.location.href = '/login?deleted=true'
        return
      }

      await supabase.auth.signOut()
      window.location.href = '/login?deleted=true'
      
    } catch (err) {
      console.error('Delete account error:', err)
      setPasswordMessage({ type: 'error', text: 'Failed to delete account. Please contact support.' })
    } finally {
      setDeleteLoading(false)
    }
  }

  // ===== LOADING STATE =====
  if (!authChecked || farmLoading || loadingProfile || planLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#2D6A4F] border-t-transparent mx-auto mb-3"></div>
          <p className="text-sm text-gray-400">
            {!authChecked ? 'Checking authentication...' : 
             farmLoading ? 'Loading farms...' : 
             planLoading ? 'Loading plan...' : 'Loading settings...'}
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
        <p className="text-sm text-gray-500">You need to be logged in to manage your settings.</p>
        <Link href="/login">
          <Button className="mt-4 bg-[#2D6A4F] hover:bg-[#1B4332] text-white">
            Go to Login
          </Button>
        </Link>
      </div>
    )
  }

  // ===== ACTUAL PAGE =====
  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-[#1B4332]">Settings</h1>
          {currentFarm && (
            <Badge className="bg-[#D8F3DC] text-[#2D6A4F] text-xs font-medium">
              {currentFarm.name}
            </Badge>
          )}
          <Badge className="bg-[#D8F3DC] text-[#2D6A4F] text-xs font-medium capitalize">
            {plan} Plan
          </Badge>
        </div>
        <p className="text-gray-500 text-sm mt-1">
          Manage your account and farm preferences
        </p>
      </div>

      {/* Save message */}
      {saveMessage && (
        <Card className={`shadow-sm ${saveMessage.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <CardContent className="py-3 px-4 flex items-center gap-3">
            {saveMessage.type === 'success' ? (
              <CheckCircle size={16} className="text-green-500" />
            ) : (
              <AlertCircle size={16} className="text-red-500" />
            )}
            <p className={`text-sm ${saveMessage.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
              {saveMessage.text}
            </p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="profile">
        <TabsList className="bg-[#D8F3DC] flex flex-wrap gap-1 p-1 rounded-lg">
          <TabsTrigger value="profile" className="data-[state=active]:bg-[#2D6A4F] data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-all">
            <User size={14} className="mr-1.5" /> Profile
          </TabsTrigger>
          <TabsTrigger value="farm" className="data-[state=active]:bg-[#2D6A4F] data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-all">
            <Palette size={14} className="mr-1.5" /> Farm
          </TabsTrigger>
          <TabsTrigger value="import" className="data-[state=active]:bg-[#2D6A4F] data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-all">
            <Import size={14} className="mr-1.5" /> Import Data
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-[#2D6A4F] data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-all">
            <Bell size={14} className="mr-1.5" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="account" className="data-[state=active]:bg-[#2D6A4F] data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-all">
            <Shield size={14} className="mr-1.5" /> Account
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="mt-4">
          <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-base font-semibold text-gray-700">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">Full Name</Label>
                  <Input
                    placeholder="Your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="border-gray-200 focus:border-[#2D6A4F] focus:ring-[#2D6A4F]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">Phone Number</Label>
                  <Input
                    placeholder="e.g. 071 234 5678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="border-gray-200 focus:border-[#2D6A4F] focus:ring-[#2D6A4F]"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">Email Address</Label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-gray-200 focus:border-[#2D6A4F] focus:ring-[#2D6A4F]"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">Language</Label>
                  <Select value={language} onValueChange={(val) => setLanguage(val || 'en')}>
                    <SelectTrigger className="border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="af">Afrikaans</SelectItem>
                      <SelectItem value="zu">Zulu</SelectItem>
                      <SelectItem value="xh">Xhosa</SelectItem>
                      <SelectItem value="st">Sesotho</SelectItem>
                      <SelectItem value="ts">Tsonga</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">Currency</Label>
                  <Select value={currency} onValueChange={(val) => setCurrency(val || 'ZAR')}>
                    <SelectTrigger className="border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ZAR">ZAR — South African Rand</SelectItem>
                      <SelectItem value="USD">USD — US Dollar</SelectItem>
                      <SelectItem value="KES">KES — Kenyan Shilling</SelectItem>
                      <SelectItem value="NGN">NGN — Nigerian Naira</SelectItem>
                      <SelectItem value="ZWL">ZWL — Zimbabwean Dollar</SelectItem>
                      <SelectItem value="BWP">BWP — Botswana Pula</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white shadow-sm"
                onClick={handleProfileSave}
                disabled={loading}
              >
                {loading ? (
                  <><RefreshCw size={15} className="mr-2 animate-spin" /> Saving...</>
                ) : (
                  <><Save size={15} className="mr-2" /> Save Changes</>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Farm Tab */}
        <TabsContent value="farm" className="mt-4">
          <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-base font-semibold text-gray-700">Farm Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">Farm Name <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="e.g. Shammah Family Farm"
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  className="border-gray-200 focus:border-[#2D6A4F] focus:ring-[#2D6A4F]"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">Province</Label>
                  <Select value={province} onValueChange={(val) => setProvince(val || '')}>
                    <SelectTrigger className="border-gray-200">
                      <SelectValue placeholder="Select province..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gauteng">Gauteng</SelectItem>
                      <SelectItem value="limpopo">Limpopo</SelectItem>
                      <SelectItem value="mpumalanga">Mpumalanga</SelectItem>
                      <SelectItem value="north_west">North West</SelectItem>
                      <SelectItem value="free_state">Free State</SelectItem>
                      <SelectItem value="kwazulu_natal">KwaZulu-Natal</SelectItem>
                      <SelectItem value="eastern_cape">Eastern Cape</SelectItem>
                      <SelectItem value="western_cape">Western Cape</SelectItem>
                      <SelectItem value="northern_cape">Northern Cape</SelectItem>
                      <SelectItem value="other">Other Country</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">Farm Type</Label>
                  <Select value={farmType} onValueChange={(val) => setFarmType(val || '')}>
                    <SelectTrigger className="border-gray-200">
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="crop">Crop Farming</SelectItem>
                      <SelectItem value="livestock">Livestock</SelectItem>
                      <SelectItem value="mixed">Mixed Farming</SelectItem>
                      <SelectItem value="horticulture">Horticulture</SelectItem>
                      <SelectItem value="aquaculture">Aquaculture</SelectItem>
                      <SelectItem value="poultry">Poultry</SelectItem>
                      <SelectItem value="dairy">Dairy</SelectItem>
                      <SelectItem value="vineyard">Vineyard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">Total Farm Size (hectares)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 50"
                  value={totalHectares}
                  onChange={(e) => setTotalHectares(e.target.value)}
                  className="border-gray-200 focus:border-[#2D6A4F] focus:ring-[#2D6A4F]"
                />
              </div>
              <Button
                className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white shadow-sm"
                onClick={handleFarmSave}
                disabled={loading}
              >
                {loading ? (
                  <><RefreshCw size={15} className="mr-2 animate-spin" /> Saving...</>
                ) : (
                  <><Save size={15} className="mr-2" /> Save Changes</>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Import Tab */}
        <TabsContent value="import" className="mt-4 space-y-4">
          <Card className="shadow-sm border-orange-200 bg-gradient-to-br from-orange-50 to-white">
            <CardContent className="py-4 px-5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-orange-500 text-lg">!</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-orange-700 mb-1">Important — Read Before Importing</p>
                  <p className="text-xs text-orange-600 leading-relaxed">
                    Historical data is kept completely separate from your current operations.
                    All imports are tagged with their original date so they appear correctly in reports
                    but do not interfere with your live farm data. You can filter reports by date range
                    to view historical vs current data separately.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-base font-semibold text-gray-700">Import Historical Farm Records</CardTitle>
              <p className="text-xs text-gray-400">
                Add records from before you joined RootBase. Each module accepts any past date.
              </p>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                {[
                  {
                    year: '2023',
                    modules: ['Finances', 'Crops', 'Livestock', 'Journal'],
                    status: 'Ready to import',
                    color: 'border-blue-200 bg-blue-50/30'
                  },
                  {
                    year: '2024',
                    modules: ['Finances', 'Crops', 'Livestock', 'Equipment', 'Journal'],
                    status: 'Ready to import',
                    color: 'border-green-200 bg-green-50/30'
                  },
                  {
                    year: '2025',
                    modules: ['All modules'],
                    status: 'Ready to import',
                    color: 'border-purple-200 bg-purple-50/30'
                  },
                ].map(({ year, modules, status, color }) => (
                  <div key={year} className={`border ${color} rounded-xl p-4 transition-all hover:shadow-md`}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-[#1B4332]">{year} Records</p>
                      <Badge className="bg-[#D8F3DC] text-[#2D6A4F] text-xs font-medium">{status}</Badge>
                    </div>
                    <p className="text-xs text-gray-400 mb-3">Modules: {modules.join(', ')}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Add Past Expenses', href: '/finances/expenses' },
                        { label: 'Add Past Income', href: '/finances/income' },
                        { label: 'Add Past Crops', href: '/crops' },
                        { label: 'Add Past Journal Entries', href: '/journal' },
                        { label: 'Add Past Livestock', href: '/livestock' },
                        { label: 'Add Past Equipment', href: '/equipment' },
                      ].map(({ label, href }) => (
                        <Link
                          key={label}
                          href={href}
                          className="text-xs border border-gray-200 rounded-lg px-3 py-2 text-gray-600 hover:border-[#2D6A4F] hover:text-[#2D6A4F] hover:bg-[#D8F3DC]/20 transition-all text-center"
                        >
                          {label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-4 bg-gradient-to-br from-[#D8F3DC] to-white rounded-xl border border-[#52B788]/20">
                <p className="text-sm font-semibold text-[#1B4332] mb-2 flex items-center gap-2">
                  <span className="text-lg">📖</span> How it works
                </p>
                <ol className="space-y-1.5">
                  {[
                    'Click any module above to go to it',
                    'Click "Add" as normal',
                    'Set the Date field to the historical date (e.g. 2023-05-12)',
                    'Fill in the historical data and save',
                    'In Reports — use date filters to view specific years separately',
                    'Your current data stays completely unaffected',
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-[#2D6A4F]">
                      <span className="font-bold w-4 flex-shrink-0">{i + 1}.</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="mt-4">
          <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-base font-semibold text-gray-700">Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {[
                { label: 'Task due date reminders', desc: 'Get notified when tasks are due', default: true },
                { label: 'Low stock alerts', desc: 'Alert when inventory falls below reorder level', default: true },
                { label: 'Equipment service reminders', desc: 'Alert when service is due', default: true },
                { label: 'Document expiry warnings', desc: 'Alert 30 days before documents expire', default: true },
                { label: 'Weekly farm summary', desc: 'Receive a weekly summary of your farm activity', default: false },
                { label: 'Weather alerts', desc: 'Severe weather warnings for your area', default: hasFeature('weatherAlerts') },
              ].map(({ label, desc, default: defaultChecked }) => (
                <div key={label} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 px-2 rounded-lg transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{label}</p>
                    <p className="text-xs text-gray-400">{desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      defaultChecked={defaultChecked}
                      disabled={label.includes('Weather') && !hasFeature('weatherAlerts')}
                    />
                    <div className={`w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-[#2D6A4F] peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all shadow-inner ${
                      label.includes('Weather') && !hasFeature('weatherAlerts') ? 'opacity-50 cursor-not-allowed' : ''
                    }`} />
                  </label>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Tab - WITH WORKING PASSWORD UPDATE */}
        <TabsContent value="account" className="mt-4">
          <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-base font-semibold text-gray-700">Account & Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {/* Subscription info */}
              <div className="p-4 bg-gradient-to-br from-[#D8F3DC] to-white rounded-xl border border-[#52B788]/20">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-[#1B4332] capitalize">Plan: {plan} Plan</p>
                    <p className="text-xs text-[#2D6A4F] mt-1 max-w-md">
                      {plan === 'free' && 'Upgrade to Starter (R199/month) for unlimited fields and financial reports'}
                      {plan === 'starter' && 'Upgrade to Pro (R399/month) for AI Assistant and advanced analytics'}
                      {plan === 'pro' && 'You have access to all features. Consider Business for team collaboration.'}
                      {plan === 'business' && 'You have access to all features.'}
                    </p>
                  </div>
                  <Link href="/subscription">
                    <Button className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs h-8 shadow-sm">
                      {plan === 'free' ? 'View Plans & Upgrade' : 'Manage Subscription'}
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Password Change Section - WORKING */}
              <div className="space-y-3 pt-2">
                <p className="text-sm font-medium text-gray-700">Change Password</p>
                
                {/* Password message */}
                {passwordMessage && (
                  <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
                    passwordMessage.type === 'success' 
                      ? 'bg-green-50 text-green-700 border border-green-200' 
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {passwordMessage.type === 'success' ? (
                      <CheckCircle size={16} className="flex-shrink-0" />
                    ) : (
                      <AlertCircle size={16} className="flex-shrink-0" />
                    )}
                    {passwordMessage.text}
                  </div>
                )}

                <div className="space-y-2">
                  {/* Current Password */}
                  <div className="relative">
                    <Input
                      type={showCurrentPassword ? 'text' : 'password'}
                      placeholder="Current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="border-gray-200 focus:border-[#2D6A4F] focus:ring-[#2D6A4F] pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* New Password */}
                  <div className="relative">
                    <Input
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="New password (min 8 characters)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="border-gray-200 focus:border-[#2D6A4F] focus:ring-[#2D6A4F] pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Confirm Password */}
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="border-gray-200 focus:border-[#2D6A4F] focus:ring-[#2D6A4F] pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Password strength indicator */}
                  {newPassword && newPassword.length > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            newPassword.length < 6 ? 'bg-red-500' :
                            newPassword.length < 8 ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${Math.min((newPassword.length / 12) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400">
                        {newPassword.length < 6 ? 'Weak' :
                         newPassword.length < 8 ? 'Fair' :
                         'Strong'}
                      </span>
                    </div>
                  )}
                </div>

                <Button
                  className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white shadow-sm"
                  onClick={handleUpdatePassword}
                  disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword || newPassword.length < 8}
                >
                  {passwordLoading ? (
                    <><RefreshCw size={14} className="mr-2 animate-spin" /> Updating...</>
                  ) : (
                    'Update Password'
                  )}
                </Button>
              </div>

              {/* Danger Zone */}
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm font-medium text-red-500 mb-2">Danger Zone</p>
                
                {!showDeleteConfirm ? (
                  <Button 
                    variant="outline" 
                    className="border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 text-sm"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    Delete Account
                  </Button>
                ) : (
                  <div className="space-y-3 p-4 bg-red-50 rounded-xl border border-red-200">
                    <p className="text-sm font-semibold text-red-700">Are you sure you want to delete your account?</p>
                    <p className="text-xs text-red-600">
                      This action <strong>cannot be undone</strong>. All your data will be permanently deleted.
                    </p>
                    <div className="space-y-2">
                      <Label className="text-xs text-red-600">Type "DELETE" to confirm</Label>
                      <Input
                        placeholder='Type "DELETE"'
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        className="border-red-300 focus:border-red-500 focus:ring-red-500 text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        className="bg-red-600 hover:bg-red-700 text-white text-sm"
                        onClick={handleDeleteAccount}
                        disabled={deleteLoading || deleteConfirmText !== 'DELETE'}
                      >
                        {deleteLoading ? (
                          <><RefreshCw size={14} className="mr-2 animate-spin" /> Deleting...</>
                        ) : (
                          'Permanently Delete Account'
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        className="border-gray-300 text-gray-600 hover:bg-gray-50 text-sm"
                        onClick={() => {
                          setShowDeleteConfirm(false)
                          setDeleteConfirmText('')
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
                
                <p className="text-xs text-gray-400 mt-2">
                  This action cannot be undone. All your data will be permanently deleted.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}