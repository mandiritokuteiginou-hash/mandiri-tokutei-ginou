"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PortalHeader from "@/components/portal/PortalHeader";
import Spinner from "@/components/ui/Spinner";
import { SECTORS } from "@/lib/data";
import { createClient } from "@/lib/supabase/client";
import { ensureCpmiRegistration } from "@/lib/supabase/cpmi";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [checkEmail, setCheckEmail] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email")).trim().toLowerCase();
    const password = String(form.get("password"));
    const fullName = String(form.get("fullName"));
    const phone = String(form.get("phone"));
    const sectorInterest = String(form.get("sectorInterest"));
    const tanggalLahir = String(form.get("tanggalLahir"));
    const alamatDomisili = String(form.get("alamatDomisili"));
    const pendidikanTerakhir = String(form.get("pendidikanTerakhir"));
    const nik = String(form.get("nik") ?? "").trim();
    const pengalamanKerja = String(form.get("pengalamanKerja") ?? "").trim();

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nama_lengkap: fullName,
          nomor_hp: phone,
          sektor_minat: [sectorInterest],
          tanggal_lahir: tanggalLahir,
          alamat_domisili: alamatDomisili,
          pendidikan_terakhir: pendidikanTerakhir,
          nik: nik || null,
          pengalaman_kerja: pengalamanKerja || null,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setSubmitting(false);
      return;
    }

    if (data.session && data.user) {
      try {
        await ensureCpmiRegistration(supabase, data.user);
        router.push("/portal/dashboard");
        return;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal membuat pendaftaran.");
        setSubmitting(false);
        return;
      }
    }

    // Email confirmation required before a session is issued.
    setCheckEmail(true);
    setSubmitting(false);
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

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-12">
        {checkEmail ? (
          <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
            <span className="text-4xl">📩</span>
            <h1 className="mt-3 text-xl font-bold text-brand-navy">
              Cek Email Anda
            </h1>
            <p className="mt-2 text-sm text-neutral-600">
              Kami telah mengirim link konfirmasi ke email Anda. Setelah
              dikonfirmasi, silakan masuk melalui halaman login.
            </p>
            <Link
              href="/portal/login"
              className="mt-5 inline-block rounded-lg bg-brand-red px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-red-dark"
            >
              Ke Halaman Login
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-brand-navy">
              Daftar sebagai Kandidat
            </h1>
            <p className="mt-2 text-sm text-neutral-600">
              Lengkapi data diri untuk memulai proses pendaftaran program
              Tokutei Ginou.
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
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-neutral-600" htmlFor="tanggalLahir">
                    Tanggal Lahir
                  </label>
                  <input
                    id="tanggalLahir"
                    name="tanggalLahir"
                    required
                    type="date"
                    className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand-red"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-600" htmlFor="pendidikanTerakhir">
                    Pendidikan Terakhir
                  </label>
                  <select
                    id="pendidikanTerakhir"
                    name="pendidikanTerakhir"
                    required
                    defaultValue=""
                    className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand-red"
                  >
                    <option value="" disabled>
                      Pilih jenjang
                    </option>
                    <option value="SD">SD</option>
                    <option value="SMP">SMP</option>
                    <option value="SMA/SMK">SMA/SMK</option>
                    <option value="D3">D3</option>
                    <option value="S1">S1</option>
                    <option value="S2 atau lebih tinggi">S2 atau lebih tinggi</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-600" htmlFor="alamatDomisili">
                  Alamat Domisili
                </label>
                <textarea
                  id="alamatDomisili"
                  name="alamatDomisili"
                  required
                  rows={2}
                  placeholder="Alamat lengkap sesuai domisili saat ini"
                  className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand-red"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-600" htmlFor="nik">
                  NIK (opsional, bisa dilengkapi nanti bersama unggah KTP)
                </label>
                <input
                  id="nik"
                  name="nik"
                  type="text"
                  inputMode="numeric"
                  maxLength={16}
                  placeholder="16 digit sesuai KTP"
                  className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand-red"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-600" htmlFor="pengalamanKerja">
                  Pengalaman Kerja (opsional)
                </label>
                <textarea
                  id="pengalamanKerja"
                  name="pengalamanKerja"
                  rows={2}
                  placeholder="Ringkas pengalaman kerja yang relevan, jika ada"
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
                  minLength={6}
                  type="password"
                  className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand-red"
                />
              </div>

              {error && <p className="text-sm text-brand-red">{error}</p>}

              <p className="text-xs text-neutral-500">
                Dengan mendaftar, Anda menyetujui{" "}
                <Link href="/syarat-ketentuan" className="font-medium text-brand-red hover:text-brand-red-dark">
                  Syarat &amp; Ketentuan
                </Link>{" "}
                dan{" "}
                <Link href="/kebijakan-privasi" className="font-medium text-brand-red hover:text-brand-red-dark">
                  Kebijakan Privasi
                </Link>{" "}
                kami.
              </p>

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-red px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-red-dark disabled:opacity-60"
              >
                {submitting && <Spinner className="h-4 w-4" />}
                {submitting ? "Memproses..." : "Buat Akun & Daftar"}
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
