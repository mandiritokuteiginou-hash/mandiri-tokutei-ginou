"use client";

import { useMemo, useState } from "react";
import { JobOrder } from "@/lib/types";
import { SECTORS } from "@/lib/data";
import JobCard from "./JobCard";

export default function JobsBrowser({ jobs }: { jobs: JobOrder[] }) {
  const [query, setQuery] = useState("");
  const [sektor, setSektor] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return jobs.filter((job) => {
      const matchesSektor = !sektor || job.sektor === sektor;
      const matchesQuery =
        !q ||
        job.nama_perusahaan.toLowerCase().includes(q) ||
        job.lokasi_prefektur.toLowerCase().includes(q) ||
        (job.deskripsi_kerja ?? "").toLowerCase().includes(q);
      return matchesSektor && matchesQuery;
    });
  }, [jobs, query, sektor]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari posisi, perusahaan, atau lokasi..."
          className="w-full rounded-lg border border-black/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-red sm:flex-1"
        />
        <select
          value={sektor}
          onChange={(e) => setSektor(e.target.value)}
          className="w-full rounded-lg border border-black/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-red sm:w-64"
        >
          <option value="">Semua Sektor</option>
          {SECTORS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <p className="mt-4 text-xs text-neutral-500">
        Menampilkan {filtered.length} dari {jobs.length} lowongan aktif
      </p>

      {filtered.length === 0 ? (
        <p className="mt-10 text-sm text-neutral-500">
          Tidak ada lowongan yang cocok dengan pencarian Anda. Coba kata kunci
          atau sektor lain.
        </p>
      ) : (
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {filtered.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
