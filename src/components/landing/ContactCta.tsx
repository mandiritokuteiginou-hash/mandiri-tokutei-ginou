"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { SECTORS } from "@/lib/data";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import Spinner from "@/components/ui/Spinner";

export default function ContactCta() {
  const { showToast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const formOpenedAt = useRef<number | null>(null);

  useEffect(() => {
    formOpenedAt.current = Date.now();
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const form = new FormData(e.currentTarget);

    // Anti-spam: a hidden field only a bot would fill, and a minimum time
    // a human needs to read and fill the form. Bots that trip either check
    // see a fake success instead of a hint their submission was rejected.
    const honeypot = String(form.get("company") ?? "").trim();
    const filledTooFast =
      formOpenedAt.current === null || Date.now() - formOpenedAt.current < 1500;
    if (honeypot || filledTooFast) {
      setSubmitted(true);
      return;
    }

    setSubmitting(true);

    const namaLengkap = String(form.get("name") ?? "").trim();
    const nomorHp = String(form.get("phone") ?? "").trim();
    const sektor = String(form.get("sector") ?? "");

    const supabase = createClient();
    const { error: insertError } = await supabase.from("cpmi_registrations").insert({
      nama_lengkap: namaLengkap,
      nomor_hp: nomorHp,
      sektor_minat: [sektor],
    });

    setSubmitting(false);

    if (insertError) {
      // Duplicate WhatsApp number: this person already has a record in our
      // system (an earlier lead or a full account) — treat it as success
      // rather than showing a confusing constraint error.
      if (insertError.code === "23505") {
        setSubmitted(true);
        return;
      }
      setError("Gagal mengirim data: " + insertError.message);
      showToast("Gagal mengirim data. Silakan coba lagi.", "error");
      return;
    }

    setSubmitted(true);
  }

  return (
    <section id="kontak" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 scroll-mt-16">
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
              <input
                type="text"
                name="company"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="absolute -left-[9999px] h-0 w-0 opacity-0"
              />
              <div>
                <label className="text-xs font-medium text-neutral-600" htmlFor="cta-name">
                  Nama Lengkap
                </label>
                <input
                  id="cta-name"
                  name="name"
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
                  name="phone"
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
                  name="sector"
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

              {error && <p className="text-sm text-brand-red">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-navy px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-navy-dark disabled:opacity-60"
              >
                {submitting && <Spinner className="h-4 w-4" />}
                {submitting ? "Mengirim..." : "Kirim & Konsultasi Gratis"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
