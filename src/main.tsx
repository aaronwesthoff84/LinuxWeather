import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// DEBUG: clear persisted state to rule out corruption from newer versions
localStorage.removeItem("linux-weather-state-v1");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
