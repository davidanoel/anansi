import Image from "next/image";

export default function Footer() {
  return (
    <footer className="relative border-t border-anansi-line px-6 md:px-12 overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 0%, rgba(220,38,38,0.08) 0%, rgba(220,38,38,0.03) 20%, transparent 58%)",
        }}
      />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-anansi-red/55 to-transparent pointer-events-none" />
      <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-1 md:gap-1.5 relative">
        <div className="w-[142px] md:w-[176px] flex items-center justify-center shrink-0">
          <Image
            src="/brand/wordmark/anansi-wordmark-primary.svg"
            alt="Anansi"
            width={1916}
            height={821}
            className="w-full h-auto invert opacity-90 block translate-y-[5%]"
          />
        </div>
        <div className="flex gap-4 md:gap-5 items-center flex-wrap justify-center">
          <span className="text-[11px] text-white/38 tracking-wider">
            © {new Date().getFullYear()} Anansi Technology Corporation
          </span>
          <span className="text-[11px] text-white/32 tracking-wider">Miami, FL</span>
        </div>
      </div>
    </footer>
  );
}
