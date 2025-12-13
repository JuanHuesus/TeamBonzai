import { useState, type FormEvent } from "react";
import { useI18n } from "../../i18n";
import { useAuth } from "../../useAuth";
import { toMessage } from "../../lib/error";
import { postListingRating, postUserRating } from "../ratings/api.ratings";

/**
 * Target-tyypit kertovat, mihin palautetta annetaan.
 * - listing = kurssi / palvelu / listaus
 * - user = kurssin vetäjä / käyttäjä
 *
 * Näin sama lomake voidaan käyttää kahteen eri tarkoitukseen.
 */
type ListingTarget = {
  kind: "listing";
  listingId: string;
  listingName: string;
};

type UserTarget = {
  kind: "user";
  userId: string;
  userName?: string;
};

type Props = {
  // target voi olla jompikumpi: kurssi tai käyttäjä
  target: ListingTarget | UserTarget;

  // vapaaehtoinen callback, jota vanhempi komponentti voi käyttää esim.
  // sulkeakseen modaalin tai päivittääkseen listan onnistuneen lähetyksen jälkeen
  onSubmitted?: () => void;
};

/**
 * FeedbackForm on yhteinen palautelomake sekä kurssille että kurssin vetäjälle.
 * Tämä komponentti:
 * - näyttää tähdet + kommenttikentän
 * - validoi syötteen (1–5 tähteä)
 * - vaatii kirjautumisen (token)
 * - lähettää datan backendille (kahdella eri API-kutsulla targetin mukaan)
 */
export default function FeedbackForm({ target, onSubmitted }: Props) {
  // t(key) hakee oikean kielisen tekstin UI:hin
  const { t } = useI18n();

  // token kertoo onko käyttäjä kirjautunut (ja sillä todennäköisesti todistetaan backendille käyttäjä)
  const { token } = useAuth();

  // Lomakkeen kenttien tilat (React state)
  // HUOM: stars on string, koska <select> antaa arvot merkkijonona
  const [stars, setStars] = useState<string>("");
  const [comment, setComment] = useState<string>("");

  // UI-tilat: lähetys käynnissä, virheviesti, onnistumisen merkki
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  /**
   * Lomakkeen submit-handler:
   * - estää selaimen oletus-submitin (ei sivun refreshia)
   * - validoi tähdet
   * - tarkistaa että käyttäjä on kirjautunut
   * - lähettää tiedot backendille
   * - näyttää onnistumisen tai virheen
   */
  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // estää perinteisen lomakkeen lähetyksen
    setError(null);     // nollaa vanhat virheet
    setDone(false);     // nollaa "kiitos" -teksti ennen uutta lähetystä

    // Muutetaan stars-merkkijono numeroksi
    const n = Number(stars);

    // Perusvalidointi: täytyy olla 1–5 ja oikea numero
    if (!Number.isFinite(n) || n < 1 || n > 5) {
      setError(t("feedback.errorStars"));
      return;
    }

    // Jos ei tokenia, käyttäjä ei ole kirjautunut → ei lähetetä
    if (!token) {
      setError(t("feedback.errorLoginRequired"));
      return;
    }

    setSubmitting(true);
    try {
      // Valitaan API-kutsu sen mukaan, annetaanko palaute kurssille vai käyttäjälle
      if (target.kind === "listing") {
        // Lähetetään kurssiarvio
        await postListingRating(target.listingId, {
          stars: n,
          // trim() poistaa alusta/lopusta välilyönnit; jos tyhjä, lähetetään undefined (ei tyhjää stringiä)
          feedback: comment.trim() || undefined,
          public: true,
        });
      } else {
        // Lähetetään käyttäjäarvio
        await postUserRating(target.userId, {
          stars: n,
          feedback: comment.trim() || undefined,
          public: true,
        });
      }

      // Onnistui: näytetään "kiitos" ja tyhjennetään kentät
      setDone(true);
      setStars("");
      setComment("");

      // Jos vanhempi antoi callbackin, kutsutaan se
      if (onSubmitted) onSubmitted();
    } catch (e: unknown) {
      // Muutetaan mahdollinen axios/backend-error käyttäjälle luettavaan muotoon
      setError(toMessage(e));
    } finally {
      // Varmistetaan että "lähetys käynnissä" loppuu aina
      setSubmitting(false);
    }
  };

  return (
    // Lomake: Enter tai submit-nappi ajaa onSubmitin
    <form onSubmit={onSubmit} className="space-y-2">
      {/* Otsikko poistettu, koska ympäröivä näkymä/modaali näyttää sen jo */}

      {/* Jos käyttäjä ei ole kirjautunut, näytetään pieni vihje */}
      {!token && (
        <div className="text-xs text-neutral-500">{t("feedback.loginHint")}</div>
      )}

      {/* Kentät: md+ näytöillä grid jakaa 3 sarakkeeseen, pienillä allekkain */}
      <div className="grid md:grid-cols-3 gap-2 text-sm">
        {/* Tähdet (select) */}
        <label className="flex flex-col gap-1">
          <span>{t("feedback.ratingLabel")}</span>
          <select
            className="rounded-xl border px-3 py-2 text-sm"
            value={stars}
            onChange={(e) => setStars(e.target.value)}
          >
            {/* Tyhjä valinta = ei valittu */}
            <option value="">-</option>

            {/* Vaihtoehdot 1–5 */}
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>

        {/* Kommentti (textarea), ottaa 2 saraketta md+ koossa */}
        <div className="md:col-span-2">
          <label className="flex flex-col gap-1">
            <span>{t("feedback.commentLabel")}</span>
            <textarea
              className="rounded-xl border px-3 py-2 text-sm min-h-20"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t("feedback.placeholder")}
            />
          </label>
        </div>
      </div>

      {/* Virheviesti, jos sellainen on */}
      {error && <div className="text-xs text-red-600">{error}</div>}

      {/* Lähetysnappi + onnistumisteksti */}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          // Disabloidaan jos lähetys käynnissä tai käyttäjä ei ole kirjautunut
          disabled={submitting || !token}
          className="rounded-xl px-3 py-1.5 border bg-black text-white text-sm disabled:opacity-50"
        >
          {/* Nappi vaihtaa tekstin lähetyksen aikana */}
          {submitting ? t("feedback.sending") : t("feedback.submit")}
        </button>

        {/* Onnistumismerkki */}
        {done && (
          <span className="text-xs text-emerald-600">{t("feedback.thanks")}</span>
        )}
      </div>
    </form>
  );
}
