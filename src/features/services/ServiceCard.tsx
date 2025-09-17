import type { ListedService } from "../../types";
import Tag from "../../ui/Tag";

function isOnline(location: string | null | undefined) {
  if (!location) return false;
  try {
    const url = new URL(location);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export default function ServiceCard({
  s,
  onOpen,
}: {
  s: ListedService;
  onOpen: (svc: ListedService) => void;
}) {
  const mode = isOnline(s.location) ? "online" : "inperson";
  const priceText = s.price?.trim() ? s.price : "Ilmainen";
  const dateText = s.datetime ? new Date(s.datetime).toLocaleDateString() : "Aika ilmoitetaan";
  const img = s.image || "https://placehold.co/1600x900?text=Kuva";

  return (
    <div className="group rounded-2xl overflow-hidden border bg-white shadow-sm hover:shadow-md transition">
      <div className="aspect-[16/9] overflow-hidden">
        <img
          src={img}
          alt=""
          className="h-full w-full object-cover group-hover:scale-105 transition"
          onError={(e) => {
            e.currentTarget.src = "https://placehold.co/1600x900?text=Kuva";
          }}
        />
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-lg leading-tight">{s.name}</h3>
          <Tag>{mode === "online" ? "Etä" : "Lähikurssi"}</Tag>
        </div>
        <div className="text-sm text-neutral-600 flex flex-wrap gap-2">
          <span>👤 {s.service_provider}</span>
          <span>•</span>
          <span>🗓 {dateText}</span>
          <span>•</span>
          <span>🏷 {s.service_category}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="font-semibold">{priceText}</div>
          <button onClick={() => onOpen(s)} className="rounded-xl px-4 py-2 border bg-black text-white hover:opacity-90">
            Näytä tiedot
          </button>
        </div>
      </div>
    </div>
  );
}
