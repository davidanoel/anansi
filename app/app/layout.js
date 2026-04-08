import './globals.css'
import AuthProvider from '../components/AuthProvider'

export const metadata = {
  title: 'Spice — Real-World Asset Tokenization',
  description: 'Tokenize Caribbean commodities. Trade nutmeg, cocoa, and more on the blockchain.',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-anansi-cream text-anansi-black min-h-screen antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
