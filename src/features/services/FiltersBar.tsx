import { useState } from "react";

// kaikki kentät on optional, koska filtterit voi olla tyhjiä
type FilterPayload = {
  type?: string;
  category?: string;
  priceMax?: number | null;
  dateAfter?: string;
};

// tyypit
const SERVICE_TYPES = [
  { key: "1on1", label: "Yksityistunti" },
  { key: "group", label: "Ryhmä" },
  { key: "pre-recorded", label: "Tallenne" },
  { key: "study material", label: "Opiskelumateriaali" },
];

// kategoriat
const SERVICE_CATEGORIES = [
  { key: "cooking", label: "Ruoanlaitto (yleinen)" },
  { key: "baking", label: "Leivonta" },
  { key: "grilling", label: "Grillaus & BBQ" },
  { key: "vegetarian", label: "Kasvis & vegaani" },
  { key: "dessert", label: "Jälkiruoat" },
  { key: "world", label: "Maailman keittiöt" },
];


// ei itse hae dataa, vaan antaa filtterit vanhemmalle komponentille (ServicesPage)
export default function FiltersBar({
  onChange,
}: {
  onChange: (f: FilterPayload) => void;
}) {
  
  const [type, setType] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [priceMax, setPriceMax] = useState<number | null>(null);
  const [dateAfter, setDateAfter] = useState<string>("");

  // hae nappi kutsuu tätä
  const apply = () => onChange({ type, category, priceMax, dateAfter });

 // tyhjennä napin logiikka
  const reset = () => {
    setType("");
    setCategory("");
    setPriceMax(null);
    setDateAfter("");
    onChange({});
  };

  return (
    // sisältää filtterit + napit
    <div className="border rounded-xl p-4 mb-6 space-y-3 bg-white shadow-sm">
      {/* Filtterikentät gridissä:
          md+: 4 saraketta, pienillä näytöillä menee allekkain */}
      <div className="grid md:grid-cols-4 gap-3">
        {/* palvelun type */}
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="rounded-lg border p-2 text-sm"
        >
          <option value="">— Tyyppi —</option>
          {SERVICE_TYPES.map((t) => (
            <option key={t.key} value={t.key}>
              {t.label}
            </option>
          ))}
        </select>

        {/* kategoria */}
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border p-2 text-sm"
        >
          <option value="">— Kategoria —</option>
          {SERVICE_CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </select>

        {/* max hinta */}
        <input
          type="number"
          placeholder="Max hinta (€)"
          className="rounded-lg border p-2 text-sm"
          value={priceMax ?? ""}
          onChange={(e) =>
            setPriceMax(e.target.value ? Number(e.target.value) : null)
          }
        />

        {/* päivämääräraja */}
        <input
          type="date"
          className="rounded-lg border p-2 text-sm"
          value={dateAfter}
          onChange={(e) => setDateAfter(e.target.value)}
        />
      </div>

      {/* toimintonapit:
          reset tyhjentää filtterit
          apply ilmoittaa filtterit vanhemmalle */}
      <div className="flex items-center justify-end gap-2">
        <button onClick={reset} className="rounded-xl px-3 py-1.5 border">
          Tyhjennä
        </button>
        <button
          onClick={apply}
          className="rounded-xl px-3 py-1.5 border bg-black text-white"
        >
          Hae
        </button>
      </div>

      {/* details/summary = selaimen oma “avattava lisäosio” ilman erillistä js:ää
          tällä voi siis lisätä kevysti suodattimia myöhemmin */}
      <details className="mt-3">
        <summary className="cursor-pointer text-sm text-neutral-600">
          Lisäfiltterit
        </summary>
        <div className="mt-2 text-sm space-y-2">
          

          {/* näytetään kategoriat tageina (ei viel klikkaus logiikkaa). */}
          <div className="flex flex-wrap gap-2">
            {SERVICE_CATEGORIES.map((c) => (
              <span
                key={c.key}
                className="inline-flex rounded-full border px-2 py-1 text-xs"
              >
                {c.label}
              </span>
            ))}
          </div>
        </div>
      </details>
    </div>
  );
}
