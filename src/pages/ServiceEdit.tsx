import { useEffect, useMemo, useState } from "react";
import {
  createService,
  getService,
  updateService,
  deleteService,
  type CreateListedService,
  type UpdateListedService,
} from "../features/services/api.services";
import type { ListedService } from "../types";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { FormEvent } from "react";
import { toMessage } from "../lib/error";
import { useI18n } from "../i18n";


/** Palauttaa true jos location on URL → tulkitaan etätilaksi */
function isOnline(location: string | null | undefined) {
  if (!location) return false;
  try {
    const u = new URL(location);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** Pilko ISO -> YYYY-MM-DD + HH:mm (paikallinen) */
function splitIso(iso: string | null) {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: "", time: "" };
  const pad = (n: number) => String(n).padStart(2, "0");
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return { date, time };
}

/** Rakenna ISO UTC:na YYYY-MM-DD + HH:mm -> 2025-07-01T10:30:00Z */
function combineToIso(date: string, time: string): string | null {
  if (!date && !time) return null;
  if (!date || !time) return null; // ei lähetetä puolikasta aikaa
  // muodosta paikallisen aikavyöhykkeen aika ja käännä UTC:ksi
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const local = new Date(y, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0, 0, 0);
  return new Date(local.getTime() - local.getTimezoneOffset() * 60000).toISOString().replace(/\.\d{3}Z$/, "Z");
}

const empty: ListedService = {
  id: "",
  name: "",
  description: "",
  datetime: null,
  location: "",
  service_provider: "",
  listing_creator: "",
  price: "",
  service_type: "1on1",
  attendee_limit: "1",
  service_category: "",
  image: "",
  created: new Date().toISOString(),
  updated: new Date().toISOString(),
};

export default function ServiceEdit() {
  const { id } = useParams();
  const isNew = id === undefined;
  const nav = useNavigate();
  const { t, lang } = useI18n();


  const [item, setItem] = useState<ListedService>(empty);
  const [datePart, setDatePart] = useState("");
  const [timePart, setTimePart] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Lataa olemassa oleva kohde
  useEffect(() => {
    if (!isNew && id) {
      (async () => {
        try {
          const data = await getService(id);
          setItem(data);
          const { date, time } = splitIso(data.datetime);
          setDatePart(date);
          setTimePart(time);
        } catch (e: unknown) {
          setError(toMessage(e));
        }
      })();
    } else {
      // uusi: nollaa aikaosat
      setDatePart("");
      setTimePart("");
      setItem(empty);
    }
  }, [id, isNew]);

  // Päivitä item.datetime kun paikallisia kenttiä muokataan
  useEffect(() => {
    setItem((prev) => ({ ...prev, datetime: combineToIso(datePart, timePart) }));
  }, [datePart, timePart]);

  // Pieniä johdettuja arvoja esikatseluun
  const dateText = useMemo(
    () =>
      item.datetime
        ? new Date(item.datetime).toLocaleDateString(
            lang === "fi" ? "fi-FI" : "en-GB"
          )
        : t("course.timeTBA"),
    [item.datetime, lang, t]
  );
const modeText = isOnline(item.location)
    ? t("course.mode.online")
    : t("course.mode.inperson");
  const priceText = item.price?.trim() ? item.price : t("course.free");
  const img = item.image || "https://placehold.co/1600x900?text=Kuva";

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // minimivalidaatio
      if (!item.name.trim()) throw new Error("Nimi on pakollinen.");
      if (!item.description.trim()) throw new Error("Kuvaus on pakollinen.");

      if (isNew) {
        const { id: _id, created: _c, updated: _u, ...rest } = item;
        const payload: CreateListedService = rest;
        const created = await createService(payload);
        nav(`/edit/${created.id}`);
      } else {
        const { id: realId, created: _c, updated: _u, ...rest } = item;
        const payload: UpdateListedService = rest;
        await updateService(realId, payload);
        nav("/");
      }
    } catch (e: unknown) {
      setError(toMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!id) return;
    if (!confirm("Poistetaanko tämä listaus? Toimintoa ei voi perua.")) return;
    try {
      setDeleting(true);
      await deleteService(id);
      nav("/");
    } catch (e: unknown) {
      setError(toMessage(e));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      {/* Otsikko + palaaminen */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm text-neutral-500">
            <Link className="underline hover:no-underline" to="/">← Takaisin listaan</Link>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mt-1">
            {isNew ? "Uusi listaus" : "Muokkaa listausta"}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {!isNew && (
            <button
              type="button"
              onClick={onDelete}
              disabled={deleting || saving}
              className="rounded-xl px-3 py-1.5 border text-red-600 disabled:opacity-50"
              title="Poista listaus"
            >
              {deleting ? "Poistetaan…" : "Poista"}
            </button>
          )}
          <Link to="/" className="rounded-xl px-3 py-1.5 border">Peruuta</Link>
          <button
            form="service-form"
            type="submit"
            disabled={saving}
            className="rounded-xl px-4 py-2 border bg-black text-white disabled:opacity-50"
          >
            {saving ? "Tallennetaan…" : "Tallenna"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border bg-red-50 text-red-700 p-3">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Lomake */}
        <form id="service-form" onSubmit={onSubmit} className="lg:col-span-2 rounded-2xl border bg-white p-4 md:p-6 shadow-sm space-y-5">
          {/* Perustiedot */}
          <section className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Nimi *</label>
              <input
                className="w-full rounded-xl border px-3 py-2 text-sm"
                value={item.name}
                onChange={(e) => setItem({ ...item, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Kuvaus *</label>
              <textarea
                className="w-full min-h-32 rounded-xl border px-3 py-2 text-sm"
                value={item.description}
                onChange={(e) => setItem({ ...item, description: e.target.value })}
                required
              />
              <div className="text-xs text-neutral-500 mt-1">
                Kerro lyhyesti mitä oppija saa kurssilta / tunnilta.
              </div>
            </div>
          </section>

          {/* Aika & paikka */}
          <section className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Päivä</label>
              <input
                type="date"
                className="w-full rounded-xl border px-3 py-2 text-sm"
                value={datePart}
                onChange={(e) => setDatePart(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Kellonaika</label>
              <input
                type="time"
                className="w-full rounded-xl border px-3 py-2 text-sm"
                value={timePart}
                onChange={(e) => setTimePart(e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Sijainti (osoite tai linkki)</label>
              <input
                className="w-full rounded-xl border px-3 py-2 text-sm"
                value={item.location ?? ""}
                onChange={(e) => setItem({ ...item, location: e.target.value })}
                placeholder="Esim. https://zoom.us/j/..., tai 'Koulukatu 3, Turku'"
              />
              <div className="text-xs text-neutral-500 mt-1">
                {isOnline(item.location) ? "Tulkitaan etätilaksi." : "Tulkitaan lähikurssiksi."}
              </div>
            </div>
          </section>

          {/* Metatiedot */}
          <section className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Opettaja / palveluntarjoaja</label>
              <input
                className="w-full rounded-xl border px-3 py-2 text-sm"
                value={item.service_provider}
                onChange={(e) => setItem({ ...item, service_provider: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Listauksen luoja</label>
              <input
                className="w-full rounded-xl border px-3 py-2 text-sm"
                value={item.listing_creator}
                onChange={(e) => setItem({ ...item, listing_creator: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Hinta (teksti)</label>
              <input
                className="w-full rounded-xl border px-3 py-2 text-sm"
                value={item.price}
                onChange={(e) => setItem({ ...item, price: e.target.value })}
                placeholder='Esim. "€29" tai "Free"'
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tyyppi</label>
              <select
                className="w-full rounded-xl border px-3 py-2 text-sm"
                value={item.service_type}
                onChange={(e) => setItem({ ...item, service_type: e.target.value })}
              >
                <option value="1on1">1on1</option>
                <option value="group">group</option>
                <option value="pre-recorded">pre-recorded</option>
                <option value="study material">study material</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Osallistujaraja</label>
              <input
                className="w-full rounded-xl border px-3 py-2 text-sm"
                value={item.attendee_limit}
                onChange={(e) => setItem({ ...item, attendee_limit: e.target.value })}
                placeholder='Esim. "1" tai "unlimited"'
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Kategoria</label>
              <input
                className="w-full rounded-xl border px-3 py-2 text-sm"
                value={item.service_category}
                onChange={(e) => setItem({ ...item, service_category: e.target.value })}
                placeholder='Esim. "cooking", "baking", "vegetarian"…'
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Kansikuva (URL)</label>
              <input
                className="w-full rounded-xl border px-3 py-2 text-sm"
                value={item.image ?? ""}
                onChange={(e) => setItem({ ...item, image: e.target.value })}
                placeholder="https://…"
              />
            </div>
          </section>

          {/* Alapalkin napit mobiilissa (varmistaa että on aina näkyvissä) */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Link to="/" className="rounded-xl px-3 py-1.5 border">Peruuta</Link>
            <button type="submit" disabled={saving} className="rounded-xl px-4 py-2 border bg-black text-white disabled:opacity-50">
              {saving ? "Tallennetaan…" : "Tallenna"}
            </button>
          </div>
        </form>

        {/* Esikatselu / oikea palsta */}
        <aside className="rounded-2xl border bg-white shadow-sm overflow-hidden">
          <div className="aspect-[16/9] overflow-hidden">
            <img
              src={img}
              alt=""
              className="h-full w-full object-cover"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = "https://placehold.co/1600x900?text=Kuva"; }}
            />
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-semibold text-lg leading-tight">{item.name || "Nimi tulee tähän"}</h3>
              <span className="inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium">
                {modeText}
              </span>
            </div>
            <div className="text-sm text-neutral-600 flex flex-wrap gap-2">
              <span> {item.service_provider || "-"}</span>
              <span>•</span>
              <span> {dateText}</span>
              <span>•</span>
              <span> {item.service_category || "-"}</span>
            </div>
            <div className="font-semibold">{priceText}</div>
          </div>
        </aside>
      </div>
    </main>
  );
}
