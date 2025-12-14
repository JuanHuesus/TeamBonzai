import type { ListedService } from "../../types";
import Tag from "../../ui/Tag";
import { useI18n } from "../../i18n";

/**
 * Päätellään onko kurssi “online”, jos location näyttää URL:ilta.
 * - Jos location on tyhjä -> ei online
 * - Jos location on validi http/https URL -> online
 * - Muuten -> ei online (eli oletetaan lähikurssi)
 */
function isOnline(location: string | null | undefined) {
  if (!location) return false;

  try {
    // new URL(...) heittää virheen jos merkkijono ei ole kelvollinen URL
    const url = new URL(location);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * ServiceCard näyttää yhden kurssin “korttina”.
 * - s = kurssin data
 * - onOpen = callback, jota kutsutaan kun käyttäjä painaa “Näytä tiedot”
 *   (yleensä vanhempi avaa modaalin tai navigoi detail-sivulle)
 */
export default function ServiceCard({
  s,
  onOpen,
}: {
  s: ListedService;
  onOpen: (svc: ListedService) => void;
}) {
  const { t, lang } = useI18n();

  // Derivoitu data UI:ta varten (ei muuteta s-objektia, vaan lasketaan näyttöarvot)
  const mode = isOnline(s.location) ? "online" : "inperson";

  // Päivämäärän formaatti kielen mukaan
  const locale = lang === "fi" ? "fi-FI" : "en-GB";

  // Hinta: jos s.price puuttuu/tyhjä, näytetään “Ilmainen”
  const priceText = s.price?.trim() ? s.price : t("course.free");

  // Päivämäärä: jos datetime puuttuu, näytetään “aika ilmoitetaan myöhemmin”
  const dateText = s.datetime
    ? new Date(s.datetime).toLocaleDateString(locale)
    : t("course.timeTBA");

  // Kuva: käytetään kurssin omaa kuvaa, tai placeholderia jos puuttuu
  const img = s.image || "https://placehold.co/1600x900?text=Kuva";

  return (
    // Kortin ulkokehys + hover-efekti
    <div className="group rounded-2xl overflow-hidden border bg-white shadow-sm hover:shadow-md transition">
      {/* Kuvan alue */}
      <div className="aspect-[16/9] overflow-hidden">
        <img
          src={img}
          alt=""
          className="h-full w-full object-cover group-hover:scale-105 transition"
          onError={(e) => {
            // Jos kuvan lataus epäonnistuu, vaihdetaan turvalliseen placeholderiin
            e.currentTarget.src = "https://placehold.co/1600x900?text=Kuva";
          }}
        />
      </div>

      {/* Tekstisisältö */}
      <div className="p-4 space-y-3">
        {/* Otsikko + “online/lähikurssi” tagi */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-lg leading-tight">{s.name}</h3>

          <Tag>
            {mode === "online"
              ? t("course.mode.online")
              : t("course.mode.inperson")}
          </Tag>
        </div>

        {/* Metatiedot rivinä */}
        <div className="text-sm text-neutral-600 flex flex-wrap gap-2">
          <span>{s.service_provider}</span>
          <span>•</span>
          <span>{dateText}</span>
          <span>•</span>
          <span>{s.service_category}</span>
        </div>

        {/* Alarivi: hinta + CTA-nappi */}
        <div className="flex items-center justify-between">
          <div className="font-semibold">{priceText}</div>

          <button
            onClick={() => onOpen(s)}
            className="rounded-xl px-4 py-2 border bg-black text-white hover:opacity-90 text-sm"
          >
            {t("course.showDetails")}
          </button>
        </div>
      </div>
    </div>
  );
}