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
    await worker.start();
  }
}
await enableMocks();

const router = createBrowserRouter([
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
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);
