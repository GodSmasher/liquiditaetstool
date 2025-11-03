import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Liquiditätstool - Dashboard',
  description: '14-Tage Liquiditätsprognose für dein Unternehmen',
  keywords: ['Liquidität', 'Cashflow', 'Finanzen', 'Dashboard'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}