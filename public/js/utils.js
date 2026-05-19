/* File js per gestire funzioni comuni a più pagine*/
const API_BASE_URL = `http://${window.location.hostname}:3000`;

let pendingUnstarId = '';
let pendingUnstarBtn = null;

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
        const href = link.getAttribute('href');
        if (!href || href === '#') return;
        const hrefPart = href.replace(/^\.\.\//, '').replace(/\/$/, '');    // prende ultima cartella dell'href
        link.classList.toggle('active', currentPath.includes(hrefPart));
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
            window.location.href = '/public/pages/login/';
        });
    }
}

// funzione per aggiungere/togliere stella ad un creator 
async function toggleStar(userId, btn) {
    if (btn.classList.contains('active')) {
        const container = btn.closest('article, .creator-card, .profile-hero');
        const username = container.querySelector('strong, .profile-username, .creator-name').textContent;
        requestUnstar(userId, username, btn);
        return;
    }
    try {
        const res = await fetch(`${API_BASE_URL}/api/social/star/${userId}`, { method: 'POST', credentials: 'include' });
        if (res.ok) {
            btn.classList.add('active');
            btn.textContent = '⭐ Starred';
            showToast('Added to starred!', 'success');
        }
    } catch (err) { console.error('Star error:', err); }
}


// funzione per alert personalizzati ---------------------------------
function showConfirm(message, onConfirm, onCancel) {
    let backdrop = document.getElementById('confirmModalBackdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.id = 'confirmModalBackdrop';
        backdrop.className = 'modal-backdrop';
        backdrop.innerHTML = `
            <div class="modal modal-small">
                <div class="modal-body">
                    <p id="confirmModalText"></p>
                </div>
                <div class="modal-footer">
                    <button class="btn-cancel" id="confirmModalCancel">Cancel</button>
                    <button class="btn-add" id="confirmModalOk">OK</button>
                </div>
            </div>`;
        document.body.appendChild(backdrop);
    }
    document.getElementById('confirmModalText').textContent = message;
    backdrop.classList.add('open');

    document.getElementById('confirmModalOk').onclick = () => {
        backdrop.classList.remove('open');
        if (onConfirm) onConfirm();
    };    

    document.getElementById('confirmModalCancel').onclick = () => {
        backdrop.classList.remove('open');
        if (onCancel) onCancel();
    };    
    
}

function showAlert(message, type = '') {
    showToast(message, type);
}
// ------------------------------------------------------------------


function showToast(message, type) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast ${type}`;
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function requestUnstar(id, username, btn) {
    pendingUnstarId = id;
    pendingUnstarBtn = btn;
    const textEl = document.getElementById('unstarModalText');
    if (textEl) textEl.innerHTML = `Remove <strong>${username}</strong> from your starred list?`;
    document.getElementById('unstarModalBackdrop').classList.add('open');
}

function closeUnstarModal() {
    document.getElementById('unstarModalBackdrop').classList.remove('open');
    pendingUnstarId = ''; pendingUnstarBtn = null;
}

async function confirmUnstar() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/social/star/${pendingUnstarId}`, { 
            method: 'POST', 
            credentials: 'include' 
        });

        if (res.ok) {
            if (pendingUnstarBtn) {
                pendingUnstarBtn.classList.remove('active');
                pendingUnstarBtn.textContent = '⭐ Star';
            }
            
            if (window.location.pathname.includes('profile.html')) {
                window.location.reload(); 
            } else {
                showToast('Removed from starred', 'success');
            }
        }
    } catch (err) { 
        console.error("Errore durante l'unstar:", err); 
    }
    
    closeUnstarModal(); 
}

function showToast(message, type) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

// inizializzazione
document.addEventListener('DOMContentLoaded', () => {
    initSidebar();
    highlightCurrentPage();
});

window.toggleStar = toggleStar;
window.handleLogout = handleLogout;
window.requestUnstar = requestUnstar;
window.closeUnstarModal = closeUnstarModal;
window.confirmUnstar = confirmUnstar;