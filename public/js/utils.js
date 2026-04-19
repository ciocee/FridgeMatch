/* File js per gestire funzioni comuni a più pagine*/

// gestione sidebar
function initSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('overlay');
    const menuBtn = document.querySelector('.mobile-menu-btn');

    if (sidebar && menuBtn) {
        // Funzione globale chiamata dall'HTML
        window.toggleSidebar = () => {
            const isActive = sidebar.classList.toggle('active');
            if (overlay) overlay.classList.toggle('active', isActive);
        };

        // Chiusura al mouseleave (richiesta precedentemente)
        sidebar.addEventListener('mouseleave', () => {
            sidebar.classList.remove('active');
            if (overlay) overlay.classList.remove('active');
        });
    }
}

// gestione colori badge scadenze
function getPriorityColor(expiryDateStr) {
    const today = new Date();
    const expiry = new Date(expiryDateStr);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) return 'red';    // scaduto o scade domani
    if (diffDays <= 4) return 'orange'; // scade a breve
    return 'green';                      // scadenza ancora lontana
}

// caricamento dati frigo 
async function loadFridgeData() {
    /* ingredienti a caso perché volevo vedere come venivano visualizzati
    return [
        { name: "Prosciutto", expiryDate: "2026-04-20" },
        { name: "Mozzarella", expiryDate: "2026-04-22" },
        { name: "Cheese", expiryDate: "2026-04-23" },
        { name: "Strawberry", expiryDate: "2026-04-30" }
    ]; */
}

// evidenzia la pagina corrente
function highlightCurrentPage() {
    const links = document.querySelectorAll('.nav-menu a');
    const currentPath = window.location.pathname;
    links.forEach(link => {
        if (currentPath.includes(link.getAttribute('href'))) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

document.addEventListener('DOMContentLoaded', initSidebar);