import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-anansi-border mt-24">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <span className="font-bold text-lg tracking-tight">ANANSI</span>
            <p className="text-anansi-gray text-sm mt-2">
              Caribbean intelligence, global reach.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Products</h4>
            <div className="space-y-2 text-sm text-anansi-gray">
              <Link href="/spice" className="block hover:text-anansi-black">Spice (RWA)</Link>
              <span className="block text-anansi-gray/50">CaribStone (Coming soon)</span>
              <span className="block text-anansi-gray/50">IslandPulse (Coming soon)</span>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Ecosystem</h4>
            <div className="space-y-2 text-sm text-anansi-gray">
              <Link href="/caribcoin" className="block hover:text-anansi-black">CaribCoin</Link>
              <a href="#" className="block hover:text-anansi-black">Documentation</a>
              <a href="https://github.com/anansi-tech" className="block hover:text-anansi-black">GitHub</a>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Company</h4>
            <div className="space-y-2 text-sm text-anansi-gray">
              <a href="mailto:hello@anansi.tech" className="block hover:text-anansi-black">Contact</a>
              <a href="https://x.com/anansitech" className="block hover:text-anansi-black">X / Twitter</a>
            </div>
          </div>
        </div>
        <div className="border-t border-anansi-border mt-10 pt-6 text-xs text-anansi-gray text-center">
          <p>© {new Date().getFullYear()} Anansi Technology Corporation. Miami, FL.</p>
          <p className="mt-1">CaribCoin does not promise returns. Participation is voluntary and involves risk.</p>
        </div>
      </div>
    </footer>
  )
}
