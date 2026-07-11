import Link from 'next/link'
import { XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function CancelPage() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-6">
      <Card className="w-full max-w-md shadow-lg text-center">
        <CardContent className="pt-12 pb-10 px-8">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle size={32} className="text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Payment Cancelled</h1>
          <p className="text-gray-500 text-sm mb-8">
            No payment was taken. You can upgrade anytime from your settings.
            Your free account remains active.
          </p>
          <Link href="/dashboard">
            <Button className="w-full bg-[#2D6A4F] hover:bg-[#1B4332] text-white">
              Back to Dashboard
            </Button>
          </Link>
          <Link href="/subscription">
            <Button variant="outline" className="w-full mt-3 border-[#2D6A4F] text-[#2D6A4F]">
              Try Again
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
