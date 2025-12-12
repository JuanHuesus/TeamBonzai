import { useState, type FormEvent } from "react";
import { useI18n } from "../../i18n";
import { useAuth } from "../../useAuth";
import { toMessage } from "../../lib/error";
import {
  postListingRating,
  postUserRating,
} from "../ratings/api.ratings";

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
  target: ListingTarget | UserTarget;
  onSubmitted?: () => void;
};

/**
 * Yhteinen feedback-lomake sekä kurssille että kurssin vetäjälle.
 * Backend hoitaa tallennuksen listing_rating_entries / user_rating_entries -tauluihin.
 */
export default function FeedbackForm({ target, onSubmitted }: Props) {
  const { t } = useI18n();
  const { token } = useAuth();
  const [stars, setStars] = useState<string>("");
  const [comment, setComment] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setDone(false);

    const n = Number(stars);
    if (!Number.isFinite(n) || n < 1 || n > 5) {
      setError(t("feedback.errorStars"));
      return;
    }

    if (!token) {
      setError(t("feedback.errorLoginRequired"));
      return;
    }

    setSubmitting(true);
    try {
      if (target.kind === "listing") {
        await postListingRating(target.listingId, {
          stars: n,
          feedback: comment.trim() || undefined,
          public: true,
        });
      } else {
        await postUserRating(target.userId, {
          stars: n,
          feedback: comment.trim() || undefined,
          public: true,
        });
      }
      setDone(true);
      setStars("");
      setComment("");
      if (onSubmitted) onSubmitted();
    } catch (e: unknown) {
      setError(toMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      {/* Otsikko poistettu, koska ServiceDetailModal näyttää sen jo */}

      {!token && (
        <div className="text-xs text-neutral-500">
          {t("feedback.loginHint")}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-2 text-sm">
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

      {error && (
        <div className="text-xs text-red-600">
          {error}
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={submitting || !token}
          className="rounded-xl px-3 py-1.5 border bg-black text-white text-sm disabled:opacity-50"
        >
          {submitting ? t("feedback.sending") : t("feedback.submit")}
        </button>
        {done && (
          <span className="text-xs text-emerald-600">
            {t("feedback.thanks")}
          </span>
        )}
      </div>
    </form>
  );
}
