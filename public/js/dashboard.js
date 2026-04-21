/* script specifico per la dashboard */
const API_URL = 'http://127.0.0.1:3000/api/fridge';

document.addEventListener('DOMContentLoaded', () => {
    // gestione stato guest per adattare il contenuto della dashboard
    const userMode = sessionStorage.getItem('userMode');

    if (userMode === 'guest') {
        const socialNav = document.getElementById('social-nav-content');
        if (socialNav) {
            socialNav.innerHTML = `
                <div style="padding: 10px; font-size: 0.8rem; color: var(--gray-medium);">
                    Login to share recipes!
                </div>
            `;
        }

        // tasto di logout diventa tasto di login per utenti ospite
        const authContainer = document.getElementById('auth-button-container');
        if (authContainer) {
            authContainer.innerHTML = `
                <button class="logout-btn" 
                        style="background-color: var(--primary-green); color: var(--white);" 
                        onclick="location.href='../login/index.html'">
                    Login
                </button>
            `;
        }
        
        showEmptyFridge();
        showEmptyExpiring();
    } else {
        loadDashboardItems();
    }
});

async function loadDashboardItems() {
    try {
        const response = await fetch(API_URL, {
            method: 'GET',
            credentials: 'include'
        });
 
        if (response.status === 401) {
            window.location.href = '../login/index.html';
            return;
        }
 
        if (!response.ok) {
            showEmptyFridge();
            showEmptyExpiring();
            return;
        }
 
        const items = await response.json();
 
        // ordina per scadenza più vicina
        items.sort((a, b) => new Date(a.expiry) - new Date(b.expiry));
 
        populateFridgeList(items);
        populateExpiringList(items);
 
    } catch (error) {
        console.error('Errore caricamento dashboard:', error);
        showEmptyFridge();
        showEmptyExpiring();
    }
}
 
function getExpiryStatus(expiryDateStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDateStr);
    expiry.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    if (diffDays <= 7)  return 'red';
    if (diffDays <= 14) return 'orange';
    if (diffDays <= 21) return 'yellow';
    return 'green';
}
 
const CATEGORY_EMOJI = {
    meat: '🥩', fish: '🐟', dairy: '🧀', eggs: '🥚',
    vegetables: '🥦', fruit: '🍎', cereals: '🌾', legumes: '🫘',
    bread: '🍞', sauces: '🫙', drinks: '🥤', other: '📦'
};
 
function populateFridgeList(items) {
    const fridgeUl = document.getElementById('fridge-list');
    if (!fridgeUl) return;
 
    if (items.length === 0) {
        showEmptyFridge();
        return;
    }
 
    // mostra max 5 items nella dashboard
    const preview = items.slice(0, 5);
    fridgeUl.innerHTML = preview.map(item => {
        const status = getExpiryStatus(item.expiry);
        const emoji = CATEGORY_EMOJI[item.category] || '📦';
        return `
            <li>
                ${emoji} <strong>${item.name}</strong> — ${item.qty} ${item.unit}
                <span class="status-dot ${status}" style="
                    display:inline-block; width:8px; height:8px;
                    border-radius:50%; margin-left:6px;
                    background:${status === 'red' ? '#e53e3e' : status === 'orange' ? '#dd8800' : status === 'yellow' ? '#c4a000' : '#38a169'};
                "></span>
            </li>
        `;
    }).join('');
}
 
function populateExpiringList(items) {
    const expiringUl = document.getElementById('expiring-list');
    if (!expiringUl) return;
 
    // mostra solo items in scadenza entro 7 giorni
    const expiring = items.filter(i => getExpiryStatus(i.expiry) === 'red');
 
    if (expiring.length === 0) {
        showEmptyExpiring();
        return;
    }
 
    expiringUl.innerHTML = expiring.map(item => {
        const today = new Date();
        today.setHours(0,0,0,0);
        const exp = new Date(item.expiry);
        exp.setHours(0,0,0,0);
        const days = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
        const daysText = days <= 0 ? 'Expired!' : days === 1 ? 'tomorrow' : `in ${days} days`;
        return `<li>⚠️ <strong>${item.name}</strong> expires ${daysText}</li>`;
    }).join('');
}

// placeholder per frigo vuoto
function showEmptyFridge() {
    const fridgeUl = document.getElementById('fridge-list');
    if (fridgeUl) {
        fridgeUl.innerHTML = "<li>Fridge is empty. Use the + button to add items.</li>";
    }
}

// placeholder per items in scadenza
function showEmptyExpiring() {
    const expiringUl = document.getElementById('expiring-list');
    if (expiringUl) {
        expiringUl.innerHTML = "<li>No notifications for now.</li>";
    }
}


// funzione logout
function handleLogout() {
    if (confirm("Are you sure you want to logout?")) {
        fetch('http://127.0.0.1:3000/auth/logout', {
            method: 'POST',
            credentials: 'include'
        }).finally(() => {
            sessionStorage.clear();
            window.location.href = "../login/index.html";
        });
    }
}

// funzione che porta alla sezione per l'aggiunta di items al frigo
function goToAddItem() {
    window.location.href = "../fridge/index.html";
}