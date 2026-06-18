import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { ClientPortal } from "./components/ClientPortal.jsx";
import "./index.css";

const params = new URLSearchParams(window.location.search);
const lockedClientMode = params.get("mode") === "client" || params.get("client") === "1";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {lockedClientMode ? <ClientPortal /> : <App />}
  </React.StrictMode>,
);
