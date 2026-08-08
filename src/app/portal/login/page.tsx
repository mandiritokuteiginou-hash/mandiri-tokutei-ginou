"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PortalHeader from "@/components/portal/PortalHeader";
import Spinner from "@/components/ui/Spinner";
import { createClient } from "@/lib/supabase/client";
import { ensureCpmiRegistration } from "@/lib/supabase/cpmi";

export default function PortalLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email")).trim().toLowerCase();
    const password = String(form.get("password"));

    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError("Email atau kata sandi salah, atau akun belum dikonfirmasi.");
      setSubmitting(false);
      return;
    }

    try {
      await ensureCpmiRegistration(supabase, data.user);
      router.push("/portal/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data pendaftaran.");
      setSubmitting(false);
    }
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
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-red px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-red-dark disabled:opacity-60"
          >
            {submitting && <Spinner className="h-4 w-4" />}
            {submitting ? "Memproses..." : "Masuk"}
          </button>
        </form>
      </main>
    </div>
  );
}
