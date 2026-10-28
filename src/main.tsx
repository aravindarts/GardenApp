import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Ensure window.fetch remains writable/assignable for browser extensions or interceptors
try {
  const desc = Object.getOwnPropertyDescriptor(window, 'fetch');
  if (desc && desc.configurable && desc.get && !desc.set) {
    let activeFetch = window.fetch.bind(window);
    Object.defineProperty(window, 'fetch', {
      configurable: true,
      enumerable: true,
      get: () => activeFetch,
      set: (fn) => {
        if (typeof fn === 'function') {
          activeFetch = fn;
        }
      },
    });
  }
} catch {
  // Safe no-op if locked by host container
}

createRoot(document.getElementById('root')!).render(<App />);

