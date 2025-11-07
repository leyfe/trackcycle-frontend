import React from "react";
import ReactDOM from "react-dom/client";
import { NextUIProvider } from "@nextui-org/react";
import { CustomerProvider } from "./context/CustomerContext";
import { ProjectProvider } from "./context/ProjectContext";
import { BrowserRouter } from "react-router-dom";
import { ToastProvider } from "./components/Toast";
import App from "./App.jsx";
import "./index.css";


if (import.meta.env.MODE === "production" && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/apps/track/sw.js", {
        scope: "/apps/track/",
        type: "module", // wenn dein SW ein ES-Modul ist
      })
      .then(() => console.log("✅ Service Worker registriert"))
      .catch((err) => console.error("❌ SW-Fehler:", err));
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <NextUIProvider>
      <ToastProvider>
        <CustomerProvider>
          <ProjectProvider>
              <BrowserRouter basename={import.meta.env.MODE === "production" ? "/track" : "/"}>
              <App />
            </BrowserRouter>
          </ProjectProvider>
        </CustomerProvider>
      </ToastProvider>
    </NextUIProvider>
  </React.StrictMode>
);