import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { queryClient } from "@/config/queryClient";
import App from "./App";
import "./index.css";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

const root = createRoot(rootElement);

// Initialize monitoring systems in production
const ENABLE_MONITORING = import.meta.env.PROD;

if (ENABLE_MONITORING) {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('Production monitoring initializing...');
    
    import('./utils/realUserMonitoring').then(() => {
      console.log('✅ Real User Monitoring initialized');
    }).catch(error => {
      console.warn('Failed to initialize RUM:', error);
    });

    import('./utils/securityHeaders').then(() => {
      console.log('✅ Security Headers initialized');
    }).catch(error => {
      console.warn('Failed to initialize Security Headers:', error);
    });
  });
}

root.render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);