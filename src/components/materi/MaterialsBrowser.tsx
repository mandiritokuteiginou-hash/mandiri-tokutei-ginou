"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { JLPT_LEVELS, JLPT_LEVEL_LABELS, JlptLevel, LearningMaterial } from "@/lib/materials";

export default function MaterialsBrowser({ materials }: { materials: LearningMaterial[] }) {
  const [active, setActive] = useState<JlptLevel | "Semua">("Semua");

  const levelsPresent = useMemo(
    () => JLPT_LEVELS.filter((lvl) => materials.some((m) => m.jlptLevel === lvl)),
    [materials]
  );

  const groups = useMemo(() => {
    const targetLevels = active === "Semua" ? levelsPresent : [active];
    return targetLevels
      .map((lvl) => ({
        level: lvl,
        items: materials.filter((m) => m.jlptLevel === lvl),
      }))
      .filter((g) => g.items.length > 0);
  }, [materials, active, levelsPresent]);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActive("Semua")}
          className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
            active === "Semua"
              ? "bg-brand-red text-white"
              : "bg-white text-brand-navy hover:bg-brand-navy/5"
          }`}
        >
          Semua ({materials.length})
        </button>
        {levelsPresent.map((lvl) => (
          <button
            key={lvl}
            type="button"
            onClick={() => setActive(lvl)}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
              active === lvl
                ? "bg-brand-red text-white"
                : "bg-white text-brand-navy hover:bg-brand-navy/5"
            }`}
          >
            {lvl} ({materials.filter((m) => m.jlptLevel === lvl).length})
          </button>
        ))}
      </div>

      <div className="mt-10 space-y-14">
        {groups.map((group) => (
          <div key={group.level}>
            <h2 className="text-lg font-bold text-brand-navy">
              {JLPT_LEVEL_LABELS[group.level]}
            </h2>
            <div className="mt-5 grid gap-6 md:grid-cols-2">
              {group.items.map((material) => (
                <Link
                  key={material.slug}
                  href={`/materi-belajar/${material.slug}`}
                  className="group flex flex-col rounded-2xl border border-black/5 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="w-fit rounded-full bg-brand-navy/5 px-3 py-1 text-xs font-semibold text-brand-navy">
                      {material.category}
                    </span>
                    <span className="text-xs font-semibold text-brand-gold">
                      {material.level}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-brand-navy group-hover:text-brand-red">
                    {material.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-neutral-600">
                    {material.excerpt}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
