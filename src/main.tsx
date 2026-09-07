import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { errorLogger } from './services/errorLogger.ts';
import { validateFirebaseConfig } from './firebase/config.ts';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

// Initialize global exception and unhandled rejection hooks immediately
errorLogger.setupGlobalHandlers();

// Verify Firebase environment parameters at application bootstrap
validateFirebaseConfig();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
