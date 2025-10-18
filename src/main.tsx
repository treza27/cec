import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ErrorBoundary from './components/ErrorBoundary';
import './i18n';
import App from './App.tsx';
import './index.css';

<<<<<<< HEAD
console.log('🚀 Application starting...');
console.log('Environment:', import.meta.env.MODE);
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL ? '✅ Configured' : '❌ Missing');
console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Configured' : '❌ Missing');

=======
>>>>>>> cf6006487c52e715d9e65e259f4485990e3a63ec
// Configuration du client React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

<<<<<<< HEAD
const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('❌ CRITICAL ERROR: Root element not found!');
  document.body.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; font-family: system-ui, -apple-system, sans-serif; background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); color: white; padding: 20px;">
      <div style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); padding: 40px; border-radius: 20px; max-width: 500px; text-align: center;">
        <h1 style="font-size: 2.5rem; margin-bottom: 1rem;">⚠️ Erreur de chargement</h1>
        <p style="font-size: 1.2rem; margin-bottom: 2rem; opacity: 0.9;">L'application n'a pas pu démarrer correctement.</p>
        <p style="font-size: 1rem; opacity: 0.8; margin-bottom: 2rem;">Veuillez vider le cache de votre navigateur et réessayer.</p>
        <button onclick="location.reload()" style="background: white; color: #3b82f6; border: none; padding: 15px 30px; border-radius: 10px; font-size: 1rem; font-weight: bold; cursor: pointer;">Recharger la page</button>
      </div>
    </div>
  `;
  throw new Error('Root element not found');
}

try {
  console.log('✅ Root element found, initializing React...');

  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </ErrorBoundary>
    </StrictMode>
  );

  console.log('✅ React application rendered successfully!');
} catch (error) {
  console.error('❌ CRITICAL ERROR during React initialization:', error);
  document.body.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; font-family: system-ui, -apple-system, sans-serif; background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); color: white; padding: 20px;">
      <div style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); padding: 40px; border-radius: 20px; max-width: 500px; text-align: center;">
        <h1 style="font-size: 2.5rem; margin-bottom: 1rem;">⚠️ Erreur fatale</h1>
        <p style="font-size: 1.2rem; margin-bottom: 2rem; opacity: 0.9;">Une erreur s'est produite lors de l'initialisation de l'application.</p>
        <p style="font-size: 0.9rem; opacity: 0.8; margin-bottom: 2rem; font-family: monospace; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 5px; word-break: break-all;">${error instanceof Error ? error.message : 'Unknown error'}</p>
        <button onclick="location.reload()" style="background: white; color: #3b82f6; border: none; padding: 15px 30px; border-radius: 10px; font-size: 1rem; font-weight: bold; cursor: pointer;">Recharger la page</button>
      </div>
    </div>
  `;
  throw error;
}
=======
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>
);
>>>>>>> cf6006487c52e715d9e65e259f4485990e3a63ec
