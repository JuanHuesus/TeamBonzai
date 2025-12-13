import { useState } from "react";

/**
 * FilterPayload on se data, jonka tämä komponentti antaa ulos vanhemmalle komponentille.
 * Kaikki kentät ovat optional, koska käyttäjä voi hakea myös ilman filttereitä.
 */
type FilterPayload = {
  type?: string;
  category?: string;
  priceMax?: number | null;
  dateAfter?: string;
};

/**
 * Vaihtoehdot palvelun tyypille.
 * key = arvo joka lähetetään filtterinä (tallennetaan stateen)
 * label = teksti jonka käyttäjä näkee valikossa
 */
const SERVICE_TYPES = [
  { key: "1on1", label: "Yksityistunti" },
  { key: "group", label: "Ryhmä" },
  { key: "pre-recorded", label: "Tallenne" },
  { key: "study material", label: "Opiskelumateriaali" },
];

/**
 * Vaihtoehdot kategorioille.
 * key = “tekninen” arvo filtteriä varten
 * label = käyttäjälle näkyvä teksti
 */
const SERVICE_CATEGORIES = [
  { key: "cooking", label: "Ruoanlaitto (yleinen)" },
  { key: "baking", label: "Leivonta" },
  { key: "grilling", label: "Grillaus & BBQ" },
  { key: "vegetarian", label: "Kasvis & vegaani" },
  { key: "dessert", label: "Jälkiruoat" },
  { key: "world", label: "Maailman keittiöt" },
];

/**
 * FiltersBar on “filtteripalkki”, joka ei itse hae dataa.
 * Se vain kerää käyttäjän valinnat ja ilmoittaa niistä vanhemmalle komponentille.
 *
 * onChange callback:
 * - vanhempi komponentti päättää mitä tapahtuu (esim. API-haku)
 * - tämä komponentti pysyy “tyhmänä” ja helposti uudelleenkäytettävänä
 */
export default function FiltersBar({
  onChange,
}: {
  onChange: (f: FilterPayload) => void;
}) {
  // Jokaiselle filtteri-kentälle oma state, jotta UI pysyy synkassa käyttäjän valintojen kanssa
  const [type, setType] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [priceMax, setPriceMax] = useState<number | null>(null);
  const [dateAfter, setDateAfter] = useState<string>("");

  /**
   * apply = “Hae”-napin toiminto.
   * Kootaan nykyiset state-arvot yhteen ja annetaan vanhemmalle komponentille.
   */
  const apply = () => onChange({ type, category, priceMax, dateAfter });

  /**
   * reset = “Tyhjennä”-napin toiminto.
   * Nollataan kaikki filtterit ja kerrotaan vanhemmalle, että filtterit on tyhjät.
   */
  const reset = () => {
    setType("");
    setCategory("");
    setPriceMax(null);
    setDateAfter("");
    onChange({});
  };

  return (
    // Tämä laatikko sisältää filtterit + napit
    <div className="border rounded-xl p-4 mb-6 space-y-3 bg-white shadow-sm">
      {/* Filtterikentät gridissä:
          md+: 4 saraketta, pienillä näytöillä menee allekkain */}
      <div className="grid md:grid-cols-4 gap-3">
        {/* Palvelun tyyppi */}
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

        {/* Kategoria */}
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

        {/* Maksimihinta.
            value={priceMax ?? ""} pitää inputin kontrolloituna:
            - jos priceMax on null -> näytetään tyhjä string
            - jos numero -> näytetään numero
        */}
        <input
          type="number"
          placeholder="Max hinta (€)"
          className="rounded-lg border p-2 text-sm"
          value={priceMax ?? ""}
          onChange={(e) =>
            // Jos kenttä tyhjä, asetetaan null; muuten muutetaan numeroksi
            setPriceMax(e.target.value ? Number(e.target.value) : null)
          }
        />

        {/* Päivämääräraja (esim. “näytä vain tämän päivän jälkeen”) */}
        <input
          type="date"
          className="rounded-lg border p-2 text-sm"
          value={dateAfter}
          onChange={(e) => setDateAfter(e.target.value)}
        />
      </div>

      {/* Toimintonapit:
          - reset tyhjentää filtterit
          - apply ilmoittaa nykyiset filtterit vanhemmalle */}
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

      {/* details/summary = selaimen oma “avattava lisäosio” ilman erillistä JS:ää.
          Tämä on hyvä kevyt tapa lisätä lisäsuodattimia myöhemmin. */}
      <details className="mt-3">
        <summary className="cursor-pointer text-sm text-neutral-600">
          Lisäfiltterit
        </summary>

        {/* Tämä osa on tällä hetkellä “placeholder”:
            näyttää esimerkin siitä, mitä lisää voisi tulla. */}
        <div className="mt-2 text-sm space-y-2">
          <p className="text-neutral-500">
            Tänne voidaan lisätä esim. taso, ruokavalio tai muita facetteja.
          </p>

          {/* Näytetään kategoriat “tageina” (ei vielä klikkilogikkaa).
              Tämä on visuaalinen pohja mahdolliselle facetti-filtterille. */}
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
