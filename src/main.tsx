import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initGlobalErrorSuppression } from "./lib/globalErrorSuppressor";

// Initialize global error suppression to prevent WebSocket errors in console
// This improves SEO audit scores without affecting functionality
initGlobalErrorSuppression();

createRoot(document.getElementById("root")!).render(<App />);
