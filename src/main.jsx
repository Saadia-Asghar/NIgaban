import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/react";
import "./index.css";
import App from "./App.jsx";
import { ToastProvider } from "./lib/toastContext.jsx";
import { ErrorBoundary, OfflineIndicator } from "./components/AppShell.jsx";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

// ClerkProvider: trim the key when set. Empty string would break init,
// so omit the prop for Clerk keyless / dev onboarding flow.
const rawClerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const publishableKey =
  typeof rawClerkKey === "string" && rawClerkKey.trim() ? rawClerkKey.trim() : undefined;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <ClerkProvider publishableKey={publishableKey}>
        <ToastProvider>
          <OfflineIndicator />
          <App />
        </ToastProvider>
      </ClerkProvider>
    </ErrorBoundary>
  </StrictMode>,
);
