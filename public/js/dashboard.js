/* script specifico per la dashboard */

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
    }

    // placeholder per frigo vuoto
    const fridgeUl = document.getElementById('fridge-list');
    const expiringUl = document.getElementById('expiring-list');

    if (fridgeUl && fridgeUl.children.length === 0) {
        fridgeUl.innerHTML = "<li>Fridge is empty. Use the + button to add items.</li>";
    }

    if (expiringUl && expiringUl.children.length === 0) {
        expiringUl.innerHTML = "<li>No notifications for now.</li>";
    }
});

// funzione logout
function handleLogout() {
    if (confirm("Are you sure you want to logout?")) {
        sessionStorage.clear();
        window.location.href = "../login/index.html";
    }
}

// funzione che porta alla sezione per l'aggiunta di items al frigo
function goToAddItem() {
    window.location.href = "../fridge/index.html";
}