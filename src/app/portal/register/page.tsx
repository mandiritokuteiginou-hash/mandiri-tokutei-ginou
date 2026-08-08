"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PortalHeader from "@/components/portal/PortalHeader";
import { SECTORS } from "@/lib/data";
import { Sector } from "@/lib/types";
import { findCandidate, saveCandidate, setCandidateSession } from "@/lib/storage";

const DEFAULT_DOCUMENTS = [
  "KTP / Paspor",
  "Ijazah Terakhir",
  "Surat Keterangan Sehat",
  "Pas Foto",
];

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email")).trim().toLowerCase();

    if (findCandidate(email)) {
      setError("Email ini sudah terdaftar. Silakan masuk lewat halaman login.");
      return;
    }

    saveCandidate({
      fullName: String(form.get("fullName")),
      email,
      phone: String(form.get("phone")),
      sectorInterest: String(form.get("sectorInterest")) as Sector,
      status: "Berkas Diverifikasi",
      documents: DEFAULT_DOCUMENTS.map((name) => ({ name, uploaded: false })),
      createdAt: new Date().toISOString(),
    });

    setCandidateSession(email);
    router.push("/portal/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col bg-brand-cream">
      <PortalHeader
        action={
          <Link
            href="/portal/login"
            className="text-sm font-medium text-brand-navy hover:text-brand-red"
          >
            Sudah punya akun? Masuk
          </Link>
        }
      />

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
        <h1 className="text-2xl font-bold text-brand-navy">
          Daftar sebagai Kandidat
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          Lengkapi data diri untuk memulai proses pendaftaran program Tokutei
          Ginou.
        </p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-xs font-medium text-neutral-600" htmlFor="fullName">
              Nama Lengkap
            </label>
            <input
              id="fullName"
              name="fullName"
              required
              type="text"
              className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand-red"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-600" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              required
              type="email"
              className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand-red"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-600" htmlFor="phone">
              Nomor WhatsApp
            </label>
            <input
              id="phone"
              name="phone"
              required
              type="tel"
              className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand-red"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-600" htmlFor="sectorInterest">
              Sektor Diminati
            </label>
            <select
              id="sectorInterest"
              name="sectorInterest"
              required
              defaultValue=""
              className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand-red"
            >
              <option value="" disabled>
                Pilih sektor
              </option>
              {SECTORS.map((sector) => (
                <option key={sector} value={sector}>
                  {sector}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-600" htmlFor="password">
              Kata Sandi
            </label>
            <input
              id="password"
              name="password"
              required
              minLength={6}
              type="password"
              className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand-red"
            />
          </div>

          {error && <p className="text-sm text-brand-red">{error}</p>}

          <button
            type="submit"
            className="w-full rounded-lg bg-brand-red px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-red-dark"
          >
            Buat Akun & Daftar
          </button>
        </form>
      </main>
    </div>
  );
}
