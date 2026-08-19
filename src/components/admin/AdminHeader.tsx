import Link from "next/link";

export default function AdminHeader({ action }: { action?: React.ReactNode }) {
  return (
    <header className="border-b border-white/10 bg-brand-navy-dark">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-red text-xs font-bold text-white">
            MTG
          </span>
          <span className="text-sm font-semibold text-white">Admin Panel</span>
        </Link>
        {action}
      </div>
    </header>
  );
}
