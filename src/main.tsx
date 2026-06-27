import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// DEBUG: clear any corrupted persisted state
localStorage.clear();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
