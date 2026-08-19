import { describe, expect, it } from "vitest";
import { mapNotionPageToJobOrder, NotionJobPostingPage } from "./notion-sync";

function buildPage(overrides: Partial<NotionJobPostingPage["properties"]> = {}): NotionJobPostingPage {
  return {
    id: "3a437c37-be7f-81cf-9b2e-fb2440e61ac8",
    properties: {
      Posisi: { title: [{ plain_text: "Perawat Lansia di Fukuoka" }] },
      Sektor: { select: { name: "Perawatan Lansia" } },
      "Lokasi Kerja": { rich_text: [{ plain_text: "Fukuoka" }] },
      Deskripsi: { rich_text: [{ plain_text: "Membantu aktivitas harian lansia." }] },
      "Bahasa Required": { select: { name: "N3" } },
      "Gaji Min": { number: 180000 },
      "Gaji Max": { number: 200000 },
      "Status Lowongan": { select: { name: "Open" } },
      ...overrides,
    },
  };
}

describe("mapNotionPageToJobOrder", () => {
  it("maps a fully populated page", () => {
    const result = mapNotionPageToJobOrder(buildPage());

    expect(result).toEqual({
      sumber: "notion_sync",
      notion_page_id: "3a437c37be7f81cf9b2efb2440e61ac8",
      nama_perusahaan: "Perawat Lansia di Fukuoka",
      sektor: "Perawat (Kaigo)",
      lokasi_prefektur: "Fukuoka",
      deskripsi_kerja: "Membantu aktivitas harian lansia.",
      syarat: "Bahasa Jepang minimal N3",
      estimasi_gaji: "¥180.000 - ¥200.000 / bulan",
      status_aktif: true,
    });
  });

  it("strips hyphens from the Notion page ID", () => {
    const result = mapNotionPageToJobOrder(buildPage());
    expect(result.notion_page_id).not.toContain("-");
  });

  it("maps every known Notion sector to one of the app's 6 sectors", () => {
    const knownSectors = [
      "Perawatan Lansia",
      "Konstruksi",
      "Pengolahan Material",
      "Mesin Industri",
      "Elektronik & IT",
      "Pembuatan Kapal",
      "Perawatan Otomotif",
      "Penerbangan",
      "Industri Makanan",
      "Kebersihan Gedung",
      "Perhotelan",
      "Restoran",
      "Pertanian",
      "Perikanan",
    ];
    const appSectors = new Set([
      "Perawat (Kaigo)",
      "Konstruksi",
      "Manufaktur",
      "Perikanan",
      "Pertanian",
      "Perhotelan & Food Service",
    ]);

    for (const sektor of knownSectors) {
      const result = mapNotionPageToJobOrder(buildPage({ Sektor: { select: { name: sektor } } }));
      expect(appSectors.has(result.sektor), `${sektor} -> ${result.sektor}`).toBe(true);
    }
  });

  it("falls back to the raw sector name when it isn't in the map, or Manufaktur when sector is empty", () => {
    const unknown = mapNotionPageToJobOrder(buildPage({ Sektor: { select: { name: "Logistik" } } }));
    expect(unknown.sektor).toBe("Logistik");

    const empty = mapNotionPageToJobOrder(buildPage({ Sektor: { select: null } }));
    expect(empty.sektor).toBe("Manufaktur");
  });

  it("omits the language requirement when Bahasa Required is 'Tidak wajib' or unset", () => {
    const notRequired = mapNotionPageToJobOrder(
      buildPage({ "Bahasa Required": { select: { name: "Tidak wajib" } } })
    );
    expect(notRequired.syarat).toBe("");

    const unset = mapNotionPageToJobOrder(buildPage({ "Bahasa Required": { select: null } }));
    expect(unset.syarat).toBe("");
  });

  it("formats salary correctly for min-only, max-only, equal, and missing cases", () => {
    expect(
      mapNotionPageToJobOrder(buildPage({ "Gaji Min": { number: 150000 }, "Gaji Max": { number: null } }))
        .estimasi_gaji
    ).toBe("¥150.000 / bulan");

    expect(
      mapNotionPageToJobOrder(buildPage({ "Gaji Min": { number: null }, "Gaji Max": { number: 220000 } }))
        .estimasi_gaji
    ).toBe("¥220.000 / bulan");

    expect(
      mapNotionPageToJobOrder(buildPage({ "Gaji Min": { number: 200000 }, "Gaji Max": { number: 200000 } }))
        .estimasi_gaji
    ).toBe("¥200.000 / bulan");

    expect(
      mapNotionPageToJobOrder(buildPage({ "Gaji Min": { number: null }, "Gaji Max": { number: null } }))
        .estimasi_gaji
    ).toBe("");
  });

  it("marks a listing active only when Status Lowongan is exactly 'Open'", () => {
    expect(
      mapNotionPageToJobOrder(buildPage({ "Status Lowongan": { select: { name: "Open" } } })).status_aktif
    ).toBe(true);
    expect(
      mapNotionPageToJobOrder(buildPage({ "Status Lowongan": { select: { name: "Closed" } } })).status_aktif
    ).toBe(false);
    expect(
      mapNotionPageToJobOrder(buildPage({ "Status Lowongan": { select: null } })).status_aktif
    ).toBe(false);
  });

  it("falls back to placeholder text when the title or location is empty", () => {
    const result = mapNotionPageToJobOrder(
      buildPage({
        Posisi: { title: [] },
        "Lokasi Kerja": { rich_text: [] },
      })
    );
    expect(result.nama_perusahaan).toBe("Lowongan Tokutei Ginou");
    expect(result.lokasi_prefektur).toBe("Jepang");
  });
});
