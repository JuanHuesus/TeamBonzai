import { useState, type FormEvent } from "react";
import { useI18n } from "../../i18n";

type Props = {
  serviceName: string;
};

export default function FeedbackForm({ serviceName }: Props) {
  const { t } = useI18n();
  const [rating, setRating] = useState<string>("");
  const [comment, setComment] = useState<string>("");
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Demo: ei vielä lähetetä backendille
    console.log("Feedback (demo only)", { serviceName, rating, comment });
    setSubmitted(true);
    setRating("");
    setComment("");
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <div className="font-semibold text-sm">{t("feedback.title")}</div>
      <div className="grid md:grid-cols-3 gap-2 text-sm">
        <label className="flex flex-col gap-1">
          <span>{t("feedback.ratingLabel")}</span>
          <select
            className="rounded-xl border px-3 py-2 text-sm"
            value={rating}
            onChange={(e) => setRating(e.target.value)}
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
      <div className="flex items-center gap-2">
        <button
          type="submit"
          className="rounded-xl px-3 py-1.5 border bg-black text-white text-sm"
        >
          {t("feedback.submit")}
        </button>
        {submitted && (
          <span className="text-xs text-emerald-600">
            {t("feedback.thanks")}
          </span>
        )}
      </div>
    </form>
  );
}
