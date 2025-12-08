import Modal from "../../ui/Modal";
import type { ListedService } from "../../types";
import { Link } from "react-router-dom";
import FeedbackForm from "../feedback/FeedbackForm";
import { useI18n } from "../../i18n";

type Props = {
  service: ListedService | null;
  onClose: () => void;
};

export default function ServiceDetailModal({ service, onClose }: Props) {
  const { t, lang } = useI18n();
  if (!service) return null;

  const locale = lang === "fi" ? "fi-FI" : "en-GB";
  const priceText = service.price?.trim() || t("course.free");

  return (
    <Modal
      open={!!service}
      onClose={onClose}
      title={service.name ?? "Tiedot"}
    >
      <div>
        <img
          src={
            service.image || "https://placehold.co/1200x675?text=Kuva"
          }
          alt=""
          className="h-48 w-full object-cover rounded-xl"
          onError={(e) => {
            e.currentTarget.src =
              "https://placehold.co/1200x675?text=Kuva";
          }}
        />
        <div className="p-1 space-y-3">
          <div className="text-sm text-neutral-600 flex flex-wrap gap-2">
            <span>👤 {service.service_provider}</span>
            <span>•</span>
            <span>📍 {service.location ?? "-"}</span>
            <span>•</span>
            <span>
              🗓{" "}
              {service.datetime
                ? new Date(service.datetime).toLocaleDateString(locale)
                : t("course.timeTBA")}
            </span>
            <span>•</span>
            <span>🏷 {service.service_category}</span>
          </div>
          <p className="text-sm">{service.description}</p>

          <div className="border-t pt-3 mt-3">
            <FeedbackForm serviceName={service.name} />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="text-lg font-semibold">{priceText}</div>
            <Link
              to={`/edit/${service.id}`}
              className="rounded-xl px-4 py-2 border bg-emerald-600 text-white hover:opacity-90"
            >
              Muokkaa
            </Link>
          </div>
        </div>
      </div>
    </Modal>
  );
}
