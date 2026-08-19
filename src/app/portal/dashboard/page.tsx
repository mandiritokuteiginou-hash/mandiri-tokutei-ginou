"use client";

import { ChangeEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PortalHeader from "@/components/portal/PortalHeader";
import Spinner from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import { ensureCpmiRegistration } from "@/lib/supabase/cpmi";
import { SupabaseClient } from "@supabase/supabase-js";
import {
  CPMI_STATUS_FLOW,
  CPMI_STATUS_LABELS,
  CpmiDocument,
  CpmiRegistration,
  DOCUMENT_TYPE_LABELS,
  DocumentType,
  JOB_MATCH_STATUS_LABELS,
  JobMatchStatus,
  JobOrder,
  REQUIRED_DOCUMENT_TYPES,
} from "@/lib/types";

interface RecommendedMatch {
  id: string;
  status_match: JobMatchStatus;
  job_orders: JobOrder | null;
}

async function uploadCandidateDocument(
  supabase: SupabaseClient,
  registrationId: string,
  jenisDokumen: DocumentType,
  file: File
) {
  const path = `${registrationId}/${jenisDokumen}-${Date.now()}-${file.name}`;

  const { error: uploadErr } = await supabase.storage
    .from("cpmi-documents")
    .upload(path, file);
  if (uploadErr) return { error: uploadErr };

  const { error: insertErr } = await supabase.from("documents").insert({
    cpmi_id: registrationId,
    jenis_dokumen: jenisDokumen,
    file_url: path,
  });
  return { error: insertErr };
}

export default function PortalDashboardPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [registration, setRegistration] = useState<CpmiRegistration | null>(null);
  const [documents, setDocuments] = useState<CpmiDocument[]>([]);
  const [matchedJobs, setMatchedJobs] = useState<JobOrder[]>([]);
  const [recommendedMatches, setRecommendedMatches] = useState<RecommendedMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState("");

  const loadData = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/portal/login");
      return;
    }

    const reg = await ensureCpmiRegistration(supabase, user);
    setRegistration(reg);

    const { data: docs } = await supabase
      .from("documents")
      .select("*")
      .eq("cpmi_id", reg.id)
      .order("uploaded_at", { ascending: false });
    setDocuments(docs ?? []);

    if (reg.sektor_minat.length > 0) {
      const { data: jobs } = await supabase
        .from("job_orders")
        .select("*")
        .eq("status_aktif", true)
        .in("sektor", reg.sektor_minat);
      setMatchedJobs(jobs ?? []);
    }

    const { data: matches } = await supabase
      .from("job_order_matches")
      .select("id, status_match, job_orders(*)")
      .eq("cpmi_id", reg.id)
      .order("created_at", { ascending: false });
    setRecommendedMatches((matches ?? []) as unknown as RecommendedMatch[]);

    setLoading(false);
  }, [router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time fetch of the signed-in candidate's data on mount
    loadData();
  }, [loadData]);

  async function handleUpload(jenisDokumen: DocumentType, e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !registration) return;

    setUploadError("");
    setUploadingType(jenisDokumen);

    const supabase = createClient();
    const { error } = await uploadCandidateDocument(
      supabase,
      registration.id,
      jenisDokumen,
      file
    );

    if (error) {
      setUploadError(error.message);
      showToast("Gagal mengunggah dokumen: " + error.message, "error");
      setUploadingType(null);
      return;
    }

    showToast(`${DOCUMENT_TYPE_LABELS[jenisDokumen]} berhasil diunggah`);
    await loadData();
    setUploadingType(null);
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/portal/login");
  }

  if (loading || !registration) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 bg-brand-cream text-sm text-neutral-500">
        <Spinner className="h-4 w-4" />
        Memuat data...
      </div>
    );
  }

  const isTerminalStatus =
    registration.status === "tidak_lolos" || registration.status === "mengundurkan_diri";
  const currentStepIndex = CPMI_STATUS_FLOW.indexOf(registration.status);
  const uploadedByType = new Map(documents.map((d) => [d.jenis_dokumen, d]));

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
                Halo, {registration.nama_lengkap.split(" ")[0]} 👋
              </h1>
              <p className="text-sm text-neutral-500">
                Sektor diminati: {registration.sektor_minat.join(", ") || "-"}
                {registration.nomor_registrasi && (
                  <> · No. Registrasi: {registration.nomor_registrasi}</>
                )}
              </p>
            </div>
            <span
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                isTerminalStatus
                  ? "bg-neutral-200 text-neutral-600"
                  : "bg-brand-red/10 text-brand-red"
              }`}
            >
              {CPMI_STATUS_LABELS[registration.status]}
            </span>
          </div>

          {!isTerminalStatus && (
            <div className="mt-8">
              <h2 className="text-sm font-semibold text-brand-navy">
                Status Pendaftaran
              </h2>
              <ol className="mt-4 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-3">
                {CPMI_STATUS_FLOW.map((step, i) => (
                  <li key={step} className="flex items-center gap-2">
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
                      {CPMI_STATUS_LABELS[step]}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {recommendedMatches.length > 0 && (
          <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-brand-navy">
              Direkomendasikan oleh Tim Kami
            </h2>
            <ul className="mt-4 space-y-3">
              {recommendedMatches.map((match) => {
                const job = match.job_orders;
                const statusStyle =
                  match.status_match === "diterima"
                    ? "bg-green-100 text-green-700"
                    : match.status_match === "ditolak"
                      ? "bg-neutral-200 text-neutral-500"
                      : match.status_match === "dipilih_cpmi"
                        ? "bg-brand-gold/15 text-brand-gold"
                        : "bg-brand-navy/10 text-brand-navy";
                return (
                  <li
                    key={match.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-black/5 p-3 text-sm"
                  >
                    <div>
                      <div className="font-medium text-brand-navy">
                        {job?.nama_perusahaan ?? "(lowongan tidak tersedia)"}
                      </div>
                      {job && (
                        <div className="text-xs text-neutral-500">
                          {job.lokasi_prefektur} · {job.estimasi_gaji}
                        </div>
                      )}
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle}`}>
                      {JOB_MATCH_STATUS_LABELS[match.status_match]}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-brand-navy">
              Checklist Dokumen
            </h2>
            {uploadError && (
              <p className="mt-2 text-xs text-brand-red">{uploadError}</p>
            )}
            <ul className="mt-4 space-y-3">
              {REQUIRED_DOCUMENT_TYPES.map((docType) => {
                const uploaded = uploadedByType.get(docType);
                const isUploading = uploadingType === docType;
                return (
                  <li key={docType} className="flex items-center justify-between gap-3">
                    <span className="text-sm text-neutral-700">
                      {DOCUMENT_TYPE_LABELS[docType]}
                    </span>
                    {uploaded ? (
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                        Terunggah ✓
                      </span>
                    ) : (
                      <label className="cursor-pointer rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600 hover:bg-neutral-200">
                        {isUploading ? "Mengunggah..." : "Unggah"}
                        <input
                          type="file"
                          className="hidden"
                          disabled={isUploading}
                          onChange={(e) => handleUpload(docType, e)}
                        />
                      </label>
                    )}
                  </li>
                );
              })}
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
                    <div className="font-medium text-brand-navy">
                      {job.nama_perusahaan}
                    </div>
                    <div className="text-xs text-neutral-500">
                      {job.lokasi_prefektur} · {job.estimasi_gaji}
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
