import './globals.css'
import AuthProvider from '../components/AuthProvider'

export const metadata = {
  title: 'Spice — By Anansi',
  description: 'Real-world asset tokenization for the Caribbean.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-anansi-cream text-anansi-black min-h-screen">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
