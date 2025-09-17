/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState } from "react";
import {
  createService,
  getService,
  updateService,
  type CreateListedService,
  type UpdateListedService,
} from "../features/services/api.services";
import type { ListedService } from "../types";
import { useNavigate, useParams } from "react-router-dom";
import type { FormEvent } from "react";
import { toMessage } from "../lib/error";

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
  const [item, setItem] = useState<ListedService>(empty);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isNew && id) {
      (async () => {
        try {
          setItem(await getService(id));
        } catch (e: unknown) {
          setError(toMessage(e));
        }
      })();
    }
  }, [id, isNew]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (isNew) {
        // jätetään id/created/updated pois
        const { id: _id, created: _created, updated: _updated, ...rest } = item;
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

  return (
    <div className="container">
      <h1>{isNew ? "Uusi listaus" : "Muokkaa listausta"}</h1>
      {error && <div className="error">{error}</div>}
      <form className="card form" onSubmit={onSubmit}>
        <label>Nimi</label>
        <input
          value={item.name}
          onChange={(e) => setItem({ ...item, name: e.target.value })}
          required
        />

        <label>Kuvaus</label>
        <textarea
          value={item.description}
          onChange={(e) => setItem({ ...item, description: e.target.value })}
          required
        />

        <label>Aika (ISO, tyhjä = ei asetettu)</label>
        <input
          placeholder="2025-09-15T22:20:50Z"
          value={item.datetime ?? ""}
          onChange={(e) =>
            setItem({ ...item, datetime: e.target.value || null })
          }
        />

        <label>Sijainti (osoite tai linkki)</label>
        <input
          value={item.location ?? ""}
          onChange={(e) => setItem({ ...item, location: e.target.value })}
        />

        <label>Opettaja / palveluntarjoaja</label>
        <input
          value={item.service_provider}
          onChange={(e) =>
            setItem({ ...item, service_provider: e.target.value })
          }
        />

        <label>Listauksen luoja</label>
        <input
          value={item.listing_creator}
          onChange={(e) =>
            setItem({ ...item, listing_creator: e.target.value })
          }
        />

        <label>Hinta (teksti)</label>
        <input
          value={item.price}
          onChange={(e) => setItem({ ...item, price: e.target.value })}
        />

        <label>Tyyppi</label>
        <select
          value={item.service_type}
          onChange={(e) =>
            setItem({ ...item, service_type: e.target.value })
          }
        >
          <option value="1on1">1on1</option>
          <option value="group">group</option>
          <option value="pre-recorded">pre-recorded</option>
          <option value="study material">study material</option>
        </select>

        <label>Osallistujaraja</label>
        <input
          value={item.attendee_limit}
          onChange={(e) =>
            setItem({ ...item, attendee_limit: e.target.value })
          }
        />

        <label>Kategoria</label>
        <input
          value={item.service_category}
          onChange={(e) =>
            setItem({ ...item, service_category: e.target.value })
          }
        />

        <label>Kansikuva (URL)</label>
        <input
          value={item.image ?? ""}
          onChange={(e) => setItem({ ...item, image: e.target.value })}
        />

        <div className="actions">
          <button type="submit" className="btn" disabled={saving}>
            {saving ? "Tallennetaan…" : "Tallenna"}
          </button>
        </div>
      </form>
    </div>
  );
}
