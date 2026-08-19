import Link from "next/link";

export default function PortalHeader({
  action,
}: {
  action?: React.ReactNode;
}) {
  return (
    <header className="border-b border-black/5 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-red text-xs font-bold text-white">
            MTG
          </span>
          <span className="text-sm font-semibold text-brand-navy">
            Portal Kandidat
          </span>
        </Link>
        {action}
      </div>
    </header>
  );
}
