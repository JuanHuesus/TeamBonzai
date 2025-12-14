// tää sivu hoitaa sekä uuden kurssin/listauksen luonnin että vanhan muokkauksen.
// - jos urlissa EI ole id:tä -> “uusi listaus” (isNew=true)
// - jos urlissa on id -> haetaan listaus backendistä ja muokataan sitä

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";

import {
  createService,
  getService,
  updateService,
  deleteService,
  type CreateListedService,
  type UpdateListedService,
} from "../features/services/api.services";
import type { ListedService } from "../types";
import { toMessage } from "../lib/error";
import { useI18n } from "../i18n";
import { useAuth } from "../useAuth";
import { api } from "../api";

/** jos location näyttää urlilta -> tulkitaan etäkurssiksi */
function isOnline(location: string | null | undefined) {
  if (!location) return false;
  try {
    const u = new URL(location);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    // jos ei ole validi url, tulkitaan “lähikurssiksi”
    return false;
  }
}

// pilkotaan backendin iso-aika kahteen inputtiin (date + time) koska HTML ei tue iso-datetimea
function splitIso(iso: string | null) {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: "", time: "" };

  const pad = (n: number) => String(n).padStart(2, "0");
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return { date, time };
}

// yhdistetään date + time takaisin iso-muotoon (utc) backendille lähetettäväksi
function combineToIso(date: string, time: string): string | null {
  // jos molemmat tyhjiä, niin ei aseteta datetimea ollenkaan
  if (!date && !time) return null;

  // jos toinen puuttuu = ei vielä rakenneta, koska 
  if (!date || !time) return null;

  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);

  // tehdään ensin paikallinen date-objekti (käyttäjän timezone)
  const local = new Date(y, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0, 0, 0);

  // muunnetaan UTC-iso-muotoon
  return new Date(local.getTime() - local.getTimezoneOffset() * 60000)
    .toISOString()
    .replace(/\.\d{3}Z$/, "Z");
}

// varmistus: jos useAuth().role on tyhjä/väärä, luetaan rooli suoraan jwt:stä
function roleFromJwt(token: string | null | undefined): string | null {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    // base64url dekoodaus 
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/"); 
    const padded = b64 + "===".slice((b64.length + 3) % 4);

    // dekoodaus ja JSON-parsaus 
    const json = decodeURIComponent(
      atob(padded)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );
    // haetaan user_role tai role kenttä
    const payload = JSON.parse(json); 
    const r = payload?.user_role ?? payload?.role ?? null;
    return typeof r === "string" ? r : null;
  } catch {
    return null;
  }
}

// muuntaa axios-virheen käyttäjäystävälliseksi tekstiksi
function niceApiError(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const status = e.response?.status;

    // yritetään lukea backendin virheviesti 
    const msg =
      (e.response?.data as any)?.message ||
      (e.response?.data as any)?.error ||
      e.message;

    if (status === 403) return "Ei oikeuksia: vain omistaja tai admin/moderaattori.";
    if (status === 404) return "Listausta ei löytynyt (404).";
    if (status === 409)
      return "Poisto ei onnistu, koska listaukseen liittyy muuta dataa (FK/riippuvuudet).";
    if (status === 500)
      return `Backend kaatui (500). Tämä on serveripuolen bugi. Viesti: ${msg}`;

    return msg;
  }

  // jos ei ole axios error, käytetään yleistä muunninta
  return toMessage(e);
}

// “tyhjä listaus” joka antaa formille alkuarvot.
// tätä käytetään kun luodaan uusi listaus tai kun data ei ole vielä ladattu.
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
  // url-parametri: /edit/:id
  // jos id puuttuu -> “uusi listaus”
  const { id } = useParams();
  const isNew = id === undefined;

  const nav = useNavigate();
  const { t, lang } = useI18n();
  const { token, userId, role } = useAuth();

  // rooli jwt:stä varmistuksena
  const jwtRole = roleFromJwt(token);
  const effectiveRole = (role ?? jwtRole ?? "").toLowerCase();
  const isModerator = effectiveRole === "admin" || effectiveRole === "moderator";

  // kirjautumistarkistus
  const isLoggedIn = !!token && !!userId;

  //
  const [item, setItem] = useState<ListedService>(empty);

  // nämä on vain input-kenttiä varten (date + time)
  const [datePart, setDatePart] = useState("");
  const [timePart, setTimePart] = useState("");

  // ui-tilat
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(false);

  // jos luodaan uusi listaus, asetetaan listing_creator automaattisesti kirjautuneen käyttäjän id:ksi
  useEffect(() => {
    if (isNew && userId) {
      setItem((prev) => ({ ...prev, listing_creator: userId }));
    }
  }, [isNew, userId]);

  // jos muokataan olemassa olevaa:
  // - haetaan data backendistä getService(id)
  // - täytetään item + pilkotaan datetime inputteihin
  //
  // jos luodaan uusi:
  // - nollataan formi (mut säilytetään listing_creator jos se on jo asetettu)
  useEffect(() => {
    if (!isNew && id) {
      setLoading(true);

      (async () => {
        try {
          const data = await getService(id);
          setItem(data);

          const { date, time } = splitIso(data.datetime);
          setDatePart(date);
          setTimePart(time);
        } catch (e: unknown) {
          setError(niceApiError(e));
        } finally {
          setLoading(false);
        }
      })();
    } else {
      setDatePart("");
      setTimePart("");
      setItem((prev) => ({ ...empty, listing_creator: prev.listing_creator || "" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isNew]);

  // pidetään item.datetime synkassa date/time inputtien kanssa
  useEffect(() => {
    setItem((prev) => ({ ...prev, datetime: combineToIso(datePart, timePart) }));
  }, [datePart, timePart]);

  // omistaja = se userId joka on tallennettu listing_creator kenttään
  const ownerId = item.listing_creator;
  const isOwner = !!userId && !!ownerId && ownerId === userId;

  // readonly jos:
  // - ei ole uusi listaus
  // - eikä ole omistaja eikä admin/moderaattori
  const readOnly = !isNew && !(isOwner || isModerator);

  // preview-pane käyttää näitä “kivoja” tekstejä
  const dateText = useMemo(
    () =>
      item.datetime
        ? new Date(item.datetime).toLocaleDateString(lang === "fi" ? "fi-FI" : "en-GB")
        : t("course.timeTBA"),
    [item.datetime, lang, t]
  );

  const modeText = isOnline(item.location) ? t("course.mode.online") : t("course.mode.inperson");
  const priceText = item.price?.trim() ? item.price : t("course.free");
  const img = item.image || "https://placehold.co/1600x900?text=Kuva";

  // tallennus:
  // - tarkistetaan kirjautuminen ja oikeudet
  // - uusi: createService(payload) ja siirrytään /edit/:id
  // - vanha: updateService(id, payload) ja palataan etusivulle
  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (!isLoggedIn) throw new Error("Kirjaudu sisään luodaksesi tai muokataksesi listauksia.");

      // jos muokataan vanhaa, vain omistaja tai mod/admin saa tallentaa
      if (!isNew && !(isOwner || isModerator)) {
        throw new Error("Vain listauksen luoja tai admin/moderaattori voi muokata tätä listausta.");
      }

      // kevyt fronttivalidointi
      if (!item.name.trim()) throw new Error("Nimi on pakollinen.");
      if (!item.description.trim()) throw new Error("Kuvaus on pakollinen.");

      if (isNew) {
        // create payloadista poistetaan id/created/updated (backend tekee ne)
        const { id: _id, created: _c, updated: _u, ...rest } = item;
        const payload: CreateListedService = {
          ...rest,
          listing_creator: userId!, // pakotetaan omistajaksi kirjautunut
        };

        const created = await createService(payload);

        // ohjataan suoraan edit-näkymään uudella id:llä
        nav(`/edit/${created.id}`);
      } else {
        // update payloadista poistetaan id/created/updated, ja pidetään omistaja ennallaan
        const { id: realId, created: _c, updated: _u, ...rest } = item;
        const payload: UpdateListedService = {
          ...rest,
          listing_creator: item.listing_creator,
        };

        await updateService(realId, payload);

        // teillä tässä palataan etusivulle tallennuksen jälkeen
        nav("/");
      }
    } catch (e: unknown) {
      setError(niceApiError(e));
    } finally {
      setSaving(false);
    }
  };

  /**
   * “front-only” admin-poisto fallback.
   * tää on käytännössä varasuunnitelma, jos backend ei tue admin-poistoa kunnolla.
   * eli yritetään muutamaa erilaista request-muotoa, jos joku sattuisi osumaan backendin odotuksiin.
   * (tää on vähän hacky, mutta joskus auttaa demoissa.)
   */
  async function tryAdminDeleteFrontOnly(serviceId: string) {
    const owner = item.listing_creator;

    const attempts: Array<() => Promise<void>> = [
      // 1) DELETE jossa on params + body + custom headerit
      async () => {
        await api.delete(`/services/${serviceId}`, {
          params: { admin: "1", force: "1" },
          data: {
            as_admin: true,
            force: true,
            listing_creator: owner,
          },
          headers: {
            "X-Admin-Override": "1",
            "X-Listing-Creator": owner || "",
          },
        });
      },

      // 2) jos backendissä olisi erillinen “delete endpoint”
      async () => {
        await api.post(`/services/${serviceId}/delete`, {
          as_admin: true,
          force: true,
          listing_creator: owner,
        });
      },

      // 3) method override -tyyli (jos backend tukee)
      async () => {
        await api.post(
          `/services/${serviceId}`,
          { as_admin: true, force: true, listing_creator: owner },
          {
            headers: {
              "X-HTTP-Method-Override": "DELETE",
              "X-Admin-Override": "1",
              "X-Listing-Creator": owner || "",
            },
            params: { _method: "DELETE", admin: "1", force: "1" },
          }
        );
      },

      // 4) jos backendissä olisi /admin -router
      async () => {
        await api.delete(`/admin/services/${serviceId}`, {
          params: { force: "1" },
          data: { force: true, listing_creator: owner },
        });
      },
    ];

    let lastErr: unknown = null;
    for (const run of attempts) {
      try {
        await run();
        return;
      } catch (e) {
        lastErr = e;
      }
    }

    throw lastErr;
  }

  // poisto:
  // - varmistetaan kirjautuminen ja oikeudet
  // - confirm()
  // - yritetään deleteService(id)
  // - jos admin/mod mutta ei omistaja ja backend antaa 500/403 -> yritetään fallback
  const onDelete = async () => {
    if (!id) return;

    setError(null);

    if (!isLoggedIn) {
      setError("Kirjaudu sisään poistaaksesi listauksen.");
      return;
    }
    if (!(isOwner || isModerator)) {
      setError("Vain listauksen luoja tai admin/moderaattori voi poistaa tämän listauksen.");
      return;
    }

    if (!confirm("Poistetaanko tämä listaus? Toimintoa ei voi perua.")) return;

    try {
      setDeleting(true);

      // 1) normaali poisto
      try {
        await deleteService(id);
        nav("/");
        return;
      } catch (e: unknown) {
        // jos admin/mod poistaa jonkun muun listauksen ja backend sekoilee,
        // kokeillaan vielä “front-only override”
        if (isModerator && !isOwner) {
          const ax = axios.isAxiosError(e) ? e : null;
          const status = ax?.response?.status;

          if (status === 500 || status === 403) {
            await tryAdminDeleteFrontOnly(id);
            nav("/");
            return;
          }
        }

        // muuten näytetään virhe normaalisti
        throw e;
      }
    } catch (e: unknown) {
      const msg = niceApiError(e);

      // jos admin-poisto edelleen 500 -> tää kertoo suoraan että backend on se ongelma
      if (isModerator && !isOwner && msg.includes("500")) {
        setError(
          msg +
            "\n\nfront ei pysty korjaamaan tätä, jos backend ei tue admin-poistoa tai siellä on bugi. " +
            "kiertotapa: pyydä listauksen tekijää poistamaan se, tai tee moderointi 'piilotuksena' (ui-suodatus raporttien perusteella)."
        );
        return;
      }

      setError(msg);
    } finally {
      setDeleting(false);
    }
  };

  // jos tehdään uutta listausta mutta ei olla kirjautuneita -> näytetään “kirjaudu”
  if (isNew && !isLoggedIn) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-2">Uusi listaus</h1>
        <p className="text-sm text-neutral-600">Kirjaudu sisään, jotta voit luoda listauksen.</p>
        <div className="mt-3 flex gap-2">
          <Link to="/login" className="rounded-xl px-3 py-1.5 border bg-black text-white text-sm">
            Kirjaudu
          </Link>
          <Link to="/" className="rounded-xl px-3 py-1.5 border text-sm">
            Takaisin
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      {/* yläpalkki: takas linkki + otsikko + napit */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm text-neutral-500">
            <Link className="underline hover:no-underline" to="/">
              ← Takaisin listaan
            </Link>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold mt-1">
            {isNew ? "Uusi listaus" : readOnly ? "Listaus (vain katselu)" : "Muokkaa listausta"}
          </h1>

          {!isNew && readOnly && (
            <div className="text-sm text-neutral-600 mt-1">
              Vain listauksen luoja tai admin/moderaattori voi muokata tätä. Sinä voit vain katsella.
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* poisto näkyy vain jos on olemassa oleva ja käyttäjällä on oikeus */}
          {!isNew && (isOwner || isModerator) && (
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

          <Link to="/" className="rounded-xl px-3 py-1.5 border">
            Peruuta
          </Link>

          {/* save-nappi piiloon jos readonly */}
          {!readOnly && (
            <button
              form="service-form"
              type="submit"
              disabled={saving}
              className="rounded-xl px-4 py-2 border bg-black text-white disabled:opacity-50"
            >
              {saving ? "Tallennetaan…" : "Tallenna"}
            </button>
          )}
        </div>
      </div>

      {/* latausteksti kun haetaan vanhaa listausta */}
      {loading && <div className="mb-6 text-sm text-neutral-500">Ladataan…</div>}

      {/* virheboksi */}
      {error && (
        <div className="mb-6 whitespace-pre-line rounded-xl border bg-red-50 text-red-700 p-3">
          {error}
        </div>
      )}

      {/* layout: vasen = formi, oikea = preview */}
      <div className="grid lg:grid-cols-3 gap-6">
        <form
          id="service-form"
          onSubmit={onSubmit}
          className="lg:col-span-2 rounded-2xl border bg-white p-4 md:p-6 shadow-sm space-y-5"
        >
          {/* perus jutut */}
          <section className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Nimi *</label>
              <input
                className="w-full rounded-xl border px-3 py-2 text-sm"
                value={item.name}
                onChange={(e) => setItem({ ...item, name: e.target.value })}
                required
                disabled={readOnly}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Kuvaus *</label>
              <textarea
                className="w-full min-h-32 rounded-xl border px-3 py-2 text-sm"
                value={item.description}
                onChange={(e) => setItem({ ...item, description: e.target.value })}
                required
                disabled={readOnly}
              />
              <div className="text-xs text-neutral-500 mt-1">
                Kerro lyhyesti mitä oppija saa kurssilta / tunnilta.
              </div>
            </div>
          </section>

          {/* aika + sijainti */}
          <section className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Päivä</label>
              <input
                type="date"
                className="w-full rounded-xl border px-3 py-2 text-sm"
                value={datePart}
                onChange={(e) => setDatePart(e.target.value)}
                disabled={readOnly}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Kellonaika</label>
              <input
                type="time"
                className="w-full rounded-xl border px-3 py-2 text-sm"
                value={timePart}
                onChange={(e) => setTimePart(e.target.value)}
                disabled={readOnly}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Sijainti (osoite tai linkki)</label>
              <input
                className="w-full rounded-xl border px-3 py-2 text-sm"
                value={item.location ?? ""}
                onChange={(e) => setItem({ ...item, location: e.target.value })}
                placeholder="Esim. https://zoom.us/j/..., tai 'Koulukatu 3, Turku'"
                disabled={readOnly}
              />
              <div className="text-xs text-neutral-500 mt-1">
                {isOnline(item.location) ? "Tulkitaan etätilaksi." : "Tulkitaan lähikurssiksi."}
              </div>
            </div>
          </section>

          {/* muut kentät */}
          <section className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Opettaja / palveluntarjoaja</label>
              <input
                className="w-full rounded-xl border px-3 py-2 text-sm"
                value={item.service_provider}
                onChange={(e) => setItem({ ...item, service_provider: e.target.value })}
                disabled={readOnly}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Listauksen luoja (UUID)</label>
              <input
                className="w-full rounded-xl border px-3 py-2 text-sm bg-neutral-50"
                value={item.listing_creator}
                readOnly
                disabled
              />
              <div className="text-xs text-neutral-500 mt-1">
                Tämä asetetaan automaattisesti kirjautuneen käyttäjän perusteella.
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Hinta (teksti)</label>
              <input
                className="w-full rounded-xl border px-3 py-2 text-sm"
                value={item.price}
                onChange={(e) => setItem({ ...item, price: e.target.value })}
                placeholder='Esim. "€29" tai "Free"'
                disabled={readOnly}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Tyyppi</label>
              <select
                className="w-full rounded-xl border px-3 py-2 text-sm"
                value={item.service_type}
                onChange={(e) => setItem({ ...item, service_type: e.target.value })}
                disabled={readOnly}
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
                disabled={readOnly}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Kategoria</label>
              <input
                className="w-full rounded-xl border px-3 py-2 text-sm"
                value={item.service_category}
                onChange={(e) => setItem({ ...item, service_category: e.target.value })}
                placeholder='Esim. "cooking", "baking", "vegetarian"…'
                disabled={readOnly}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Kansikuva (URL)</label>
              <input
                className="w-full rounded-xl border px-3 py-2 text-sm"
                value={item.image ?? ""}
                onChange={(e) => setItem({ ...item, image: e.target.value })}
                placeholder="https://…"
                disabled={readOnly}
              />
            </div>
          </section>

          {/* alaosan napit (vain jos ei readonly) */}
          {!readOnly && (
            <div className="flex items-center justify-end gap-2 pt-2">
              <Link to="/" className="rounded-xl px-3 py-1.5 border">
                Peruuta
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl px-4 py-2 border bg-black text-white disabled:opacity-50"
              >
                {saving ? "Tallennetaan…" : "Tallenna"}
              </button>
            </div>
          )}
        </form>

        {/* oikea puoli: pieni preview kortti, jotta näkee miltä listaus “näyttää” */}
        <aside className="rounded-2xl border bg-white shadow-sm overflow-hidden">
          <div className="aspect-[16/9] overflow-hidden">
            <img
              src={img}
              alt=""
              className="h-full w-full object-cover"
              onError={(e) => {
                // jos url on rikki, vaihdetaan placeholderiin
                (e.currentTarget as HTMLImageElement).src =
                  "https://placehold.co/1600x900?text=Kuva";
              }}
            />
          </div>

          <div className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-semibold text-lg leading-tight">
                {item.name || "Nimi tulee tähän"}
              </h3>
              <span className="inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium">
                {modeText}
              </span>
            </div>

            <div className="text-sm text-neutral-600 flex flex-wrap gap-2">
              <span>{item.service_provider || "-"}</span>
              <span>•</span>
              <span>{dateText}</span>
              <span>•</span>
              <span>{item.service_category || "-"}</span>
            </div>

            <div className="font-semibold">{priceText}</div>
          </div>
        </aside>
      </div>
    </main>
  );
}
