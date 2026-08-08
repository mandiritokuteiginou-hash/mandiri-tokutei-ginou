import { SERVICES } from "@/lib/data";

const ICONS: Record<string, string> = {
  training: "🎓",
  placement: "🤝",
  document: "📄",
  support: "🛡️",
};

export default function Services() {
  return (
    <section id="layanan" className="bg-brand-cream py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <span className="text-sm font-semibold uppercase tracking-wide text-brand-red">
            Layanan Kami
          </span>
          <h2 className="mt-3 text-2xl font-bold text-brand-navy sm:text-3xl">
            Pendampingan End-to-End, dari Pelatihan hingga Bekerja di Jepang
          </h2>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((service) => (
            <div
              key={service.title}
              className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-red/10 text-xl">
                {ICONS[service.icon]}
              </span>
              <h3 className="mt-4 text-base font-semibold text-brand-navy">
                {service.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
