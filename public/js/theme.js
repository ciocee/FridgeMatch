const THEME_KEY = 'fridgematch-theme';

function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved ?? (prefersDark ? 'dark' : 'light');
    applyTheme(theme, false);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next, true);
}

function applyTheme(theme, save = true) {
    document.documentElement.setAttribute('data-theme', theme);
    if (save) localStorage.setItem(THEME_KEY, theme);

    // aggiorna tutti i toggle presenti nella pagina
    document.querySelectorAll('.theme-toggle').forEach(el => {
        el.setAttribute('aria-checked', theme === 'dark');
        el.classList.toggle('on', theme === 'dark');
    });
}

// Inizializza subito (prima del render) per evitare flash
initTheme();

// Dopo il DOM, aggiorna i toggle grafici
document.addEventListener('DOMContentLoaded', () => {
    const theme = document.documentElement.getAttribute('data-theme');
    document.querySelectorAll('.theme-toggle').forEach(el => {
        el.setAttribute('aria-checked', theme === 'dark');
        el.classList.toggle('on', theme === 'dark');
    });
});