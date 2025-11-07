import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { getConfig } from "./config"; // reads window.SAP_CONFIG or env

function bootstrap() {
  try {
    const config = getConfig();
    console.info("SAP Helper config loaded:", config);
  } catch (err) {
    console.error(err);
    const root = document.getElementById("sap-helper-root");
    if (root) {
      root.innerHTML = `
        <div style="padding:20px;font-family:sans-serif;color:#b00">
          <strong>SAP Helper:</strong><br>
          Missing or invalid configuration.<br>
          Use the shortcode:<br>
          <code>[sap_helper_app api="YOUR_API_KEY" tcode="YOUR_VECTOR_STORE_ID"]</code>
        </div>`;
    }
    return;
  }

  const container = document.getElementById("sap-helper-root");
  if (!container) throw new Error("Missing #sap-helper-root element in DOM.");

  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

// Run after DOM ready
if (document.readyState === "complete" || document.readyState === "interactive") {
  bootstrap();
} else {
  window.addEventListener("DOMContentLoaded", bootstrap);
}
