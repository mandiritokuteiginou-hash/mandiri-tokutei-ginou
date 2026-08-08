"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import Spinner from "@/components/ui/Spinner";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
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

    if (signInError || !data.user) {
      setError("Email atau kata sandi salah.");
      setSubmitting(false);
      return;
    }

    const { data: adminRow } = await supabase
      .from("admin_users")
      .select("id")
      .eq("id", data.user.id)
      .maybeSingle();

    if (!adminRow) {
      await supabase.auth.signOut();
      setError("Akun ini tidak memiliki akses admin.");
      setSubmitting(false);
      return;
    }

    router.push("/admin/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col bg-brand-navy">
      <AdminHeader />

      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-12">
        <div className="rounded-2xl bg-white p-8 shadow-xl">
          <h1 className="text-xl font-bold text-brand-navy">Login Admin</h1>
          <p className="mt-2 text-sm text-neutral-500">
            Akses khusus tim internal Mandiri Tokutei Ginou.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="text-xs font-medium text-neutral-600" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                required
                type="email"
                className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-red"
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
                className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-red"
              />
            </div>

            {error && <p className="text-sm text-brand-red">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-navy px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-navy-dark disabled:opacity-60"
            >
              {submitting && <Spinner className="h-4 w-4" />}
              {submitting ? "Memproses..." : "Masuk"}
            </button>
          </form>

          <p className="mt-6 rounded-lg bg-brand-cream p-3 text-center text-xs text-neutral-500">
            Akun admin dikelola secara internal (bukan self-registrasi).
          </p>
        </div>
      </main>
    </div>
  );
}
