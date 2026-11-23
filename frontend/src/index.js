import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { installBodyLockGuard } from "./lib/bodyLockGuard";

installBodyLockGuard();

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
