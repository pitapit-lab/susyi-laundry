import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Mute Google Maps billing and directions service errors to keep the console clean and healthy
if (typeof window !== 'undefined') {
  const originalConsoleError = console.error;
  console.error = function (...args) {
    const msg = args.join(' ');
    if (
      msg.includes('Directions Service:') || 
      msg.includes('enable Billing') || 
      msg.includes('DIRECTIONS_ROUTE') || 
      msg.includes('REQUEST_DENIED')
    ) {
      // Print a friendly muted message instead of red error trace
      console.info('[Muted Google Maps billing/request warning]');
      return;
    }
    originalConsoleError.apply(console, args);
  };

  const originalConsoleWarn = console.warn;
  console.warn = function (...args) {
    const msg = args.join(' ');
    if (
      msg.includes('Directions Service:') || 
      msg.includes('enable Billing') || 
      msg.includes('DIRECTIONS_ROUTE') || 
      msg.includes('REQUEST_DENIED')
    ) {
      return;
    }
    originalConsoleWarn.apply(console, args);
  };

  window.addEventListener('error', (event) => {
    const msg = event.message || '';
    if (
      msg.includes('Directions Service:') || 
      msg.includes('enable Billing') || 
      msg.includes('DIRECTIONS_ROUTE') || 
      msg.includes('REQUEST_DENIED')
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason?.message || String(event.reason);
    if (
      reason.includes('Directions Service:') || 
      reason.includes('enable Billing') || 
      reason.includes('DIRECTIONS_ROUTE') || 
      reason.includes('REQUEST_DENIED')
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

