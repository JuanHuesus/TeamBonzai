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
import Moderation from "./pages/Moderation"; // <- moderaattorin näkymä
import Register from "./pages/Register";

import { AuthProvider } from "./authContext";
import { I18nProvider } from "./i18n";

async function enableMocks() {
  if (import.meta.env.VITE_API_BASE_URL === "/mock") {
    const { worker } = await import("./mocks/browser");

    await worker.start({
      serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
      onUnhandledRequest(req, print) {
        const assetDestinations = ["image", "font", "style", "script"];
        if (assetDestinations.includes(req.destination)) {
          return;
        }

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
          // ignore
        }

        if (req.url.includes("@vite") || req.url.includes("sockjs-node")) {
          return;
        }

        print.error();
      },
    });
  }
}

await enableMocks();

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <AppLayout />,
      children: [
        // Etusivu: suosituimmat + ruoka-teema + kaikki kurssit
        { index: true, element: <Home /> },

        // Kaikki kurssit
        { path: "courses", element: <ServicesList /> },

        // Tulevat tapahtumat omalla välilehdellä
        { path: "upcoming", element: <Upcoming /> },

        // Kurssin luonti / muokkaus
        { path: "edit/:id", element: <ServiceEdit /> },
        { path: "new", element: <ServiceEdit /> },

        // Auth
        { path: "login", element: <Login /> },
        { path: "register", element: <Register /> },

        // Käyttäjäprofiili (MVP + omat raportit)
        { path: "profile", element: <Profile /> },

        // Apu / FAQ / käyttöehdot
        { path: "help", element: <Help /> },

        // Moderaattorien raporttinäkymä
        { path: "moderation", element: <Moderation /> },
      ],
    },
  ],
  {
    basename: import.meta.env.BASE_URL, // "/novi/"
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


