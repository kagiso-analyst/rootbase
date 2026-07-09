import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-6">
      <Card className="w-full max-w-md shadow-lg text-center">
        <CardContent className="pt-12 pb-10 px-8">
          <div className="w-16 h-16 bg-[#D8F3DC] rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={32} className="text-[#2D6A4F]" />
          </div>
          <h1 className="text-2xl font-bold text-[#1B4332] mb-2">Payment Successful!</h1>
          <p className="text-gray-500 text-sm mb-8">
            Welcome to RootBase! Your subscription is now active. 
            Your farm data is safe and your account has been upgraded.
          </p>
          <Link href="/dashboard">
            <Button className="w-full bg-[#2D6A4F] hover:bg-[#1B4332] text-white">
              Go to My Dashboard
            </Button>
          </Link>
          <p className="text-xs text-gray-400 mt-4">
            You will receive a confirmation email shortly
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
