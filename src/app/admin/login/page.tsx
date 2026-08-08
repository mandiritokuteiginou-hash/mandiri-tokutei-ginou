"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import { DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD } from "@/lib/admin";
import { setAdminSession } from "@/lib/storage";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email")).trim().toLowerCase();
    const password = String(form.get("password"));

    if (email !== DEMO_ADMIN_EMAIL || password !== DEMO_ADMIN_PASSWORD) {
      setError("Email atau kata sandi salah.");
      return;
    }

    setAdminSession(true);
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
              className="w-full rounded-lg bg-brand-navy px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-navy-dark"
            >
              Masuk
            </button>
          </form>

          <p className="mt-6 rounded-lg bg-brand-cream p-3 text-center text-xs text-neutral-500">
            Demo: {DEMO_ADMIN_EMAIL} / {DEMO_ADMIN_PASSWORD}
          </p>
        </div>
      </main>
    </div>
  );
}
