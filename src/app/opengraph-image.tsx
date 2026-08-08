import { ImageResponse } from "next/og";

export const alt = "Mandiri Tokutei Ginou — Jalur Karier SSW Jepang untuk Talenta Indonesia";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          backgroundColor: "#0f2440",
          backgroundImage:
            "radial-gradient(circle at 85% 15%, rgba(179,18,27,0.45) 0%, rgba(179,18,27,0) 45%), radial-gradient(circle at 15% 90%, rgba(212,167,44,0.3) 0%, rgba(212,167,44,0) 45%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 72,
              height: 72,
              borderRadius: "50%",
              backgroundColor: "#b3121b",
              color: "white",
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            MTG
          </div>
          <div style={{ display: "flex", color: "#d4a72c", fontSize: 28, fontWeight: 600 }}>
            Mandiri Tokutei Ginou
          </div>
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 48,
            fontSize: 60,
            fontWeight: 700,
            color: "white",
            lineHeight: 1.15,
            maxWidth: 980,
          }}
        >
          Wujudkan Karier Kerja di Jepang Lewat Jalur Tokutei Ginou
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 32,
            fontSize: 28,
            color: "#d1d5db",
            maxWidth: 900,
          }}
        >
          Pelatihan · Penempatan · Pengurusan Dokumen — transparan dan
          tanpa biaya tersembunyi
        </div>
      </div>
    ),
    { ...size }
  );
}
