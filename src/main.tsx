import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./styles.css";
import AppLayout from "./App";
import ServicesList from "./pages/ServicesList";
import ServiceEdit from "./pages/ServiceEdit";
import Login from "./pages/Login";
import { AuthProvider } from "./authContext";

async function enableMocks() {
  if (import.meta.env.VITE_API_BASE_URL === "/mock") {
    const { worker } = await import("./mocks/browser");
    await worker.start({
      serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
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
        { index: true, element: <ServicesList /> },
        { path: "edit/:id", element: <ServiceEdit /> },
        { path: "new", element: <ServiceEdit /> },
        { path: "login", element: <Login /> },
      ],
    },
  ],
  {
    basename: import.meta.env.BASE_URL, // "/novi/"
  }
);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);
