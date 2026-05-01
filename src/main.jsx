import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'
import App from './App.jsx'
import { clerkPublishableKey } from './lib/authClients'

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

const content = (
  <StrictMode>
    <App />
  </StrictMode>
)

createRoot(document.getElementById('root')).render(
  clerkPublishableKey ? (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      {content}
    </ClerkProvider>
  ) : (
    content
  ),
)
