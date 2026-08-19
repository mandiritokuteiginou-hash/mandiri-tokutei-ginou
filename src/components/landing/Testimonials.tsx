import { TESTIMONIALS } from "@/lib/data";

export default function Testimonials() {
  return (
    <section id="testimoni" className="scroll-mt-16 bg-brand-navy py-20 text-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <span className="text-sm font-semibold uppercase tracking-wide text-brand-gold">
            Cerita Alumni
          </span>
          <h2 className="mt-3 text-2xl font-bold sm:text-3xl">
            Kisah Sukses Kandidat yang Sudah Bekerja di Jepang
          </h2>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure
              key={t.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-6"
            >
              <blockquote className="text-sm leading-relaxed text-neutral-200">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-5 border-t border-white/10 pt-4">
                <div className="text-sm font-semibold text-white">{t.name}</div>
                <div className="text-xs text-neutral-400">
                  {t.role} · {t.location}
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
