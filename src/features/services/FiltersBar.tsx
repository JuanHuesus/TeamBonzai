import { useState } from "react";

/** Lähetettävä payload ylös (esim. tuleviin laajennuksiin) */
type FilterPayload = {
  type?: string;        // API: service_type
  category?: string;    // API: service_category
  priceMax?: number | null; // klientside
  dateAfter?: string;   // klientside YYYY-MM-DD
};

const SERVICE_TYPES = [
  { key: "1on1", label: "Yksityistunti" },
  { key: "group", label: "Ryhmä" },
  { key: "pre-recorded", label: "Tallenne" },
  { key: "study material", label: "Opiskelumateriaali" },
];

const SERVICE_CATEGORIES = [
  { key: "music", label: "Musiikki" },
  { key: "pottery", label: "Keramiikka" },
  { key: "fitness", label: "Liikunta" },
  { key: "coding", label: "Koodaus" },
  { key: "crafts", label: "Käsityöt" },
  { key: "photo", label: "Valokuvaus" },
  { key: "cooking", label: "Ruoanlaitto" },
];

export default function FiltersBar({ onChange }: { onChange: (f: FilterPayload) => void }) {
  const [type, setType] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [priceMax, setPriceMax] = useState<number | null>(null);
  const [dateAfter, setDateAfter] = useState<string>("");

  const apply = () => onChange({ type, category, priceMax, dateAfter });

  const reset = () => {
    setType("");
    setCategory("");
    setPriceMax(null);
    setDateAfter("");
    onChange({});
  };

  return (
    <div className="border rounded-xl p-4 mb-6 space-y-3 bg-white shadow-sm">
      <div className="grid md:grid-cols-4 gap-3">
        <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-lg border p-2 text-sm">
          <option value="">— Tyyppi —</option>
          {SERVICE_TYPES.map((t) => (
            <option key={t.key} value={t.key}>{t.label}</option>
          ))}
        </select>

        <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-lg border p-2 text-sm">
          <option value="">— Kategoria —</option>
          {SERVICE_CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>{c.label}</option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Max hinta (€)"
          className="rounded-lg border p-2 text-sm"
          value={priceMax ?? ""}
          onChange={(e) => setPriceMax(e.target.value ? Number(e.target.value) : null)}
        />

        <input
          type="date"
          className="rounded-lg border p-2 text-sm"
          value={dateAfter}
          onChange={(e) => setDateAfter(e.target.value)}
        />
      </div>

      <div className="flex items-center justify-end gap-2">
        <button onClick={reset} className="rounded-xl px-3 py-1.5 border">Tyhjennä</button>
        <button onClick={apply} className="rounded-xl px-3 py-1.5 border bg-black text-white">Hae</button>
      </div>

      {/* Lisäfiltterit varalla tulevaa varten */}
      <details className="mt-3">
        <summary className="cursor-pointer text-sm text-neutral-600">Lisäfiltterit</summary>
        <div className="mt-2 text-sm space-y-2">
          <p className="text-neutral-500">Tänne voidaan lisätä esim. taso, sijainti, kieli tai muita facetteja.</p>
          <div className="flex flex-wrap gap-2">
            {SERVICE_CATEGORIES.map((c) => (
              <span key={c.key} className="inline-flex rounded-full border px-2 py-1 text-xs">
                {c.label}
              </span>
            ))}
          </div>
        </div>
      </details>
    </div>
  );
}
