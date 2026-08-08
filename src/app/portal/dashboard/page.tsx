"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PortalHeader from "@/components/portal/PortalHeader";
import { JOBS } from "@/lib/data";
import { ApplicationStatus, CandidateProfile } from "@/lib/types";
import {
  findCandidate,
  getCandidateSession,
  saveCandidate,
  setCandidateSession,
} from "@/lib/storage";

const STATUS_STEPS: ApplicationStatus[] = [
  "Berkas Diverifikasi",
  "Pelatihan Bahasa",
  "Ujian Skill & JLPT",
  "Menunggu Penempatan",
  "Ditempatkan di Jepang",
];

export default function PortalDashboardPage() {
  const router = useRouter();
  const [candidate, setCandidate] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const email = getCandidateSession();
    if (!email) {
      router.replace("/portal/login");
      return;
    }
    const profile = findCandidate(email);
    if (!profile) {
      router.replace("/portal/login");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of client-only localStorage on mount
    setCandidate(profile);
    setLoading(false);
  }, [router]);

  function toggleDocument(index: number) {
    if (!candidate) return;
    const documents = candidate.documents.map((doc, i) =>
      i === index ? { ...doc, uploaded: !doc.uploaded } : doc
    );
    const updated = { ...candidate, documents };
    setCandidate(updated);
    saveCandidate(updated);
  }

  function handleLogout() {
    setCandidateSession(null);
    router.push("/portal/login");
  }

  if (loading || !candidate) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-cream text-sm text-neutral-500">
        Memuat data...
      </div>
    );
  }

  const currentStepIndex = STATUS_STEPS.indexOf(candidate.status);
  const matchedJobs = JOBS.filter((j) => j.sector === candidate.sectorInterest);

  return (
    <div className="min-h-screen bg-brand-cream">
      <PortalHeader
        action={
          <button
            onClick={handleLogout}
            className="text-sm font-medium text-brand-navy hover:text-brand-red"
          >
            Keluar
          </button>
        }
      />

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-brand-navy">
                Halo, {candidate.fullName.split(" ")[0]} 👋
              </h1>
              <p className="text-sm text-neutral-500">
                Sektor diminati: {candidate.sectorInterest}
              </p>
            </div>
            <span className="rounded-full bg-brand-red/10 px-4 py-2 text-sm font-semibold text-brand-red">
              {candidate.status}
            </span>
          </div>

          <div className="mt-8">
            <h2 className="text-sm font-semibold text-brand-navy">
              Status Pendaftaran
            </h2>
            <ol className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {STATUS_STEPS.map((step, i) => (
                <li key={step} className="flex flex-1 items-center gap-3">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      i <= currentStepIndex
                        ? "bg-brand-red text-white"
                        : "bg-neutral-100 text-neutral-400"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span
                    className={`text-xs sm:text-sm ${
                      i <= currentStepIndex
                        ? "font-medium text-brand-navy"
                        : "text-neutral-400"
                    }`}
                  >
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-brand-navy">
              Checklist Dokumen
            </h2>
            <ul className="mt-4 space-y-3">
              {candidate.documents.map((doc, i) => (
                <li key={doc.name} className="flex items-center justify-between">
                  <span className="text-sm text-neutral-700">{doc.name}</span>
                  <button
                    onClick={() => toggleDocument(i)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      doc.uploaded
                        ? "bg-green-100 text-green-700"
                        : "bg-neutral-100 text-neutral-500"
                    }`}
                  >
                    {doc.uploaded ? "Terunggah ✓" : "Belum Diunggah"}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-brand-navy">
              Lowongan Sesuai Sektor Anda
            </h2>
            {matchedJobs.length === 0 ? (
              <p className="mt-4 text-sm text-neutral-500">
                Belum ada lowongan aktif untuk sektor ini saat ini.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {matchedJobs.map((job) => (
                  <li
                    key={job.id}
                    className="rounded-lg border border-black/5 p-3 text-sm"
                  >
                    <div className="font-medium text-brand-navy">{job.title}</div>
                    <div className="text-xs text-neutral-500">
                      {job.location} · {job.salaryRange}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
