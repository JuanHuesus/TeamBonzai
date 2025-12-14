import { useState, type FormEvent } from "react";
import { useI18n } from "../../i18n";
import { useAuth } from "../../useAuth";
import { toMessage } from "../../lib/error";
import { postListingRating, postUserRating } from "../ratings/api.ratings";

// tää tiedosto on “yksi lomake kahteen tarkoitukseen”
// eli sama feedback-formi toimii
// - kurssille/listaukselle (listing)
// - käyttäjälle/kurssin vetäjälle (user)

// "target" kertoo, mihin palaute kohdistuu
type ListingTarget = {
  kind: "listing"; // erotetaan userista tällä kentällä
  listingId: string;
  listingName: string; // tätä voi käyttää otsikossa tai muussa UI:ssa
};

type UserTarget = {
  kind: "user";
  userId: string;
  userName?: string;
};

type Props = {
  // annetaan aina target, jotta komponentti tietää mihin se lähettää datan
  target: ListingTarget | UserTarget;

  onSubmitted?: () => void; 
};

export default function FeedbackForm({ target, onSubmitted }: Props) {
  const { t } = useI18n();

  const { token } = useAuth();

  // lomakkeen kentät:
  // stars pidetään stringinä koska select antaa stringin, mutta muutetaan numeroiksi submitissä
  const [stars, setStars] = useState<string>("");
  const [comment, setComment] = useState<string>("");

  // ui-tila: lähetetäänkö nyt, tuliko virhe, ja näytetäänkö “kiitos”
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // lähetä lomake backendille
  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // estää sivun reloadin
    setError(null); // pyyhitään vanha virhe
    setDone(false); // jos aiemmin onnistui, nollataan “kiitos” ennen uutta yritystä

    // muutetaan tähdet numeroksi
    const n = Number(stars);

    // varmistetaan että n on oikea numero 1–5
    if (!Number.isFinite(n) || n < 1 || n > 5) {
      setError(t("feedback.errorStars"));
      return;
    }

    // jos ei tokenia, ei lähetetä mitään backendille
    if (!token) {
      setError(t("feedback.errorLoginRequired"));
      return;
    }

    setSubmitting(true);
    try {
      // päätetään minne lähetetään:
      // - listing -> postListingRating
      // - user -> postUserRating
      //
      // kommentti trimmataan: jos käyttäjä jättää tyhjäksi, lähetetään undefined
      const feedback = comment.trim() || undefined;

      if (target.kind === "listing") {
        // kurssin/listauksen arvio
        await postListingRating(target.listingId, {
          stars: n,
          feedback,
          public: true,
        });
      } else {
        // käyttäjän arvio (esim. kurssin vetäjä)
        await postUserRating(target.userId, {
          stars: n,
          feedback,
          public: true,
        });
      }

      // onnistui, näytetään kiitos
      setDone(true);
      setStars("");
      setComment("");

      // ilmoitetaan vanhemmalle komponentille eli sille joka käyttää FeedbackFormia
      onSubmitted?.();
    } catch (e: unknown) {
      setError(toMessage(e)); 
    } finally {
      setSubmitting(false); 
    }
  };

  // ----- UI -----

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      {/* jos ei olla kirjautuneena, näytetään pieni vihje */}
      {!token && <div className="text-xs text-neutral-500">{t("feedback.loginHint")}</div>}

      {/* kentät: tähtivalinta + kommentti */}
      <div className="grid md:grid-cols-3 gap-2 text-sm">
        {/* tähdet */}
        <label className="flex flex-col gap-1">
          <span>{t("feedback.ratingLabel")}</span>
          <select
            className="rounded-xl border px-3 py-2 text-sm"
            value={stars}
            onChange={(e) => setStars(e.target.value)}
          >
            <option value="">-</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>

        {/* kommentti */}
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

      {/* virhe näkyy jos submit ei onnistunut */}
      {error && <div className="text-xs text-red-600">{error}</div>}

      {/* lähetysnappi + onnistumisviesti */}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={submitting || !token} // ei lähetetä jos jo menossa tai ei kirjautunut
          className="rounded-xl px-3 py-1.5 border bg-black text-white text-sm disabled:opacity-50"
        >
          {submitting ? t("feedback.sending") : t("feedback.submit")}
        </button>

        {/* “kiitos” näkyy vasta kun lähetys onnistui */}
        {done && <span className="text-xs text-emerald-600">{t("feedback.thanks")}</span>}
      </div>
    </form>
  );
}
