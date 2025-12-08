import { createContext, useContext, useState, type ReactNode } from "react";

type Lang = "fi" | "en";

type I18nCtx = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
};

const translations: Record<Lang, Record<string, string>> = {
  fi: {
    "brand.name": "ChefUP",
    "nav.home": "Etusivu",
    "nav.courses": "Kurssit",
    "nav.upcoming": "Tulevat tapahtumat",
    "nav.help": "Apua",
    "nav.profile": "Profiili",
    "nav.login": "Kirjaudu",
    "nav.logout": "Kirjaudu ulos",

    "hero.title": "Löydä ruoka- ja kokkauskurssit ChefUPista!",
    "hero.subtitle":
      "Selaa kokkauskursseja, työpajoja ja makumatkoja. Suodata aiheen, tason, hinnan ja toteutustyylin mukaan.",

    "home.popularTitle": "Suosituimmat kurssit",
    "home.upcomingTitle": "Tulevat tapahtumat",
    "home.viewAllCourses": "Näytä kaikki kurssit",

    "button.newListing": "Uusi kurssi",

    "login.title": "Kirjaudu",
    "login.email": "Sähköposti",
    "login.password": "Salasana",
    "login.submit": "Kirjaudu",
    "login.submitting": "Kirjaudutaan...",

    "profile.title": "Käyttäjäprofiili",
    "profile.notLoggedIn": "Et ole kirjautunut sisään.",
    "profile.goToLogin": "Siirry kirjautumaan",
    "profile.email": "Sähköposti",
    "profile.placeholderIntro":
      "Tähän näkymään voidaan myöhemmin lisätä nimi, esittely ja omat kurssit.",

    "help.title": "Apua ja usein kysytyt kysymykset",
    "help.intro":
      "Tämä on demo-versio ChefUP-sovelluksesta. Alla vastauksia yleisimpiin kysymyksiin.",
    "help.q1": "Mitä ChefUP tekee?",
    "help.a1":
      "ChefUP kokoaa yhteen ruoanlaitto- ja ruokakulttuurikursseja. Voit etsiä kiinnostavia kursseja ja ilmoittautua niille palveluntarjoajan ohjeiden mukaan.",
    "help.q2": "Miten ilmoittaudun kurssille?",
    "help.a2":
      "Avaa kurssin tiedot ja seuraa palveluntarjoajan ohjeita. Tällä hetkellä ilmoittautuminen tapahtuu ChefUPin ulkopuolella (esim. sähköpostilla tai erillisen varausjärjestelmän kautta).",
    "help.q3": "Miten annan palautetta kurssista?",
    "help.a3":
      "Avaa kurssin tiedot ja käytä \"Anna palaute\" -lomaketta. Demo-versiossa palaute ei vielä tallennu taustajärjestelmään.",
    "help.q4": "Onko tämä oikea tuotantopalvelu?",
    "help.a4":
      "Ei. Tämä sovellus on harjoitusprojekti, joka demonstroi ChefUP-konseptia.",
    "help.termsTitle": "Käyttöehdot (lyhyesti)",
    "help.termsBody":
      "Sovellusta käytetään omalla vastuulla. Kursseista ja niiden sisällöstä vastaa aina kurssin järjestäjä.",

    "feedback.title": "Anna palaute",
    "feedback.ratingLabel": "Arvio (1–5)",
    "feedback.commentLabel": "Kommentti",
    "feedback.submit": "Lähetä palaute",
    "feedback.thanks": "Kiitos palautteesta! (Demo: ei vielä tallennu taustaan.)",
    "feedback.placeholder":
      "Kerro, mikä kurssissa toimi ja mitä voisi parantaa.",

    "services.heroTitle": "Kaikki ChefUP-kurssit",
    "services.heroSubtitle":
      "Rajaa listaa teeman, toteutustavan ja hinnan perusteella. Kaikki sisällöt liittyvät ruokaan ja ruoanlaittoon.",
    "services.resultsTitle": "Tulokset",
    "services.loading": "Ladataan…",
    "services.noPreview": "Ei esikatseltavia kursseja",

    "course.free": "Ilmainen",
    "course.timeTBA": "Aika ilmoitetaan",
    "course.mode.online": "Etäkurssi",
    "course.mode.inperson": "Lähikurssi",
    "course.showDetails": "Näytä tiedot",

    "footer.contact": "Yhteystiedot",
    "footer.email": "Sähköposti",
    "footer.phone": "Puhelin",
    "footer.demoNote": "Tämä on harjoitusprojekti.",
  },
  en: {
    "brand.name": "ChefUP",
    "nav.home": "Home",
    "nav.courses": "Courses",
    "nav.upcoming": "Upcoming events",
    "nav.help": "Help",
    "nav.profile": "Profile",
    "nav.login": "Log in",
    "nav.logout": "Log out",

    "hero.title": "Discover cooking classes with ChefUP!",
    "hero.subtitle":
      "Browse cooking classes, workshops and tastings. Filter by topic, level, price and format.",

    "home.popularTitle": "Popular courses",
    "home.upcomingTitle": "Upcoming events",
    "home.viewAllCourses": "View all courses",

    "button.newListing": "New course",

    "login.title": "Log in",
    "login.email": "Email",
    "login.password": "Password",
    "login.submit": "Log in",
    "login.submitting": "Logging in...",

    "profile.title": "User profile",
    "profile.notLoggedIn": "You are not logged in.",
    "profile.goToLogin": "Go to login",
    "profile.email": "Email",
    "profile.placeholderIntro":
      "In the future this view can show your name, bio and own courses.",

    "help.title": "Help and frequently asked questions",
    "help.intro":
      "This is a demo version of the ChefUP application. Below are answers to common questions.",
    "help.q1": "What does ChefUP do?",
    "help.a1":
      "ChefUP collects cooking and food culture courses in one place. You can search for interesting courses and sign up following the provider's instructions.",
    "help.q2": "How do I sign up for a course?",
    "help.a2":
      "Open the course details and follow the provider's instructions. For now, enrollment happens outside ChefUP (for example by email or a separate booking system).",
    "help.q3": "How do I give feedback about a course?",
    "help.a3":
      "Open the course details and use the \"Give feedback\" form. In this demo the feedback is not yet stored in the backend.",
    "help.q4": "Is this a real production service?",
    "help.a4":
      "No. This app is a student project that demonstrates the ChefUP concept.",
    "help.termsTitle": "Terms of use (summary)",
    "help.termsBody":
      "Use this application at your own risk. The organizer is always responsible for each individual course.",

    "feedback.title": "Give feedback",
    "feedback.ratingLabel": "Rating (1–5)",
    "feedback.commentLabel": "Comment",
    "feedback.submit": "Send feedback",
    "feedback.thanks":
      "Thanks for your feedback! (Demo: not yet saved to backend.)",
    "feedback.placeholder":
      "Tell what worked well and what could be improved.",

    "services.heroTitle": "All ChefUP courses",
    "services.heroSubtitle":
      "Filter the list by theme, format and price. All content is related to food and cooking.",
    "services.resultsTitle": "Results",
    "services.loading": "Loading…",
    "services.noPreview": "No courses to preview",

    "course.free": "Free",
    "course.timeTBA": "Time will be announced",
    "course.mode.online": "Online",
    "course.mode.inperson": "On-site",
    "course.showDetails": "Show details",

    "footer.contact": "Contact",
    "footer.email": "Email",
    "footer.phone": "Phone",
    "footer.demoNote": "This is a demo project.",
  },
};

const I18nContext = createContext<I18nCtx | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const stored = localStorage.getItem("lang");
    return stored === "en" ? "en" : "fi";
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("lang", l);
  };

  const t = (key: string) => translations[lang][key] ?? translations.fi[key] ?? key;

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
