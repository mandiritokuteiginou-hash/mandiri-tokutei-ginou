"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import JobOrderForm, { JobOrderFormValues } from "@/components/admin/JobOrderForm";
import { createClient } from "@/lib/supabase/client";
import {
  CPMI_STATUS_FLOW,
  CPMI_STATUS_LABELS,
  CpmiRegistration,
  CpmiStatus,
  JobOrder,
  REQUIRED_DOCUMENT_TYPES,
} from "@/lib/types";

const STATUS_OPTIONS: CpmiStatus[] = [
  ...CPMI_STATUS_FLOW,
  "tidak_lolos",
  "mengundurkan_diri",
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [registrations, setRegistrations] = useState<CpmiRegistration[]>([]);
  const [jobs, setJobs] = useState<JobOrder[]>([]);
  const [docCounts, setDocCounts] = useState<Map<string, number>>(new Map());
  const [jobFormOpen, setJobFormOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobOrder | null>(null);
  const [jobFormSubmitting, setJobFormSubmitting] = useState(false);
  const [jobFormError, setJobFormError] = useState("");

  const loadData = useCallback(async () => {
    const supabase = createClient();
    const { data: regs } = await supabase
      .from("cpmi_registrations")
      .select("*")
      .order("created_at", { ascending: false });
    setRegistrations(regs ?? []);

    const { data: jobOrders } = await supabase
      .from("job_orders")
      .select("*")
      .order("created_at", { ascending: false });
    setJobs(jobOrders ?? []);

    const { data: docs } = await supabase.from("documents").select("cpmi_id, jenis_dokumen");
    const counts = new Map<string, Set<string>>();
    for (const doc of docs ?? []) {
      if (!counts.has(doc.cpmi_id)) counts.set(doc.cpmi_id, new Set());
      if (REQUIRED_DOCUMENT_TYPES.includes(doc.jenis_dokumen)) {
        counts.get(doc.cpmi_id)!.add(doc.jenis_dokumen);
      }
    }
    setDocCounts(new Map([...counts].map(([id, set]) => [id, set.size])));
  }, []);

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/admin/login");
        return;
      }

      const { data: adminRow } = await supabase
        .from("admin_users")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (!adminRow) {
        await supabase.auth.signOut();
        router.replace("/admin/login");
        return;
      }

      setAuthorized(true);
      await loadData();
    }
    init();
  }, [router, loadData]);

  async function handleStatusChange(id: string, status: CpmiStatus) {
    const supabase = createClient();
    const { error } = await supabase
      .from("cpmi_registrations")
      .update({ status })
      .eq("id", id);
    if (!error) {
      setRegistrations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      );
    }
  }

  function openCreateJobForm() {
    setEditingJob(null);
    setJobFormError("");
    setJobFormOpen(true);
  }

  function openEditJobForm(job: JobOrder) {
    setEditingJob(job);
    setJobFormError("");
    setJobFormOpen(true);
  }

  function closeJobForm() {
    setJobFormOpen(false);
    setEditingJob(null);
    setJobFormError("");
  }

  async function handleJobFormSubmit(values: JobOrderFormValues) {
    setJobFormSubmitting(true);
    setJobFormError("");

    const supabase = createClient();
    const { error } = editingJob
      ? await supabase.from("job_orders").update(values).eq("id", editingJob.id)
      : await supabase.from("job_orders").insert(values);

    setJobFormSubmitting(false);

    if (error) {
      setJobFormError(error.message);
      return;
    }

    closeJobForm();
    await loadData();
  }

  async function handleToggleJobActive(job: JobOrder) {
    const supabase = createClient();
    const { error } = await supabase
      .from("job_orders")
      .update({ status_aktif: !job.status_aktif })
      .eq("id", job.id);
    if (!error) {
      setJobs((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, status_aktif: !j.status_aktif } : j))
      );
    }
  }

  async function handleDeleteJob(job: JobOrder) {
    if (!confirm(`Hapus lowongan "${job.nama_perusahaan}"?`)) return;
    const supabase = createClient();
    const { error } = await supabase.from("job_orders").delete().eq("id", job.id);
    if (!error) {
      setJobs((prev) => prev.filter((j) => j.id !== job.id));
    }
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-navy text-sm text-neutral-300">
        Memeriksa akses...
      </div>
    );
  }

  const activeJobs = jobs.filter((j) => j.status_aktif);

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
              {registrations.length}
            </div>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="text-xs font-medium text-neutral-500">Bekerja di Jepang</div>
            <div className="mt-2 text-2xl font-bold text-brand-navy">
              {registrations.filter((r) => r.status === "bekerja_di_jepang").length}
            </div>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="text-xs font-medium text-neutral-500">Lowongan Aktif</div>
            <div className="mt-2 text-2xl font-bold text-brand-navy">
              {activeJobs.length}
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-brand-navy">Daftar Kandidat</h2>

          {registrations.length === 0 ? (
            <p className="mt-4 text-sm text-neutral-500">
              Belum ada kandidat terdaftar.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-black/5 text-xs uppercase text-neutral-500">
                    <th className="py-2 pr-4">No. Registrasi</th>
                    <th className="py-2 pr-4">Nama</th>
                    <th className="py-2 pr-4">Kontak</th>
                    <th className="py-2 pr-4">Sektor</th>
                    <th className="py-2 pr-4">Dokumen</th>
                    <th className="py-2 pr-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((r) => (
                    <tr key={r.id} className="border-b border-black/5">
                      <td className="py-3 pr-4 text-xs text-neutral-500">
                        {r.nomor_registrasi ?? "-"}
                      </td>
                      <td className="py-3 pr-4 font-medium text-brand-navy">
                        {r.nama_lengkap}
                      </td>
                      <td className="py-3 pr-4 text-neutral-600">
                        <div>{r.email ?? "-"}</div>
                        <div className="text-xs text-neutral-400">{r.nomor_hp}</div>
                      </td>
                      <td className="py-3 pr-4 text-neutral-600">
                        {r.sektor_minat.join(", ") || "-"}
                      </td>
                      <td className="py-3 pr-4 text-neutral-600">
                        {docCounts.get(r.id) ?? 0}/{REQUIRED_DOCUMENT_TYPES.length}
                      </td>
                      <td className="py-3 pr-4">
                        <select
                          value={r.status}
                          onChange={(e) =>
                            handleStatusChange(r.id, e.target.value as CpmiStatus)
                          }
                          className="rounded-lg border border-black/10 px-2 py-1 text-xs outline-none focus:border-brand-red"
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {CPMI_STATUS_LABELS[status]}
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
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-brand-navy">Lowongan</h2>
            {!jobFormOpen && (
              <button
                onClick={openCreateJobForm}
                className="rounded-full bg-brand-red px-4 py-2 text-xs font-semibold text-white hover:bg-brand-red-dark"
              >
                + Tambah Lowongan
              </button>
            )}
          </div>

          {jobFormOpen && (
            <JobOrderForm
              initial={editingJob}
              submitting={jobFormSubmitting}
              error={jobFormError}
              onSubmit={handleJobFormSubmit}
              onCancel={closeJobForm}
            />
          )}

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-black/5 text-xs uppercase text-neutral-500">
                  <th className="py-2 pr-4">Perusahaan</th>
                  <th className="py-2 pr-4">Sektor</th>
                  <th className="py-2 pr-4">Lokasi</th>
                  <th className="py-2 pr-4">Gaji</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id} className="border-b border-black/5">
                    <td className="py-3 pr-4 font-medium text-brand-navy">
                      {job.nama_perusahaan}
                    </td>
                    <td className="py-3 pr-4 text-neutral-600">{job.sektor}</td>
                    <td className="py-3 pr-4 text-neutral-600">{job.lokasi_prefektur}</td>
                    <td className="py-3 pr-4 text-neutral-600">{job.estimasi_gaji}</td>
                    <td className="py-3 pr-4">
                      <button
                        onClick={() => handleToggleJobActive(job)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          job.status_aktif
                            ? "bg-green-100 text-green-700"
                            : "bg-neutral-200 text-neutral-500"
                        }`}
                      >
                        {job.status_aktif ? "Aktif" : "Nonaktif"}
                      </button>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditJobForm(job)}
                          className="text-xs font-semibold text-brand-navy hover:text-brand-red"
                        >
                          Ubah
                        </button>
                        <button
                          onClick={() => handleDeleteJob(job)}
                          className="text-xs font-semibold text-brand-red hover:text-brand-red-dark"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {jobs.length === 0 && (
              <p className="py-6 text-center text-sm text-neutral-500">
                Belum ada lowongan. Tambahkan lewat tombol di atas.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
