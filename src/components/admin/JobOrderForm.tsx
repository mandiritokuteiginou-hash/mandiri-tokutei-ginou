"use client";

import { FormEvent, useState } from "react";
import { SECTORS } from "@/lib/data";
import { JobOrder } from "@/lib/types";

export interface JobOrderFormValues {
  nama_perusahaan: string;
  sektor: string;
  lokasi_prefektur: string;
  deskripsi_kerja: string;
  syarat: string;
  estimasi_gaji: string;
  durasi_kontrak: string;
  status_aktif: boolean;
}

export default function JobOrderForm({
  initial,
  submitting,
  error,
  onSubmit,
  onCancel,
}: {
  initial: JobOrder | null;
  submitting: boolean;
  error: string;
  onSubmit: (values: JobOrderFormValues) => void;
  onCancel: () => void;
}) {
  const [statusAktif, setStatusAktif] = useState(initial?.status_aktif ?? true);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    onSubmit({
      nama_perusahaan: String(form.get("nama_perusahaan")),
      sektor: String(form.get("sektor")),
      lokasi_prefektur: String(form.get("lokasi_prefektur")),
      deskripsi_kerja: String(form.get("deskripsi_kerja") ?? ""),
      syarat: String(form.get("syarat") ?? ""),
      estimasi_gaji: String(form.get("estimasi_gaji") ?? ""),
      durasi_kontrak: String(form.get("durasi_kontrak") ?? ""),
      status_aktif: statusAktif,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 space-y-4 rounded-xl border border-black/10 bg-neutral-50 p-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-neutral-600" htmlFor="nama_perusahaan">
            Nama Perusahaan
          </label>
          <input
            id="nama_perusahaan"
            name="nama_perusahaan"
            required
            defaultValue={initial?.nama_perusahaan}
            className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand-red"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-neutral-600" htmlFor="sektor">
            Sektor
          </label>
          <select
            id="sektor"
            name="sektor"
            required
            defaultValue={initial?.sektor ?? ""}
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
          <label className="text-xs font-medium text-neutral-600" htmlFor="lokasi_prefektur">
            Lokasi (Prefektur)
          </label>
          <input
            id="lokasi_prefektur"
            name="lokasi_prefektur"
            required
            defaultValue={initial?.lokasi_prefektur}
            className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand-red"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-neutral-600" htmlFor="estimasi_gaji">
            Estimasi Gaji
          </label>
          <input
            id="estimasi_gaji"
            name="estimasi_gaji"
            defaultValue={initial?.estimasi_gaji ?? ""}
            placeholder="¥180.000 - ¥210.000 / bulan"
            className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand-red"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-neutral-600" htmlFor="durasi_kontrak">
            Durasi Kontrak
          </label>
          <input
            id="durasi_kontrak"
            name="durasi_kontrak"
            defaultValue={initial?.durasi_kontrak ?? ""}
            placeholder="3 tahun (dapat diperpanjang)"
            className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand-red"
          />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={statusAktif}
              onChange={(e) => setStatusAktif(e.target.checked)}
              className="h-4 w-4 rounded border-black/20"
            />
            Lowongan aktif
          </label>
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-neutral-600" htmlFor="deskripsi_kerja">
          Deskripsi Kerja
        </label>
        <textarea
          id="deskripsi_kerja"
          name="deskripsi_kerja"
          rows={2}
          defaultValue={initial?.deskripsi_kerja ?? ""}
          className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand-red"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-neutral-600" htmlFor="syarat">
          Syarat (pisahkan dengan titik koma &ldquo;;&rdquo;)
        </label>
        <textarea
          id="syarat"
          name="syarat"
          rows={2}
          defaultValue={initial?.syarat ?? ""}
          placeholder="Usia 19-35 tahun; Sehat jasmani & rohani"
          className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand-red"
        />
      </div>

      {error && <p className="text-sm text-brand-red">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-brand-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-navy-dark disabled:opacity-60"
        >
          {submitting ? "Menyimpan..." : initial ? "Simpan Perubahan" : "Tambah Lowongan"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-black/10 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
        >
          Batal
        </button>
      </div>
    </form>
  );
}
