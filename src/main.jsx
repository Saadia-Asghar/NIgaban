import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/react'
import './index.css'
import App from './App.jsx'
import HifazatGuide from './components/HifazatGuide.jsx'
import { ToastProvider } from './lib/toastContext.jsx'

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

// ClerkProvider: use a trimmed key when set. Empty string would break init;
// omit the prop for Clerk keyless / dev onboarding flow.
const rawClerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
const publishableKey =
  typeof rawClerkKey === "string" && rawClerkKey.trim() ? rawClerkKey.trim() : undefined

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider publishableKey={publishableKey}>
      <ToastProvider>
        <App />
        <HifazatGuide />
      </ToastProvider>
    </ClerkProvider>
  </StrictMode>,
)
