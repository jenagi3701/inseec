import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import App from './App';
import { AppProvider } from './store/AppContext';
import { ToastProvider } from './components/Toast';
import './index.css';

// The embedded build runs inside a sandboxed frame: keep navigation in memory.
const Router = __EMBEDDED__ ? MemoryRouter : BrowserRouter;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <AppProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AppProvider>
    </Router>
  </StrictMode>,
);
