import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient();

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

const root = createRoot(rootElement);

// Initialize premium foundation systems after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('Premium Foundation Systems initializing...');
  
  // Dynamic import to avoid initialization issues
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

  import('./utils/automatedTesting').then(({ automatedTesting }) => {
    console.log('✅ Automated Testing initialized');
    
    // Run initial tests in development
    if (import.meta.env.DEV) {
      setTimeout(async () => {
        try {
          const results = await automatedTesting.runAllTests();
          console.log('Initial test results:', results);
        } catch (error) {
          console.error('Initial tests failed:', error);
        }
      }, 5000);
    }
  }).catch(error => {
    console.warn('Failed to initialize Automated Testing:', error);
  });
});

root.render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);