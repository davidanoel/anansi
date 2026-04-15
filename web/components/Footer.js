import Image from "next/image";

export default function Footer() {
  return (
    <footer className="border-t border-anansi-line py-10 px-6 md:px-12">
      <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <Image src="/logo-dark.png" alt="Anansi" width={24} height={24} className="opacity-20" />
        <div className="flex gap-8 items-center">
          <span className="text-[11px] text-white/15 tracking-wider">
            © {new Date().getFullYear()} Anansi Technology Corporation
          </span>
          <span className="text-[11px] text-white/15 tracking-wider">Miami, FL</span>
        </div>
      </div>
    </footer>
  );
}
