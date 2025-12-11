import { useEffect, useMemo, useState } from "react";
import { listServices } from "../features/services/api.services";
import type { ListedService } from "../types";
import ServiceCard from "../features/services/ServiceCard";
import Modal from "../ui/Modal";
import { Link } from "react-router-dom";
import { toMessage } from "../lib/error";
import { useI18n } from "../i18n";
import ServiceDetailModal from "../features/services/ServiceDetailModal";


function isOnline(location: string | null | undefined) {
  if (!location) return false;
  try {
    const u = new URL(location);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function parsePriceEUR(p: string | null | undefined): number | null {
  if (!p) return null;
  const num = p.replace(/[^\d,.]/g, "").replace(",", ".");
  const n = Number(num);
  return Number.isFinite(n) ? n : null;
}

const DURATION_BUCKETS = [
  { key: "le60", label: "≤ 60 min", match: (m: number) => m <= 60 },
  { key: "1to3h", label: "1–3 h", match: (m: number) => m > 60 && m <= 180 },
  { key: "3to8h", label: "3–8 h", match: (m: number) => m > 180 && m <= 480 },
  { key: "multiday", label: "> 8 h / useampi päivä", match: (m: number) => m > 480 },
] as const;

const FACETS = {
  crafts: {
    label: "Kurssin teema",
    values: [
      "Arjen kokkaus",
      "Leivonta",
      "Grillaus",
      "Kasvisruoka",
      "Maailman keittiöt",
      "Jälkiruoat",
    ],
  },
  code: {
    label: "Keittiötyyli",
    values: [
      "Suomalainen",
      "Italialainen",
      "Aasialainen",
      "Välimerellinen",
      "Street food",
      "Fine dining",
    ],
  },
  instruments: {
    label: "Ruokavalio",
    values: [
      "Vegaani",
      "Kasvis",
      "Gluteeniton",
      "Laktoositon",
      "Maitoproteiiniton",
      "Sokeriton",
    ],
  },
  groupSize: {
    label: "Ryhmäkoko",
    values: ["Yksityistunti", "Pieni ryhmä", "Suuri ryhmä"],
  },
} as const;

type ModeFilter = "all" | "online" | "inperson";

function deriveFacets(s: ListedService) {
  const txt = [
    s.name,
    s.description,
    s.service_category,
    s.service_type,
    s.listing_creator,
    s.service_provider,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const hasAny = (words: string[]) => words.some((w) => txt.includes(w));

  const theme: string[] = [];
  if (hasAny(["arki", "helppo", "nopea", "meal prep"])) theme.push("Arjen kokkaus");
  if (hasAny(["leivo", "leivon", "leivonta", "bake", "baking"])) theme.push("Leivonta");
  if (hasAny(["grill", "bbq"])) theme.push("Grillaus");
  if (hasAny(["kasvis", "vege", "vegetarian"])) theme.push("Kasvisruoka");
  if (hasAny(["italia", "aasia", "thai", "mexico", "indian", "world"]))
    theme.push("Maailman keittiöt");
  if (hasAny(["jälkiruoka", "dessert", "makea", "sweet"]))
    theme.push("Jälkiruoat");

  const cuisine: string[] = [];
  if (hasAny(["suomi", "lapp", "karjal"])) cuisine.push("Suomalainen");
  if (hasAny(["italia", "pasta", "pizza"])) cuisine.push("Italialainen");
  if (hasAny(["aasia", "thai", "ramen", "korea", "sushi"]))
    cuisine.push("Aasialainen");
  if (hasAny(["välimer", "mediterr"])) cuisine.push("Välimerellinen");
  if (hasAny(["street", "burger", "taco"])) cuisine.push("Street food");
  if (hasAny(["fine dining", "fine-dining", "degust"])) cuisine.push("Fine dining");

  const diet: string[] = [];
  if (hasAny(["vegaan", "vegan"])) diet.push("Vegaani");
  if (hasAny(["kasvis", "vegetarian"])) diet.push("Kasvis");
  if (hasAny(["gluteenit", "gluten free"])) diet.push("Gluteeniton");
  if (hasAny(["laktoosit", "lactose"])) diet.push("Laktoositon");
  if (hasAny(["maitoproteiini", "dairy free"])) diet.push("Maitoproteiiniton");
  if (hasAny(["sokeriton", "sugar free"])) diet.push("Sokeriton");

  return { craft: theme, code: cuisine, instrument: diet };
}

function groupLabel(
  attendee_limit: string | null | undefined
): "Yksityistunti" | "Pieni ryhmä" | "Suuri ryhmä" {
  const limitStr = (attendee_limit ?? "").toLowerCase();
  if (limitStr === "unlimited") return "Suuri ryhmä";
  const n = Number(limitStr);
  if (!Number.isFinite(n)) return "Pieni ryhmä";
  if (n <= 1) return "Yksityistunti";
  if (n <= 10) return "Pieni ryhmä";
  return "Suuri ryhmä";
}

export default function ServicesList() {
  const [items, setItems] = useState<ListedService[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [type, setType] = useState<string>("all");

  const [mode, setMode] = useState<ModeFilter>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");

  const [fDuration, setFDuration] = useState<string[]>([]);
  const [fGroupSize, setFGroupSize] = useState<string[]>([]);
  const [fCrafts, setFCrafts] = useState<string[]>([]);
  const [fCode, setFCode] = useState<string[]>([]);
  const [fInstr, setFInstr] = useState<string[]>([]);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [detail, setDetail] = useState<ListedService | null>(null);

  const { t, lang } = useI18n();
  const locale = lang === "fi" ? "fi-FI" : "en-GB";

  async function load() {
    setError(null);
    try {
      const data = await listServices({});
      setItems(data);
    } catch (e: unknown) {
      setError(toMessage(e));
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    (items ?? []).forEach((s) => s.service_category && set.add(s.service_category));
    return Array.from(set);
  }, [items]);

  const types = useMemo(() => {
    const set = new Set<string>();
    (items ?? []).forEach((s) => s.service_type && set.add(s.service_type));
    return Array.from(set);
  }, [items]);

  const totalExtraSelected =
    fDuration.length +
    fGroupSize.length +
    fCrafts.length +
    fCode.length +
    fInstr.length +
    (mode !== "all" ? 1 : 0) +
    (dateFrom ? 1 : 0) +
    (dateTo ? 1 : 0) +
    (maxPrice ? 1 : 0);

  function toggle(list: string[], setter: (v: string[]) => void, value: string) {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  const locallyFiltered = useMemo(() => {
    if (!items) return null;

    const qLower = q.trim().toLowerCase();
    const fromTs = dateFrom ? new Date(dateFrom + "T00:00:00Z").getTime() : null;
    const toTs = dateTo ? new Date(dateTo + "T23:59:59Z").getTime() : null;
    const maxPriceNum = maxPrice ? Number(maxPrice) : null;

    return items.filter((s) => {
      if (qLower) {
        const hay = [
          s.name,
          s.description,
          s.service_provider,
          s.listing_creator,
          s.service_category,
          s.service_type,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(qLower)) return false;
      }

      if (
        category !== "all" &&
        (s.service_category ?? "").toLowerCase() !== category.toLowerCase()
      ) {
        return false;
      }

      if (
        type !== "all" &&
        (s.service_type ?? "").toLowerCase() !== type.toLowerCase()
      ) {
        return false;
      }

      const m: ModeFilter = isOnline(s.location) ? "online" : "inperson";
      if (mode !== "all" && m !== mode) return false;

      if (fromTs || toTs) {
        if (!s.datetime) return false;
        const ts = new Date(s.datetime).getTime();
        if (fromTs && ts < fromTs) return false;
        if (toTs && ts > toTs) return false;
      }

      if (maxPriceNum !== null) {
        const p = parsePriceEUR(s.price);
        if (p !== null && p > maxPriceNum) return false;
      }

      const g = groupLabel(s.attendee_limit);
      if (fGroupSize.length && !fGroupSize.includes(g)) return false;

      if (fDuration.length) {
        // kestoa ei vielä datassa – placeholder
      }

      const facets = deriveFacets(s);
      const matchesFacet = (selected: string[], values: string[]) =>
        !selected.length || selected.some((x) => values.includes(x));
      if (!matchesFacet(fCrafts, facets.craft)) return false;
      if (!matchesFacet(fCode, facets.code)) return false;
      if (!matchesFacet(fInstr, facets.instrument)) return false;

      return true;
    });
  }, [
    items,
    q,
    category,
    type,
    mode,
    dateFrom,
    dateTo,
    maxPrice,
    fGroupSize,
    fDuration,
    fCrafts,
    fCode,
    fInstr,
  ]);

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="page-shell py-8 md:py-14">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
              {t("services.heroTitle")}
            </h1>
            <p className="mt-3 text-neutral-600 max-w-prose">
              {t("services.heroSubtitle")}
            </p>

            <div className="mt-6 grid gap-3">
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-xl border px-3 py-2 text-sm"
                  placeholder="Haku: nimi, opettaja tai kuvaus"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  className={`rounded-full px-3 py-1 text-sm border transition ${
                    category === "all"
                      ? "bg-black text-white border-black"
                      : "hover:bg-black/5"
                  }`}
                  onClick={() => setCategory("all")}
                >
                  Kaikki kategoriat
                </button>
                {categories.map((c) => (
                  <button
                    key={c}
                    className={`rounded-full px-3 py-1 text-sm border transition ${
                      category === c
                        ? "bg-black text-white border-black"
                        : "hover:bg-black/5"
                    }`}
                    onClick={() => setCategory(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  className="rounded-xl border px-3 py-2 text-sm"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="all">— Tyyppi —</option>
                  {types.map((tVal) => (
                    <option key={tVal} value={tVal}>
                      {tVal}
                    </option>
                  ))}
                </select>

                <select
                  className="rounded-xl border px-3 py-2 text-sm"
                  value={mode}
                  onChange={(e) => setMode(e.target.value as ModeFilter)}
                >
                  <option value="all">— Tila —</option>
                  <option value="online">Etä</option>
                  <option value="inperson">Lähikurssi</option>
                </select>

                <button
                  className="rounded-xl px-3 py-1.5 border"
                  onClick={() => setFiltersOpen(true)}
                >
                  Lisää filttereitä{" "}
                  {totalExtraSelected ? (
                    <span className="ml-1 inline-flex items-center justify-center text-xs rounded-full border px-1.5">
                      {totalExtraSelected}
                    </span>
                  ) : null}
                </button>

                <button
                  className="text-sm underline opacity-80"
                  onClick={() => {
                    setQ("");
                    setCategory("all");
                    setType("all");
                    setMode("all");
                    setDateFrom("");
                    setDateTo("");
                    setMaxPrice("");
                    setFDuration([]);
                    setFGroupSize([]);
                    setFCrafts([]);
                    setFCode([]);
                    setFInstr([]);
                  }}
                >
                  Tyhjennä kaikki
                </button>
              </div>
            </div>
          </div>

          {/* Teaser grid */}
          <div className="relative">
            <div className="rounded-3xl border bg-white p-4 shadow-sm">
              <div className="grid grid-cols-2 gap-3">
                {(locallyFiltered ?? []).slice(0, 4).map((s) => (
                  <div
                    key={s.id}
                    className="rounded-2xl overflow-hidden border"
                  >
                    <img
                      src={
                        s.image ||
                        "https://placehold.co/800x450?text=Kuva"
                      }
                      alt=""
                      className="h-28 w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://placehold.co/800x450?text=Kuva";
                      }}
                    />
                    <div className="p-2">
                      <div className="text-xs text-neutral-600">
                        {s.datetime
                          ? new Date(s.datetime).toLocaleDateString(locale)
                          : t("course.timeTBA")}
                      </div>
                      <div className="text-sm font-semibold line-clamp-2">
                        {s.name}
                      </div>
                    </div>
                  </div>
                ))}
                {(!locallyFiltered || locallyFiltered.length === 0) && (
                  <div className="text-sm text-neutral-500 p-2">
                    {t("services.noPreview")}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tulokset */}
      <section className="page-shell pb-16">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-bold">
            {t("services.resultsTitle")} (
            {locallyFiltered ? locallyFiltered.length : 0})
          </h2>
          <Link
            to="/new"
            className="rounded-xl px-3 py-1.5 border bg-black text-white"
          >
            {t("button.newListing")}
          </Link>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border bg-red-50 text-red-600 p-3">
            {error}
          </div>
        )}
        {!items && <div>{t("services.loading")}</div>}

        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {locallyFiltered?.map((s) => (
            <ServiceCard key={s.id} s={s} onOpen={setDetail} />
          ))}
        </div>
      </section>

      {/* Lisäsuodattimet (ruoka-teeman faceteilla) */}
      <Modal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Lisäsuodattimet"
      >
        <div className="grid md:grid-cols-3 gap-4">
          {/* Päivämäärä */}
          <div className="border rounded-xl p-3">
            <div className="font-semibold text-sm mb-2">Päivämääräväli</div>
            <div className="space-y-2">
              <label className="text-sm flex flex-col gap-1">
                <span>Alkaen</span>
                <input
                  type="date"
                  className="rounded-xl border px-3 py-2 text-sm"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </label>
              <label className="text-sm flex flex-col gap-1">
                <span>Asti</span>
                <input
                  type="date"
                  className="rounded-xl border px-3 py-2 text-sm"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </label>
            </div>
          </div>

          {/* Hinta */}
          <div className="border rounded-xl p-3">
            <div className="font-semibold text-sm mb-2">Maksimihinta (€)</div>
            <input
              type="number"
              min={0}
              className="rounded-xl border px-3 py-2 text-sm w-full"
              placeholder="Esim. 30"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
            <div className="mt-2 text-xs text-neutral-500">
              Huom: hinnat parsitaan tekstistä (esim. "€29").
            </div>
          </div>

          {/* Tila */}
          <div className="border rounded-xl p-3">
            <div className="font-semibold text-sm mb-2">Tila</div>
            <select
              className="rounded-xl border px-3 py-2 text-sm w-full"
              value={mode}
              onChange={(e) => setMode(e.target.value as ModeFilter)}
            >
              <option value="all">Kaikki</option>
              <option value="online">Etä</option>
              <option value="inperson">Lähikurssi</option>
            </select>
          </div>

          {/* Ryhmäkoko */}
          <div className="border rounded-xl p-3">
            <div className="font-semibold text-sm mb-2">
              {FACETS.groupSize.label}
            </div>
            <div className="space-y-2">
              {FACETS.groupSize.values.map((g) => (
                <label key={g} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={fGroupSize.includes(g)}
                    onChange={() => toggle(fGroupSize, setFGroupSize, g)}
                  />
                  <span>{g}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Kesto */}
          <div className="border rounded-xl p-3">
            <div className="font-semibold text-sm mb-2">Kesto</div>
            <div className="space-y-2">
              {DURATION_BUCKETS.map((b) => (
                <label key={b.key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={fDuration.includes(b.key)}
                    onChange={() => toggle(fDuration, setFDuration, b.key)}
                  />
                  <span>{b.label}</span>
                </label>
              ))}
            </div>
            <div className="mt-2 text-xs text-neutral-500">
              Huom: kestoa ei vielä ole datassa – tämä on valmiina tulevaa
              varten.
            </div>
          </div>

          {/* Kurssin teema */}
          <div className="border rounded-xl p-3">
            <div className="font-semibold text-sm mb-2">
              {FACETS.crafts.label}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {FACETS.crafts.values.map((v) => (
                <label key={v} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={fCrafts.includes(v)}
                    onChange={() => toggle(fCrafts, setFCrafts, v)}
                  />
                  <span>{v}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Keittiötyyli */}
          <div className="border rounded-xl p-3">
            <div className="font-semibold text-sm mb-2">
              {FACETS.code.label}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {FACETS.code.values.map((v) => (
                <label key={v} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={fCode.includes(v)}
                    onChange={() => toggle(fCode, setFCode, v)}
                  />
                  <span>{v}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Ruokavalio */}
          <div className="border rounded-xl p-3">
            <div className="font-semibold text-sm mb-2">
              {FACETS.instruments.label}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {FACETS.instruments.values.map((v) => (
                <label key={v} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={fInstr.includes(v)}
                    onChange={() => toggle(fInstr, setFInstr, v)}
                  />
                  <span>{v}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            className="rounded-xl px-3 py-1.5 border"
            onClick={() => {
              setDateFrom("");
              setDateTo("");
              setMaxPrice("");
              setMode("all");
              setFDuration([]);
              setFGroupSize([]);
              setFCrafts([]);
              setFCode([]);
              setFInstr([]);
            }}
          >
            Tyhjennä lisäfiltterit
          </button>
          <button
            className="rounded-xl px-3 py-1.5 border bg-black text-white"
            onClick={() => setFiltersOpen(false)}
          >
            Sulje
          </button>
        </div>
      </Modal>

      {/* Detail-modal yhteiskomponentilla */}
      
        {detail && (
        <ServiceDetailModal
          service={detail}
          onClose={() => setDetail(null)}
        />
      )}
    </main>
  );
}
