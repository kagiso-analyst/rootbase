'use client'

import { useState } from 'react'
import { Save, User, Bell, Shield, Palette, Import } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function SettingsPage() {
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

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1B4332]">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">
          Manage your account and farm preferences
        </p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="bg-[#D8F3DC] flex flex-wrap gap-1">
          <TabsTrigger value="profile" className="data-[state=active]:bg-[#2D6A4F] data-[state=active]:text-white">
            <User size={14} className="mr-1.5" /> Profile
          </TabsTrigger>
          <TabsTrigger value="farm" className="data-[state=active]:bg-[#2D6A4F] data-[state=active]:text-white">
            <Palette size={14} className="mr-1.5" /> Farm
          </TabsTrigger>
          <TabsTrigger value="import" className="data-[state=active]:bg-[#2D6A4F] data-[state=active]:text-white">
            <Import size={14} className="mr-1.5" /> Import Data
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-[#2D6A4F] data-[state=active]:text-white">
            <Bell size={14} className="mr-1.5" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="account" className="data-[state=active]:bg-[#2D6A4F] data-[state=active]:text-white">
            <Shield size={14} className="mr-1.5" /> Account
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    placeholder="Your full name"
                    value={fullName}
                    onChange={(e) => setFullName((e.target as HTMLInputElement).value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input
                    placeholder="e.g. 071 234 5678"
                    value={phone}
                    onChange={(e) => setPhone((e.target as HTMLInputElement).value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail((e.target as HTMLInputElement).value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select value={language} onValueChange={(val) => setLanguage(val ?? 'en')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="af">Afrikaans</SelectItem>
                      <SelectItem value="zu">Zulu</SelectItem>
                      <SelectItem value="xh">Xhosa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={currency} onValueChange={(val) => setCurrency(val ?? 'ZAR')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
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
                className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white"
                onClick={handleSave}
              >
                <Save size={15} className="mr-2" />
                {saved ? 'Saved!' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="farm" className="mt-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Farm Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Farm Name</Label>
                <Input
                  placeholder="e.g. Shammah Family Farm"
                  value={farmName}
                  onChange={(e) => setFarmName((e.target as HTMLInputElement).value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Province</Label>
                  <Select value={province} onValueChange={(val) => setProvince(val ?? '')}>
                    <SelectTrigger><SelectValue placeholder="Select province..." /></SelectTrigger>
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
                  <Label>Farm Type</Label>
                  <Select value={farmType} onValueChange={(val) => setFarmType(val ?? '')}>
                    <SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger>
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
                <Label>Total Farm Size (hectares)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 50"
                  value={totalHectares}
                  onChange={(e) => setTotalHectares((e.target as HTMLInputElement).value)}
                />
              </div>
              <Button
                className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white"
                onClick={handleSave}
              >
                <Save size={15} className="mr-2" />
                {saved ? 'Saved!' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import" className="mt-4 space-y-4">
          <Card className="shadow-sm border-orange-200 bg-orange-50">
            <CardContent className="py-4 px-5">
              <p className="text-sm font-semibold text-orange-700 mb-1">⚠️ Important — Read Before Importing</p>
              <p className="text-xs text-orange-600">
                Historical data is kept completely separate from your current operations.
                All imports are tagged with their original date so they appear correctly in reports
                but do not interfere with your live farm data. You can filter reports by date range
                to view historical vs current data separately.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Import Historical Farm Records</CardTitle>
              <p className="text-xs text-gray-400">
                Add records from before you joined RootBase. Each module accepts any past date.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    year: '2023',
                    modules: ['Finances', 'Crops', 'Livestock', 'Journal'],
                    status: 'Ready to import'
                  },
                  {
                    year: '2024',
                    modules: ['Finances', 'Crops', 'Livestock', 'Equipment', 'Journal'],
                    status: 'Ready to import'
                  },
                  {
                    year: '2025',
                    modules: ['All modules'],
                    status: 'Ready to import'
                  },
                ].map(({ year, modules, status }) => (
                  <div key={year} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-[#1B4332]">{year} Records</p>
                      <Badge className="bg-[#D8F3DC] text-[#2D6A4F] text-xs">{status}</Badge>
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

              <div className="mt-4 p-4 bg-[#D8F3DC] rounded-xl">
                <p className="text-sm font-semibold text-[#1B4332] mb-2">How it works</p>
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
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: 'Task due date reminders', desc: 'Get notified when tasks are due' },
                { label: 'Low stock alerts', desc: 'Alert when inventory falls below reorder level' },
                { label: 'Equipment service reminders', desc: 'Alert when service is due' },
                { label: 'Document expiry warnings', desc: 'Alert 30 days before documents expire' },
                { label: 'Weekly farm summary', desc: 'Receive a weekly summary of your farm activity' },
              ].map(({ label, desc }) => (
                <div key={label} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{label}</p>
                    <p className="text-xs text-gray-400">{desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-[#2D6A4F] peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
                  </label>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="mt-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Account & Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-[#D8F3DC] rounded-lg">
                <p className="text-sm font-medium text-[#1B4332]">Subscription: Free Plan</p>
                <p className="text-xs text-[#2D6A4F] mt-1">
                  Upgrade to Starter (R199/month) for unlimited fields and financial reports
                </p>
                <Link href="/subscription">
                  <Button className="mt-3 bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs h-8">
                    View Plans & Upgrade
                  </Button>
                </Link>
              </div>

              <div className="space-y-3 pt-2">
                <p className="text-sm font-medium text-gray-700">Change Password</p>
                <Input type="password" placeholder="Current password" />
                <Input type="password" placeholder="New password" />
                <Input type="password" placeholder="Confirm new password" />
                <Button variant="outline" className="border-[#2D6A4F] text-[#2D6A4F]">
                  Update Password
                </Button>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <p className="text-sm font-medium text-red-500 mb-2">Danger Zone</p>
                <Button variant="outline" className="border-red-200 text-red-500 hover:bg-red-50 text-sm">
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}