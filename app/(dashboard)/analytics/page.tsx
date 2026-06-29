import { BarChart2, TrendingUp, TrendingDown, Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const metrics = [
  { label: 'Total Income (Season)', value: 'R0.00', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
  { label: 'Total Expenses (Season)', value: 'R0.00', icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-50' },
  { label: 'Net Profit / Loss', value: 'R0.00', icon: BarChart2, color: 'text-[#2D6A4F]', bg: 'bg-[#D8F3DC]' },
]

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1B4332]">Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">
          Farm performance insights and reports
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {metrics.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="shadow-sm">
            <CardHeader className="pb-2">
              <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-2`}>
                <Icon size={18} className={color} />
              </div>
              <CardTitle className="text-xs text-gray-500">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-sm border-[#D8F3DC]">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-[#D8F3DC] flex items-center justify-center mb-4">
            <Info size={24} className="text-[#2D6A4F]" />
          </div>
          <p className="text-sm font-semibold text-[#1B4332]">Analytics coming in the next update</p>
          <p className="text-xs text-gray-400 mt-2 max-w-sm">
            Once you connect your finances, crops, and livestock to the database,
            this page will show charts, cost-per-hectare, crop profitability rankings,
            and season-over-season comparisons.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}