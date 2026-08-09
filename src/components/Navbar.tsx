"use client";

import Link from "next/link";
import { useState } from "react";

const NAV_LINKS = [
  { href: "#program", label: "Program" },
  { href: "#layanan", label: "Layanan" },
  { href: "#lowongan", label: "Lowongan" },
  { href: "#testimoni", label: "Testimoni" },
  { href: "/artikel", label: "Artikel" },
  { href: "/materi-belajar", label: "Materi Belajar" },
  { href: "#faq", label: "FAQ" },
  { href: "#kontak", label: "Kontak" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-red text-sm font-bold text-white">
            MTG
          </span>
          <span className="text-sm font-semibold leading-tight text-brand-navy sm:text-base">
            Mandiri
            <br className="sm:hidden" /> Tokutei Ginou
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-neutral-700 transition hover:text-brand-red"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/portal/login"
            className="text-sm font-medium text-brand-navy hover:text-brand-red"
          >
            Masuk Portal
          </Link>
          <a
            href="#kontak"
            className="rounded-full bg-brand-red px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-red-dark"
          >
            Daftar Sekarang
          </a>
        </div>

        <button
          type="button"
          aria-label={open ? "Tutup menu" : "Buka menu"}
          aria-expanded={open}
          aria-controls="mobile-nav-menu"
          className="flex h-9 w-9 items-center justify-center rounded-md border border-black/10 md:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          <div className="space-y-1">
            <span className="block h-0.5 w-5 bg-brand-navy" />
            <span className="block h-0.5 w-5 bg-brand-navy" />
            <span className="block h-0.5 w-5 bg-brand-navy" />
          </div>
        </button>
      </div>

      {open && (
        <div id="mobile-nav-menu" className="border-t border-black/5 bg-white px-4 pb-4 md:hidden">
          <nav className="flex flex-col gap-3 pt-3">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-neutral-700"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/portal/login"
              className="text-sm font-medium text-brand-navy"
              onClick={() => setOpen(false)}
            >
              Masuk Portal
            </Link>
            <a
              href="#kontak"
              className="rounded-full bg-brand-red px-4 py-2 text-center text-sm font-semibold text-white"
              onClick={() => setOpen(false)}
            >
              Daftar Sekarang
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
