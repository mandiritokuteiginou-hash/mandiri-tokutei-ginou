import { GALLERY } from "@/lib/gallery";

export default function Gallery() {
  return (
    <section id="galeri" className="scroll-mt-16 bg-brand-cream py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <span className="text-sm font-semibold uppercase tracking-wide text-brand-red">
            Galeri Kegiatan
          </span>
          <h2 className="mt-3 text-2xl font-bold text-brand-navy sm:text-3xl">
            Momen Perjalanan Kandidat Kami
          </h2>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:auto-rows-[160px] md:grid-cols-4">
          {GALLERY.map((item) => (
            <div
              key={item.caption}
              className={`group relative flex flex-col justify-end overflow-hidden rounded-2xl bg-gradient-to-br p-4 text-white shadow-sm ${
                item.gradient
              } ${
                item.span === "tall"
                  ? "row-span-1 md:row-span-2"
                  : item.span === "wide"
                    ? "col-span-2 md:col-span-2"
                    : ""
              } aspect-square md:aspect-auto`}
            >
              <span className="absolute right-3 top-3 text-2xl opacity-80" aria-hidden>
                {item.icon}
              </span>
              <div className="relative">
                <p className="text-sm font-semibold leading-snug">{item.caption}</p>
                <p className="mt-1 text-xs text-white/75">{item.place}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
