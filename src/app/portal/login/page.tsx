"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PortalHeader from "@/components/portal/PortalHeader";
import { findCandidate, setCandidateSession } from "@/lib/storage";

export default function PortalLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email")).trim().toLowerCase();

    const candidate = findCandidate(email);
    if (!candidate) {
      setError("Akun tidak ditemukan. Silakan daftar terlebih dahulu.");
      return;
    }

    setCandidateSession(email);
    router.push("/portal/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col bg-brand-cream">
      <PortalHeader
        action={
          <Link
            href="/portal/register"
            className="text-sm font-medium text-brand-navy hover:text-brand-red"
          >
            Belum punya akun? Daftar
          </Link>
        }
      />

      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-12">
        <h1 className="text-2xl font-bold text-brand-navy">Masuk Portal Kandidat</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Pantau status pendaftaran dan progres dokumen Anda.
        </p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
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
            <label className="text-xs font-medium text-neutral-600" htmlFor="password">
              Kata Sandi
            </label>
            <input
              id="password"
              name="password"
              required
              type="password"
              className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand-red"
            />
          </div>

          {error && <p className="text-sm text-brand-red">{error}</p>}

          <button
            type="submit"
            className="w-full rounded-lg bg-brand-red px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-red-dark"
          >
            Masuk
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-neutral-400">
          Demo: data disimpan lokal di browser Anda (belum terhubung basis
          data server).
        </p>
      </main>
    </div>
  );
}
