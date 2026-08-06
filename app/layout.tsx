// app/layout.tsx

import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'

export const metadata: Metadata = {
  title: 'RootBase — Farm Management for African Farmers',
  description: 'RootBase helps farmers manage crops, livestock, finances, weather, inventory, tasks, and subscriptions in one professional platform.',
  keywords: ['farm management', 'African agriculture', 'farm finance', 'crop tracking', 'livestock records', 'South Africa'],
  metadataBase: new URL('https://rootbase.vercel.app'),
  openGraph: {
    title: 'RootBase — Farm Management for African Farmers',
    description: 'Run your farm operations from one secure dashboard with tools for finance, weather, recording, and planning.',
    type: 'website',
    url: 'https://rootbase.vercel.app',
    siteName: 'RootBase',
    locale: 'en_ZA',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RootBase — Farm Management for African Farmers',
    description: 'Run your farm operations from one secure dashboard with tools for finance, weather, recording, and planning.',
  },
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
        <Toaster />
      </body>
    </html>
  )
}