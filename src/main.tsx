import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import './i18n';

let authErrorTriggeredAt = 0;

const originalFetch = window.fetch;
Object.defineProperty(window, 'fetch', {
  value: async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const token = sessionStorage.getItem('app_token');
    const headers = new Headers(init.headers || {});
    const existing = (headers.get('Authorization') || '').trim();
    const emptyBearer = existing === '' || existing === 'Bearer' || existing === 'Bearer null' || existing === 'Bearer undefined';
    if (token && emptyBearer) headers.set('Authorization', `Bearer ${token}`);
    const res = await originalFetch(input, { ...init, headers });

    // Выход только по настоящему 401 от нашего API (плохой/отозванный токен), не по 403 и не по чужим доменам
    if (res.status === 401 && token) {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
      const isOurApi = url.startsWith('/api/') || url.startsWith(`${location.origin}/api/`);
      const isAuthRoute = /\/api\/auth\/(login|register|forgot|reset)/.test(url);
      if (isOurApi && !isAuthRoute) {
        let code = '';
        try { code = String((await res.clone().json())?.error || ''); } catch { /* не JSON */ }
        const fatal = code === 'unauthorized' || code === 'token_revoked';
        const now = Date.now();
        if (fatal && (now - authErrorTriggeredAt) > 3000) {
          authErrorTriggeredAt = now;
          console.warn('[auth] session expired on', url, code);
          window.dispatchEvent(new CustomEvent('session-expired'));
        }
      }
    }
    return res;
  },
  writable: false,
  configurable: true
});

import { HelmetProvider } from 'react-helmet-async';
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>,
);
