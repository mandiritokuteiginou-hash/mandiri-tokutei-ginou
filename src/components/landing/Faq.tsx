"use client";

import { useState } from "react";
import { FAQS } from "@/lib/faq";

export default function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="mx-auto max-w-4xl scroll-mt-16 px-4 py-20 sm:px-6">
      <div className="text-center">
        <span className="text-sm font-semibold uppercase tracking-wide text-brand-red">
          Pertanyaan Umum
        </span>
        <h2 className="mt-3 text-2xl font-bold text-brand-navy sm:text-3xl">
          Hal yang Sering Ditanyakan Calon Kandidat
        </h2>
      </div>

      <div className="mt-10 divide-y divide-black/5 rounded-2xl border border-black/5">
        {FAQS.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <div key={item.question}>
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <span className="text-sm font-semibold text-brand-navy sm:text-base">
                  {item.question}
                </span>
                <span
                  className={`shrink-0 text-lg text-brand-red transition-transform ${
                    isOpen ? "rotate-45" : ""
                  }`}
                  aria-hidden
                >
                  +
                </span>
              </button>
              {isOpen && (
                <div className="px-5 pb-5">
                  <p className="text-sm leading-relaxed text-neutral-600">
                    {item.answer}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
