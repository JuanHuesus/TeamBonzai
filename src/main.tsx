import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./styles.css";

import AppLayout from "./App";
import ServicesList from "./pages/ServicesList";
import ServiceEdit from "./pages/ServiceEdit";
import Login from "./pages/Login";

import Home from "./pages/Home";
import Upcoming from "./pages/Upcoming";
import Profile from "./pages/Profile";
import Help from "./pages/Help";
import Moderation from "./pages/Moderation";
import Register from "./pages/Register";

import { AuthProvider } from "./authContext";
import { I18nProvider } from "./i18n";



/**
 * käynnistää MSW-mockit vaan, jos URL on asetettu arvoon mock arvoon.
 */
async function enableMocks() {
  // Mock päälle vaan tietyllä konffilla
  if (import.meta.env.VITE_API_BASE_URL === "/mock") {
    // mock-koodi ladataan vaan mock-tilassa (dynaaminen import )
    const { worker } = await import("./mocks/browser");

    // käynnistetään Service Worker, joka interceptaa fetch/axios-kutsuja (tallentuu selaimeen)
    await worker.start({
      // BASE_URL huomioi esim gh-pages /novi/ -polun
      serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },

      // jos requestii ei osata mockata
      onUnhandledRequest(req, print) {
        // Ei raportoida assettien (kuvat, fontit, tyylit, scriptit) pyyntöjä (legit eliminoi 90% turhasta tavarasta)
        const assetDestinations = ["image", "font", "style", "script"];
        if (assetDestinations.includes(req.destination)) {
          return;
        }

        // sallitaan jotkut tietyt ulkoset hostit (placeholder-kuvat), ettei niistä tuu herjaa
        try {
          const { host } = new URL(req.url);
          const allowHosts = new Set([
            "placehold.co",
            "picsum.photos",
            "images.unsplash.com",
            "cdn.jsdelivr.net",
            "unpkg.com",
          ]);
          if (allowHosts.has(host)) {
            return;
          }
        } catch {
          // jos URLparsinta voi epäonnistuu joissain edge caseissa -> ei kaadeta sovellusta
        }

        // viten omat dev-server -pyynnöt (hot reload tms) ohitetaan
        if (req.url.includes("@vite") || req.url.includes("sockjs-node")) {
          return;
        }

        print.error();
      },
    });
  } 
}

// vaan jos mockit päällä, odotetaan ennen appin käynnistystä, muuten turhaa
await enableMocks();

/**
 * AppLayout toimii kehyksenä (header/footer), ja children-reitit renderöi sen <Outlet />-kohtaan.
 */
const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <AppLayout />,
      children: [
        { index: true, element: <Home /> },

        { path: "courses", element: <ServicesList /> },

        { path: "upcoming", element: <Upcoming /> },

        //(id tulee URL:sta)
        { path: "edit/:id", element: <ServiceEdit /> },
        { path: "new", element: <ServiceEdit /> },

        { path: "login", element: <Login /> },
        { path: "register", element: <Register /> },

        { path: "profile", element: <Profile /> },

        { path: "help", element: <Help /> },

        

        // (UI-tason reitti, oikeudet varmistetaan sivulla)
        { path: "moderation", element: <Moderation /> },
      ],
    },
  ],
  {
    basename: import.meta.env.BASE_URL,
  }
);


ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <I18nProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </I18nProvider>
  </React.StrictMode>
);
