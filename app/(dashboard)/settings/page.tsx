// app/(dashboard)/settings/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { Save, User, Bell, Shield, Palette, Import, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
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

export default function SettingsPage() {
  const supabase = createClient()
  const { currentFarm, refreshFarms, loading: farmLoading } = useFarm()
  
  // ===== STATE =====
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [farmName, setFarmName] = useState('')
  const [province, setProvince] = useState('')
  const [farmType, setFarmType] = useState('')
  const [totalHectares, setTotalHectares] = useState('')
  const [currency, setCurrency] = useState('ZAR')
  const [language, setLanguage] = useState('en')
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // ===== LOAD DATA =====
  useEffect(() => {
  async function loadData() {
    setLoadingProfile(true)
    setError(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setUser(null)
        setLoadingProfile(false)
        return
      }
      
      setUser(user)

      // Load user profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, email, phone, avatar_url')
        .eq('user_id', user.id)
        .single()

      // Only log errors that aren't "table doesn't exist" or "no rows"
      if (profileError && profileError.code !== 'PGRST116' && profileError.code !== '42P01') {
        console.error('Profile fetch error:', profileError)
      }
      
      if (profile) {
        setFullName(profile.full_name || '')
        setEmail(profile.email || '')
        setPhone(profile.phone || '')
      } else {
        // Fallback to user metadata if profile doesn't exist
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
  }

  loadData()
}, [supabase, currentFarm])


  // ===== SAVE PROFILE =====
  async function handleProfileSave() {
    setLoading(true)
    setSaved(false)
    setSaveMessage(null)
    setError(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setSaveMessage({ type: 'error', text: 'You must be logged in to save settings' })
        setLoading(false)
        return
      }

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

      setSaved(true)
      setSaveMessage({ type: 'success', text: 'Profile saved successfully!' })
      
    } catch (err) {
      console.error('Profile save error:', err)
      setSaveMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save profile' })
    } finally {
      setLoading(false)
      setTimeout(() => setSaveMessage(null), 3000)
    }
  }

  // ===== SAVE FARM =====
  async function handleFarmSave() {
    setLoading(true)
    setSaved(false)
    setSaveMessage(null)
    setError(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
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
        .single()

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

      setSaved(true)
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

  // ===== LOADING STATE =====
  if (farmLoading || loadingProfile) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#2D6A4F] border-t-transparent mx-auto mb-3"></div>
          <p className="text-sm text-gray-400">{farmLoading ? 'Loading farms...' : 'Loading settings...'}</p>
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
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[#1B4332]">Settings</h1>
          {currentFarm && (
            <Badge className="bg-[#D8F3DC] text-[#2D6A4F] text-xs font-medium">
              ⚙️ {currentFarm.name}
            </Badge>
          )}
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

        <TabsContent value="profile" className="mt-4">
          <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-base font-semibold text-gray-700">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
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
              <div className="grid grid-cols-2 gap-4">
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
              <div className="grid grid-cols-2 gap-4">
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

        <TabsContent value="import" className="mt-4 space-y-4">
          <Card className="shadow-sm border-orange-200 bg-gradient-to-br from-orange-50 to-white">
            <CardContent className="py-4 px-5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-orange-500 text-lg">⚠️</span>
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
              ].map(({ label, desc, default: defaultChecked }) => (
                <div key={label} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 px-2 rounded-lg transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{label}</p>
                    <p className="text-xs text-gray-400">{desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked={defaultChecked} />
                    <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-[#2D6A4F] peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all shadow-inner" />
                  </label>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="mt-4">
          <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-base font-semibold text-gray-700">Account & Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="p-4 bg-gradient-to-br from-[#D8F3DC] to-white rounded-xl border border-[#52B788]/20">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#1B4332]">Subscription: Free Plan</p>
                    <p className="text-xs text-[#2D6A4F] mt-1 max-w-md">
                      Upgrade to Starter (R199/month) for unlimited fields and financial reports
                    </p>
                  </div>
                  <Link href="/subscription">
                    <Button className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs h-8 shadow-sm">
                      View Plans & Upgrade
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <p className="text-sm font-medium text-gray-700">Change Password</p>
                <div className="space-y-2">
                  <Input type="password" placeholder="Current password" className="border-gray-200 focus:border-[#2D6A4F] focus:ring-[#2D6A4F]" />
                  <Input type="password" placeholder="New password" className="border-gray-200 focus:border-[#2D6A4F] focus:ring-[#2D6A4F]" />
                  <Input type="password" placeholder="Confirm new password" className="border-gray-200 focus:border-[#2D6A4F] focus:ring-[#2D6A4F]" />
                </div>
                <Button variant="outline" className="border-[#2D6A4F] text-[#2D6A4F] hover:bg-[#D8F3DC]">
                  Update Password
                </Button>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm font-medium text-red-500 mb-2">Danger Zone</p>
                <Button variant="outline" className="border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 text-sm">
                  Delete Account
                </Button>
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