
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
// Removed automatic table creation to prevent connection tests on each load

// Apply theme from localStorage or default to system theme
const applyStoredTheme = () => {
  const theme = localStorage.getItem('theme') || 'system';
  const root = window.document.documentElement;

  root.classList.remove('light', 'dark');

  if (theme === 'system') {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    root.classList.add(systemTheme);
  } else {
    root.classList.add(theme);
  }
};

// Apply theme before rendering
applyStoredTheme();

// Listen for system theme changes
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
mediaQuery.addEventListener('change', () => {
  if (localStorage.getItem('theme') === 'system') {
    applyStoredTheme();
  }
});

createRoot(document.getElementById("root")!).render(<App />);
