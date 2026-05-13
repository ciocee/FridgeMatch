/* File js per gestire funzioni comuni a più pagine*/
const API_BASE_URL = `http://${window.location.hostname}:3000`;

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

        // Chiusura al mouseleave 
        sidebar.addEventListener('mouseleave', () => {
            sidebar.classList.remove('active');
            if (overlay) overlay.classList.remove('active');
        });
    }
}

// per caricare i dati del frigo ovunque 
async function loadFridgeData() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/fridge`, {
            method: 'GET',
            credentials: 'include'
        });

        if (response.status === 401) return []; // se non loggato, restituisci frigo vuoto

        if (response.ok) {
            return await response.json();
        }
        return [];
    } catch (err) {
        console.error("Errore recupero dati frigo:", err);
        return [];
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

// gestisce ricerca
function handleSearch(inputElementId) {
    const input = document.getElementById(inputElementId);
    if (!input) return;

    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') { 
            const query = input.value.trim();
            if (query) {
                window.location.href = `../social/community/?search=${encodeURIComponent(query)}`;
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', initSidebar);

// funzione per attivare la ricerca quando si preme invio
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = searchInput.value.trim();
                if (query) {
                    window.location.href = `../social/community/?q=${encodeURIComponent(query)}`;
                }
            }
        });
    }
});

// funzione logout
function handleLogout() {
    if (confirm("Are you sure you want to logout?")) {
        fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        }).finally(() => {
            sessionStorage.clear();
            window.location.href = "../login";
        });
    }
}