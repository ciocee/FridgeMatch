window.API_BASE_URL = `http://${window.location.hostname}:3000`;

// Categorie per le Ricette
const CATEGORIES = [
    { id: 'breakfast',  label: 'Breakfast',    emoji: '☕' }, 
    { id: 'appetizer',  label: 'Appetizer',    emoji: '🍢' }, 
    { id: 'first',      label: 'First Course', emoji: '🍝' }, 
    { id: 'main',       label: 'Main Course',  emoji: '🥩' },  
    { id: 'side',       label: 'Side Dish',    emoji: '🥗' },  
    { id: 'snack',      label: 'Snack',        emoji: '🥨' },  
    { id: 'dessert',    label: 'Dessert',      emoji: '🍰' }, 
    { id: 'other',      label: 'Other',        emoji: '📖' },  
];

// Stato
let favouriteRecipes = [];
let activeFilter = 'all';
let pendingDeleteId = null;

const API_URL = `${API_BASE_URL}/api/favourites`;

/* ════════════════════════════════════════
   CARICAMENTO
════════════════════════════════════════ */
async function loadRecipes() {
    try {
        const response = await fetch(API_URL, { method: 'GET', credentials: 'include' });

        if (response.status === 401) { window.location.href = '../login'; return; }

        if (response.ok) {
            favouriteRecipes = await response.json();
            renderFavourites();
        }
    } catch (error) {
        console.error('Errore di connessione:', error);
    }
}

/* ════════════════════════════════════════
   API PREFERITI (usate anche da altre pagine)
════════════════════════════════════════ */
async function addToFavourites(recipeId) {
    try {
        const response = await fetch(`${API_URL}/${recipeId}`, { method: 'POST', credentials: 'include' });
        if (response.status === 409) return { alreadyExists: true };
        if (response.ok) return { success: true };
    } catch (e) { console.error('Errore aggiunta preferito:', e); }
    return { success: false };
}

async function removeFromFavourites(recipeId) {
    try {
        const response = await fetch(`${API_URL}/${recipeId}`, { method: 'DELETE', credentials: 'include' });
        if (response.ok) return { success: true };
    } catch (e) { console.error('Errore rimozione preferito:', e); }
    return { success: false };
}

async function checkIsFavourite(recipeId) {
    try {
        const response = await fetch(`${API_URL}/check/${recipeId}`, { credentials: 'include' });
        if (response.ok) { const data = await response.json(); return data.isFavourite; }
    } catch (e) { console.error('Errore check preferito:', e); }
    return false;
}

async function toggleFavourite(recipeId, heartBtn) {
    const isFav = heartBtn.classList.contains('active');
    if (isFav) {
        const result = await removeFromFavourites(recipeId);
        if (result.success) { heartBtn.classList.remove('active'); heartBtn.textContent = '🤍'; }
    } else {
        const result = await addToFavourites(recipeId);
        if (result.success || result.alreadyExists) { heartBtn.classList.add('active'); heartBtn.textContent = '❤️'; }
    }
}

/* ════════════════════════════════════════
   RENDER GRIGLIA CARD
════════════════════════════════════════ */
function renderFavourites() {
    const grid = document.getElementById('favouritesList');
    const emptyState = document.getElementById('emptyState');
    if (!grid) return;

    const searchVal = document.getElementById('searchInput')?.value.toLowerCase().trim() || '';

    let recipes = [...favouriteRecipes];

    // Filtro dieta
    if (activeFilter !== 'all') {
        recipes = recipes.filter(r => r[activeFilter] === true);
    }

    // Filtro ricerca
    if (searchVal) {
        recipes = recipes.filter(r => r.title.toLowerCase().includes(searchVal));
    }

    // Ordine alfabetico
    recipes.sort((a, b) => a.title.localeCompare(b.title));

    grid.innerHTML = '';

    if (recipes.length === 0) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
        recipes.forEach(recipe => grid.appendChild(createRecipeCard(recipe)));
    }
}

function createRecipeCard(recipe) {
    const article = document.createElement('article');
    article.className = 'fav-card';
    article.dataset.id = recipe.recipeId;

    // Badge dieta
    const badges = [];
    if (recipe.glutenFree)  badges.push('<span class="diet-badge">🌾 Gluten-Free</span>');
    if (recipe.dairyFree)   badges.push('<span class="diet-badge">🥛 Dairy-Free</span>');
    if (recipe.vegetarian)  badges.push('<span class="diet-badge">🥚 Vegetarian</span>');
    if (recipe.vegan)       badges.push('<span class="diet-badge">🌿 Vegan</span>');

    const imgHtml = recipe.image
        ? `<img class="fav-card-img" src="${recipe.image}" alt="${escapeHtml(recipe.title)}" loading="lazy">`
        : `<div class="fav-card-img-placeholder">🍽️</div>`;

    article.innerHTML = `
        ${imgHtml}
        <div class="fav-card-body">
            <p class="fav-card-title">${escapeHtml(recipe.title)}</p>
            <div class="fav-card-meta">
                ${recipe.readyInMinutes ? `<span>⏱ ${recipe.readyInMinutes} min</span>` : ''}
                ${recipe.macros?.calories ? `<span>🔥 ${recipe.macros.calories}</span>` : ''}
                ${recipe.servings ? `<span>🍽 ${recipe.servings} serv.</span>` : ''}
            </div>
            ${badges.length ? `<div class="fav-diet-badges">${badges.join('')}</div>` : ''}
        </div>
        <div class="fav-card-footer">
            <button class="fav-remove-btn" title="Remove from favourites">🗑 Remove</button>
        </div>
    `;

    // Bottone rimuovi
    article.querySelector('.fav-remove-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        requestDelete(recipe.recipeId);
    });

    // Click sulla card → apri dettaglio ricetta
    article.style.cursor = 'pointer';
    article.addEventListener('click', () => {
        window.location.href = `../replicable/?id=${recipe.recipeId}`;
    });

    return article;
}

function escapeHtml(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

/* ════════════════════════════════════════
   FILTRI
════════════════════════════════════════ */
function setFilter(filter, btn) {
    activeFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderFavourites();
}

/* ════════════════════════════════════════
   ELIMINAZIONE
════════════════════════════════════════ */
function requestDelete(recipeId) {
    pendingDeleteId = recipeId;
    const recipe = favouriteRecipes.find(r => r.recipeId === recipeId);
    const name = recipe ? recipe.title : 'this recipe';
    document.getElementById('deleteModalText').innerHTML =
        `Are you sure you want to remove <strong>${escapeHtml(name)}</strong> from favourites?`;
    document.getElementById('deleteModalBackdrop').classList.add('open');
}

async function confirmDelete() {
    if (!pendingDeleteId) return;
    try {
        await fetch(`${API_URL}/${pendingDeleteId}`, { method: 'DELETE', credentials: 'include' });
        pendingDeleteId = null;
        await loadRecipes();
        closeDeleteModal();
    } catch (error) {
        console.error("Errore eliminazione:", error);
    }
}

function closeDeleteModal() {
    document.getElementById('deleteModalBackdrop').classList.remove('open');
    pendingDeleteId = null;
}

/* ════════════════════════════════════════
   INIT
════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    loadRecipes();

    document.getElementById('searchInput')?.addEventListener('input', renderFavourites);

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeDeleteModal();
    });
});