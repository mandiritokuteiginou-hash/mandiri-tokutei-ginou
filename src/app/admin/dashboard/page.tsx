"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import { JOBS } from "@/lib/data";
import { ApplicationStatus, CandidateProfile } from "@/lib/types";
import {
  getAdminSession,
  getCandidates,
  saveCandidate,
  setAdminSession,
} from "@/lib/storage";

const STATUS_OPTIONS: ApplicationStatus[] = [
  "Berkas Diverifikasi",
  "Pelatihan Bahasa",
  "Ujian Skill & JLPT",
  "Menunggu Penempatan",
  "Ditempatkan di Jepang",
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [candidates, setCandidates] = useState<CandidateProfile[]>([]);

  useEffect(() => {
    if (!getAdminSession()) {
      router.replace("/admin/login");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of client-only localStorage on mount
    setAuthorized(true);
    setCandidates(getCandidates());
  }, [router]);

  function handleStatusChange(email: string, status: ApplicationStatus) {
    const target = candidates.find((c) => c.email === email);
    if (!target) return;
    const updated = { ...target, status };
    saveCandidate(updated);
    setCandidates((prev) => prev.map((c) => (c.email === email ? updated : c)));
  }

  function handleLogout() {
    setAdminSession(false);
    router.push("/admin/login");
  }

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-navy text-sm text-neutral-300">
        Memeriksa akses...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <AdminHeader
        action={
          <button
            onClick={handleLogout}
            className="text-sm font-medium text-white hover:text-brand-gold"
          >
            Keluar
          </button>
        }
      />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="text-xs font-medium text-neutral-500">Total Kandidat</div>
            <div className="mt-2 text-2xl font-bold text-brand-navy">
              {candidates.length}
            </div>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="text-xs font-medium text-neutral-500">Ditempatkan di Jepang</div>
            <div className="mt-2 text-2xl font-bold text-brand-navy">
              {candidates.filter((c) => c.status === "Ditempatkan di Jepang").length}
            </div>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="text-xs font-medium text-neutral-500">Lowongan Aktif</div>
            <div className="mt-2 text-2xl font-bold text-brand-navy">{JOBS.length}</div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-brand-navy">Daftar Kandidat</h2>

          {candidates.length === 0 ? (
            <p className="mt-4 text-sm text-neutral-500">
              Belum ada kandidat terdaftar. Data akan muncul di sini begitu
              seseorang mendaftar lewat Portal Kandidat pada browser ini.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-black/5 text-xs uppercase text-neutral-500">
                    <th className="py-2 pr-4">Nama</th>
                    <th className="py-2 pr-4">Kontak</th>
                    <th className="py-2 pr-4">Sektor</th>
                    <th className="py-2 pr-4">Dokumen</th>
                    <th className="py-2 pr-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((c) => (
                    <tr key={c.email} className="border-b border-black/5">
                      <td className="py-3 pr-4 font-medium text-brand-navy">
                        {c.fullName}
                      </td>
                      <td className="py-3 pr-4 text-neutral-600">
                        <div>{c.email}</div>
                        <div className="text-xs text-neutral-400">{c.phone}</div>
                      </td>
                      <td className="py-3 pr-4 text-neutral-600">{c.sectorInterest}</td>
                      <td className="py-3 pr-4 text-neutral-600">
                        {c.documents.filter((d) => d.uploaded).length}/
                        {c.documents.length}
                      </td>
                      <td className="py-3 pr-4">
                        <select
                          value={c.status}
                          onChange={(e) =>
                            handleStatusChange(
                              c.email,
                              e.target.value as ApplicationStatus
                            )
                          }
                          className="rounded-lg border border-black/10 px-2 py-1 text-xs outline-none focus:border-brand-red"
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-brand-navy">Lowongan Aktif</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-black/5 text-xs uppercase text-neutral-500">
                  <th className="py-2 pr-4">Posisi</th>
                  <th className="py-2 pr-4">Sektor</th>
                  <th className="py-2 pr-4">Lokasi</th>
                  <th className="py-2 pr-4">Slot</th>
                  <th className="py-2 pr-4">Gaji</th>
                </tr>
              </thead>
              <tbody>
                {JOBS.map((job) => (
                  <tr key={job.id} className="border-b border-black/5">
                    <td className="py-3 pr-4 font-medium text-brand-navy">
                      {job.title}
                    </td>
                    <td className="py-3 pr-4 text-neutral-600">{job.sector}</td>
                    <td className="py-3 pr-4 text-neutral-600">{job.location}</td>
                    <td className="py-3 pr-4 text-neutral-600">{job.slots}</td>
                    <td className="py-3 pr-4 text-neutral-600">{job.salaryRange}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-neutral-400">
            Data lowongan saat ini bersumber dari data contoh statis.
            Hubungkan ke basis data untuk pengelolaan penuh (tambah/ubah/hapus).
          </p>
        </div>
      </main>
    </div>
  );
}
