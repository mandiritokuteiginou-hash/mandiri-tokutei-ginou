"use client";

import { FormEvent, useState } from "react";
import { SECTORS } from "@/lib/data";

export default function ContactCta() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="grid gap-10 rounded-3xl bg-brand-red px-6 py-12 text-white sm:px-10 md:grid-cols-2 md:items-center">
        <div>
          <h2 className="text-2xl font-bold sm:text-3xl">
            Siap Memulai Perjalanan Karier di Jepang?
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-white/90 sm:text-base">
            Isi formulir minat di samping, tim kami akan menghubungi Anda
            untuk konsultasi gratis dan menjelaskan sektor kerja yang paling
            sesuai dengan profil Anda.
          </p>
          <div className="mt-6 space-y-1 text-sm text-white/90">
            <p>📍 Jl. Sudirman No. 123, Jakarta Selatan</p>
            <p>📱 +62 812-3456-7890 (WhatsApp)</p>
            <p>✉️ info@mandiritokuteiginou.id</p>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 text-neutral-900 sm:p-8">
          {submitted ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
              <span className="text-4xl">✅</span>
              <h3 className="text-lg font-semibold text-brand-navy">
                Terima kasih!
              </h3>
              <p className="text-sm text-neutral-600">
                Data Anda sudah kami terima. Tim kami akan menghubungi Anda
                dalam 1x24 jam kerja.
              </p>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="text-xs font-medium text-neutral-600" htmlFor="cta-name">
                  Nama Lengkap
                </label>
                <input
                  id="cta-name"
                  required
                  type="text"
                  className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-red"
                  placeholder="Nama sesuai KTP"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-600" htmlFor="cta-phone">
                  Nomor WhatsApp
                </label>
                <input
                  id="cta-phone"
                  required
                  type="tel"
                  className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-red"
                  placeholder="08xxxxxxxxxx"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-600" htmlFor="cta-sector">
                  Sektor Diminati
                </label>
                <select
                  id="cta-sector"
                  required
                  defaultValue=""
                  className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-red"
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
              <button
                type="submit"
                className="w-full rounded-lg bg-brand-navy px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-navy-dark"
              >
                Kirim & Konsultasi Gratis
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
