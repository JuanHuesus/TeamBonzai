// i18n.tsx
// Tämä tiedosto toteuttaa projektin kevyen lokalisaation (FI/EN) ilman erillistä kirjastoa.
// Idea:
// - translations-objekti sisältää kaikki tekstit avaimilla (esim. "nav.home")
// - I18nProvider pitää nykyisen kielen (lang) React Contextissa
// - useI18n() antaa komponentille t(key), lang ja setLang()

import { createContext, useContext, useState, type ReactNode } from "react"; // Context + state + hookit

// Tuetut kielet (union-tyyppi -> estää typoja)
type Lang = "fi" | "en";

// Contextin sisältö: mitä muut komponentit saavat
type I18nCtx = {
  lang: Lang; // nykyinen kieli
  setLang: (lang: Lang) => void; // vaihda kieli (tallentaa myös localStorageen)
  t: (key: string) => string; // hae käännös avaimella
};

// translations = “sanakirja” per kieli.
// Avain on esim. "nav.home" ja arvo on näytettävä teksti.
const translations: Record<Lang, Record<string, string>> = {
  fi: {
    "brand.name": "ChefUP",

    // Navigaatio
    "nav.home": "Etusivu",
    "nav.courses": "Kurssit",
    "nav.upcoming": "Tulevat tapahtumat",
    "nav.help": "Apua",
    "nav.profile": "Profiili",
    "nav.login": "Kirjaudu",
    "nav.logout": "Kirjaudu ulos",
    "nav.moderation": "Moderointi",
    "nav.register": "Luo käyttäjä",

    // Hero / etusivu
    "hero.title": "Löydä ruoka- ja kokkauskurssit ChefUPista!",
    "hero.subtitle":
      "Selaa kokkauskursseja, työpajoja ja makumatkoja. Suodata aiheen, tason, hinnan ja toteutustyylin mukaan.",

    "home.popularTitle": "Kurssit esittelyssä",
    "home.upcomingTitle": "Tulevat tapahtumat",
    "home.viewAllCourses": "Näytä kaikki kurssit",
    "home.upcomingCountShort": "tulossa",
    "home.statCourses": "Kurssia yhteensä",
    "home.statUpcoming": "Tulossa",
    "home.statProviders": "Järjestäjää",

    "home.popularSubtitle": "Nostoja ChefUPin valikoimasta – kurkkaa muutama esimerkki.",

    "button.newListing": "Uusi kurssi",

    // Login
    "login.title": "Kirjaudu",
    "login.email": "Sähköposti",
    "login.password": "Salasana",
    "login.submit": "Kirjaudu",
    "login.submitting": "Kirjaudutaan...",
    "login.noAccount": "Ei vielä tiliä?",
    "login.goToRegister": "Luo käyttäjätili",

    // Register
    "register.title": "Luo käyttäjätili",
    "register.firstname": "Etunimi",
    "register.surname": "Sukunimi",
    "register.email": "Sähköposti",
    "register.password": "Salasana",
    "register.passwordConfirm": "Salasana uudestaan",
    "register.submit": "Rekisteröidy",
    "register.submitting": "Luodaan käyttäjää…",
    "register.passwordMismatch": "Salasanat eivät täsmää.",
    "register.info":
      "Luo ChefUP-tunnus, jotta voit arvostella kursseja ja tehdä raportteja.",

    // Profiili
    "profile.title": "Käyttäjäprofiili",
    "profile.myCoursesTitle": "Omat kurssit",
    "profile.loadingCourses": "Ladataan kursseja…",
    "profile.noCourses": "Sinulla ei ole omia kursseja.",
    "profile.notLoggedIn": "Et ole kirjautunut sisään.",
    "profile.goToLogin": "Siirry kirjautumaan",
    "profile.email": "Sähköposti",
    "profile.emailLabel": "Sähköposti",
    "profile.subtitle":
      "Tällä sivulla näet käyttäjätietosi ja tekemäsi raportit.",
    "profile.placeholderIntro":
      "Tähän näkymään voidaan myöhemmin lisätä nimi, esittely ja omat kurssit.",
    "profile.myReportsTitle": "Tekemäsi raportit",
    "profile.loadingReports": "Ladataan raportteja…",
    "profile.noReports": "Et ole vielä tehnyt raportteja.",
    "profile.reportService": "Raportti kurssista",
    "profile.reportUser": "Raportti käyttäjästä",
    "profile.loginRequired": "Kirjaudu sisään nähdäksesi profiilisi.",

    // Help / FAQ
    "help.title": "Apua ja usein kysytyt kysymykset",
    "help.intro":
      "Tämä on demo-versio ChefUP-sovelluksesta. Alla vastauksia yleisimpiin kysymyksiin.",
    "help.faqTitle": "Usein kysytyt kysymykset",
    "help.q1": "Mitä ChefUP tekee?",
    "help.a1":
      "ChefUP kokoaa yhteen ruoanlaitto- ja ruokakulttuurikursseja. Voit etsiä kiinnostavia kursseja ja ilmoittautua niille palveluntarjoajan ohjeiden mukaan.",
    "help.q2": "Miten ilmoittaudun kurssille?",
    "help.a2":
      "Avaa kurssin tiedot ja seuraa palveluntarjoajan ohjeita. Tällä hetkellä ilmoittautuminen tapahtuu ChefUPin ulkopuolella (esim. sähköpostilla tai erillisen varausjärjestelmän kautta).",
    "help.q3": "Miten annan palautetta kurssista?",
    "help.a3":
      'Avaa kurssin tiedot ja käytä "Anna palaute" -lomaketta. Demo-versiossa palaute ei vielä tallennu taustajärjestelmään.',
    "help.q4": "Onko tämä oikea tuotantopalvelu?",
    "help.a4":
      "Ei. Tämä sovellus on harjoitusprojekti, joka demonstroi ChefUP-konseptia.",
    "help.termsTitle": "Käyttöehdot (lyhyesti)",
    "help.termsText":
      "Sovellusta käytetään omalla vastuulla. Kursseista ja niiden sisällöstä vastaa aina kurssin järjestäjä.",
    // “Vanha avain” jätetty yhteensopivuuden vuoksi
    "help.termsBody":
      "Sovellusta käytetään omalla vastuulla. Kursseista ja niiden sisällöstä vastaa aina kurssin järjestäjä.",

    // Feedback
    "feedback.title": "Anna palaute",
    "feedback.ratingLabel": "Arvio (1–5)",
    "feedback.commentLabel": "Kommentti",
    "feedback.submit": "Lähetä palaute",
    "feedback.sending": "Lähetetään…",
    "feedback.thanks":
      "Kiitos palautteesta! (Demo: ei vielä tallennu taustaan.)",
    "feedback.placeholder":
      "Kerro, mikä kurssissa toimi ja mitä voisi parantaa.",
    "feedback.courseSectionTitle": "Palautetta kurssista",
    "feedback.organizerSectionTitle": "Palautetta kurssin vetäjästä",
    "feedback.forCourse": "Palautetta kurssista",
    "feedback.forOrganizer": "Palautetta kurssin vetäjästä",
    "feedback.loginHint": "Kirjaudu sisään antaaksesi palautetta.",
    "feedback.errorStars": "Valitse tähtiarvio väliltä 1–5.",
    "feedback.errorLoginRequired":
      "Kirjaudu sisään ennen palautteen lähettämistä.",

    // Reports
    "report.sectionTitle": "Ilmoita epäsopivasta sisällöstä",
    "report.loginHint": "Kirjaudu sisään tehdäksesi ilmoituksen.",
    "report.openForm": "Avaa ilmoituslomake",
    "report.hideForm": "Piilota ilmoituslomake",
    "report.reasonPlaceholder": "Lyhyt kuvaus, mikä on vialla",
    "report.detailsPlaceholder": "Lisätiedot (valinnainen)",
    "report.sending": "Lähetetään…",
    "report.send": "Lähetä ilmoitus",
    "report.thanks":
      "Kiitos ilmoituksesta – moderaattorit tarkistavat sen.",
    "report.reasonRequired": "Kerro lyhyesti syy ilmoitukselle.",
    "report.loginRequired":
      "Kirjaudu sisään ennen ilmoituksen lähettämistä.",

    // Moderointi
    "moderation.title": "Moderointi",
    "moderation.noAccess": "Sinulla ei ole oikeuksia nähdä tätä sivua.",
    "moderation.noReports": "Ei avoimia raportteja.",
    "moderation.updating": "Päivitetään…",
    "moderation.markPending": "Merkitse avoimeksi",
    "moderation.markResolved": "Merkitse ratkaistuksi",
    "moderation.subtitle": "Käsittele käyttäjien tekemät ilmoitukset. Avoimet näkyvät ylhäällä, ratkaistut minimissä.",
    "moderation.refresh": "Päivitä",
    "moderation.loading": "Ladataan raportteja…",

    "moderation.searchLabel": "Haku",
    "moderation.searchPlaceholder": "Hae syyllä, tekstillä, id:llä tai kurssin nimellä…",
    "moderation.filterLabel": "Suodatus",
    "moderation.filterAll": "Kaikki",
    "moderation.filterServices": "Kurssit",
    "moderation.filterUsers": "Käyttäjät",
    "moderation.sortLabel": "Järjestys",
    "moderation.sortNewest": "Uusin ensin",
    "moderation.sortOldest": "Vanhin ensin",

    "moderation.pending": "Avoimet",
    "moderation.resolved": "Ratkaistut",
    "moderation.pendingTitle": "Avoimet raportit",
    "moderation.resolvedTitle": "Ratkaistut raportit",
    "moderation.resolvedHint": "Klikkaa auki nähdäksesi listan",
    "moderation.noReportsFiltered": "Ei raportteja näillä suodattimilla.",

    "moderation.statusPending": "pending",
    "moderation.statusResolved": "resolved",

    "moderation.reportedCourse": "Raportoitu kurssi",
    "moderation.reportedUser": "Raportoitu käyttäjä",
    "moderation.openCourse": "Avaa kurssi",
    "moderation.courseLoadingName": "Haetaan kurssin nimeä…",

    "moderation.copyId": "Kopioi raportti-ID",
    "moderation.copyTargetId": "Kopioi kohde-ID",
    "moderation.copyFailed": "Kopiointi epäonnistui.",

    "moderation.resolutionNotesLabel": "Ratkaisumuistiinpano (valinnainen)",
    "moderation.resolutionNotesPlaceholder": "Mitä päätettiin / miksi tämä ratkaistiin?",
    "moderation.resolvedReport": "Ratkaistu raportti",
    "moderation.openingCourse": "Avataan…",
    "moderation.courseNotFound": "Kurssia ei löytynyt (id ei ole listassa).",

    // käyttäjät
    // i18n.tsx – lisää translations.fi:
    "nav.users": "Käyttäjät",

    "users.title": "Käyttäjät",
    "users.subtitle": "Selaa käyttäjiä ja avaa julkinen profiili.",
    "users.searchLabel": "Haku",
    "users.searchPlaceholder": "Hae nimellä, sähköpostilla tai kuvauksella…",
    "users.loading": "Ladataan käyttäjiä…",
    "users.noUsers": "Ei käyttäjiä.",
    "users.openProfile": "Avaa profiili",

    "user.title": "Käyttäjän profiili",
    "user.backToUsers": "Takaisin käyttäjälistaan",
    "user.loading": "Ladataan käyttäjää…",
    "user.offeredCoursesTitle": "Tarjotut kurssit",
    "user.loadingCourses": "Ladataan kursseja…",
    "user.noCourses": "Tällä käyttäjällä ei ole kursseja.",

    "report.userSectionTitle": "Ilmoita käyttäjästä",
    "report.userIntro": "Teet ilmoituksen käyttäjästä:",


    // Services / listaus
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

    // Footer
    "footer.tagline": "Ruokakurssit yhdestä paikasta.",
    "footer.contact": "Yhteystiedot",
    "footer.email": "Sähköposti",
    "footer.phone": "Puhelin",
    "footer.demoNote": "Tämä on harjoitusprojekti.",

    // Common
    "common.close": "Sulje",
    "common.error": "Tapahtui virhe.",
  },

  en: {
    "brand.name": "ChefUP",

    // Navigation
    "nav.home": "Home",
    "nav.courses": "Courses",
    "nav.upcoming": "Upcoming events",
    "nav.help": "Help",
    "nav.profile": "Profile",
    "nav.login": "Log in",
    "nav.logout": "Log out",
    "nav.moderation": "Moderation",
    "nav.register": "Sign up",

    // Hero / home
    "hero.title": "Discover cooking classes with ChefUP!",
    "hero.subtitle":
      "Browse cooking classes, workshops and tastings. Filter by topic, level, price and format.",

    "home.popularTitle": "Course offerings",
    "home.upcomingTitle": "Upcoming events",
    "home.viewAllCourses": "View all courses",
    "home.upcomingCountShort": "upcoming",
    "home.statCourses": "Total courses",
    "home.statUpcoming": "Upcoming",
    "home.statProviders": "Providers",

    "home.popularSubtitle": "Featured courses from ChefUP – here are a few examples.",

    "button.newListing": "New course",

    // Login
    "login.title": "Log in",
    "login.email": "Email",
    "login.password": "Password",
    "login.submit": "Log in",
    "login.submitting": "Logging in...",
    "login.noAccount": "No account yet?",
    "login.goToRegister": "Create an account",

    // Register
    "register.title": "Create an account",
    "register.firstname": "First name",
    "register.surname": "Last name",
    "register.email": "Email",
    "register.password": "Password",
    "register.passwordConfirm": "Password again",
    "register.submit": "Sign up",
    "register.submitting": "Creating account…",
    "register.passwordMismatch": "Passwords do not match.",
    "register.info":
      "Create a ChefUP account to rate courses and submit reports.",

    // Profile
    "profile.title": "User profile",
    "profile.myCoursesTitle": "My Courses",
    "profile.loadingCourses": "Loading courses…",
    "profile.noCourses": "You have not posted any courses.",
    "profile.notLoggedIn": "You are not logged in.",
    "profile.goToLogin": "Go to login",
    "profile.email": "Email",
    "profile.emailLabel": "Email",
    "profile.subtitle":
      "On this page you can see your user details and reports.",
    "profile.placeholderIntro":
      "In the future this view can show your name, bio and own courses.",
    "profile.myReportsTitle": "My reports",
    "profile.loadingReports": "Loading reports…",
    "profile.noReports": "You have not submitted any reports yet.",
    "profile.reportService": "Report about a course",
    "profile.reportUser": "Report about a user",
    "profile.loginRequired": "Log in to see your profile.",

    // Help / FAQ
    "help.title": "Help and frequently asked questions",
    "help.intro":
      "This is a demo version of the ChefUP application. Below are answers to common questions.",
    "help.faqTitle": "Frequently asked questions",
    "help.q1": "What does ChefUP do?",
    "help.a1":
      "ChefUP collects cooking and food culture courses in one place. You can search for interesting courses and sign up following the provider's instructions.",
    "help.q2": "How do I sign up for a course?",
    "help.a2":
      "Open the course details and follow the provider's instructions. For now, enrollment happens outside ChefUP (for example by email or a separate booking system).",
    "help.q3": "How do I give feedback about a course?",
    "help.a3":
      'Open the course details and use the "Give feedback" form. In this demo the feedback is not yet stored in the backend.',
    "help.q4": "Is this a real production service?",
    "help.a4":
      "No. This app is a student project that demonstrates the ChefUP concept.",
    "help.termsTitle": "Terms of use (summary)",
    "help.termsText":
      "Use this application at your own risk. The organizer is always responsible for each individual course.",
    "help.termsBody":
      "Use this application at your own risk. The organizer is always responsible for each individual course.",

    // Feedback
    "feedback.title": "Give feedback",
    "feedback.ratingLabel": "Rating (1–5)",
    "feedback.commentLabel": "Comment",
    "feedback.submit": "Send feedback",
    "feedback.sending": "Sending…",
    "feedback.thanks":
      "Thanks for your feedback! (Demo: not yet saved to backend.)",
    "feedback.placeholder":
      "Tell what worked well and what could be improved.",
    "feedback.courseSectionTitle": "Feedback about the course",
    "feedback.organizerSectionTitle": "Feedback about the organizer",
    "feedback.forCourse": "Feedback for the course",
    "feedback.forOrganizer": "Feedback for the organizer",
    "feedback.loginHint": "Log in to leave feedback.",
    "feedback.errorStars": "Select a rating between 1 and 5.",
    "feedback.errorLoginRequired":
      "Log in before sending feedback.",

    // Reports
    "report.sectionTitle": "Report inappropriate content",
    "report.loginHint": "Log in to submit a report.",
    "report.openForm": "Open report form",
    "report.hideForm": "Hide report form",
    "report.reasonPlaceholder": "Short description of the issue",
    "report.detailsPlaceholder": "Additional details (optional)",
    "report.sending": "Sending…",
    "report.send": "Send report",
    "report.thanks":
      "Thank you for your report – moderators will review it.",
    "report.reasonRequired": "Please describe why you are reporting this.",
    "report.loginRequired": "Log in before submitting a report.",

    // Moderation
    "moderation.title": "Moderation",
    "moderation.noAccess":
      "You do not have permission to view this page.",
    "moderation.noReports": "No open reports.",
    "moderation.updating": "Updating…",
    "moderation.markPending": "Mark as pending",
    "moderation.markResolved": "Mark as resolved",
    "moderation.subtitle": "Handle user reports. Pending items are on top, resolved items are minimized.",
    "moderation.refresh": "Refresh",
    "moderation.loading": "Loading reports…",

    "moderation.searchLabel": "Search",
    "moderation.searchPlaceholder": "Search by reason, text, id or course name…",
    "moderation.filterLabel": "Filter",
    "moderation.filterAll": "All",
    "moderation.filterServices": "Courses",
    "moderation.filterUsers": "Users",
    "moderation.sortLabel": "Sort",
    "moderation.sortNewest": "Newest first",
    "moderation.sortOldest": "Oldest first",

    "moderation.pending": "Pending",
    "moderation.resolved": "Resolved",
    "moderation.pendingTitle": "Pending reports",
    "moderation.resolvedTitle": "Resolved reports",
    "moderation.resolvedHint": "Click to expand the list",
    "moderation.noReportsFiltered": "No reports match these filters.",

    "moderation.statusPending": "pending",
    "moderation.statusResolved": "resolved",

    "moderation.reportedCourse": "Reported course",
    "moderation.reportedUser": "Reported user",
    "moderation.openCourse": "Open course",
    "moderation.courseLoadingName": "Fetching course name…",

    "moderation.copyId": "Copy report ID",
    "moderation.copyTargetId": "Copy target ID",
    "moderation.copyFailed": "Copy failed.",

    "moderation.resolutionNotesLabel": "Resolution notes (optional)",
    "moderation.resolutionNotesPlaceholder": "What was decided / why was this resolved?",
    "moderation.resolvedReport": "Resolved report",
    "moderation.openingCourse": "Opening…",
    "moderation.courseNotFound": "Course not found (id is not in the list).",

    

    // Services
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

    // käyttäjät

    // i18n.tsx – lisää translations.en:
    "nav.users": "Users",

    "users.title": "Users",
    "users.subtitle": "Browse users and open a public profile.",
    "users.searchLabel": "Search",
    "users.searchPlaceholder": "Search by name, email or description…",
    "users.loading": "Loading users…",
    "users.noUsers": "No users found.",
    "users.openProfile": "Open profile",

    "user.title": "User profile",
    "user.backToUsers": "Back to users",
    "user.loading": "Loading user…",
    "user.offeredCoursesTitle": "Offered courses",
    "user.loadingCourses": "Loading courses…",
    "user.noCourses": "This user has no courses.",

    "report.userSectionTitle": "Report user",
    "report.userIntro": "You are reporting this user:",


    // Footer
    "footer.tagline": "Cooking courses in one place.",
    "footer.contact": "Contact",
    "footer.email": "Email",
    "footer.phone": "Phone",
    "footer.demoNote": "This is a demo project.",

    // Common
    "common.close": "Close",
    "common.error": "An error occurred.",
  },
};

// Context alustetaan “undefined”: jos hookkia käytetään ilman Provideria, heitetään virhe.
const I18nContext = createContext<I18nCtx | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  // Kieli alustetaan localStoragesta:
  // - jos tallessa "en" -> käytetään en
  // - muuten oletus fi
  const [lang, setLangState] = useState<Lang>(() => {
    const stored = localStorage.getItem("lang");
    return stored === "en" ? "en" : "fi";
  });

  // setLang: päivittää state + tallentaa valinnan localStorageen
  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("lang", l);
  };

  // t(key): hakee käännöksen nykyisellä kielellä.
  // Fallback:
  // 1) jos avain puuttuu EN:stä, käytetään FI-tekstiä
  // 2) jos puuttuu myös FI:stä, palautetaan key (helpottaa debugia)
  const t = (key: string) =>
    translations[lang][key] ?? translations.fi[key] ?? key;

  // Provider jakaa lang + setLang + t kaikille lapsille
  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

// Hook: helpoin tapa käyttää i18n:ää komponenteissa.
export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}