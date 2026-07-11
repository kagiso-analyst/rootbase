import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'RootBase — Farm Management for African Farmers',
  description: 'The all-in-one digital farm manager built for African farmers. Track finances, crops, livestock, weather and tasks.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}