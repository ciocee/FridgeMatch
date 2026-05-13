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
let pendingDeleteIds = [];
let selectedCategory = '';

const API_URL = `${API_BASE_URL}/api/favourites`; 

/* ---- CARICAMENTO DAL SERVER ---- */
async function loadRecipes() {
    try {
        const response = await fetch(API_URL, {
            method: 'GET',
            credentials: 'include'
        });

        if (response.status === 401) {
            window.location.href = '../login';
            return;
        }

        if (response.ok) {
            favouriteRecipes = await response.json();
            renderFavourites();
        } else {
            console.error('Errore nel recupero dati:', response.status);
        }
    } catch (error) {
        console.error('Errore di connessione:', error);
    }
}

/* ---- CALCOLO STATO DIFFICOLTÀ ---- */
// Calcoliamo la difficoltà in base al numero di passaggi per far funzionare i filtri colorati
function getDifficultyStatus(steps) {
    if (steps <= 3) return 'green';  // Facile
    if (steps <= 7) return 'yellow'; // Medio
    return 'red';                    // Difficile
}

function getDifficultyLabel(status) {
    switch (status) {
        case 'green':  return 'Easy';
        case 'yellow': return 'Medium';
        case 'red':    return 'Hard';
        default:       return 'Unknown';
    }
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

/* ---- RENDER ---- */
function renderFavourites() {
    const list = document.getElementById('favouritesList');
    const emptyState = document.getElementById('emptyState');
    const searchVal = document.getElementById('searchInput').value.toLowerCase().trim();

    let recipes = [...favouriteRecipes];

    if (activeFilter !== 'all') {
        recipes = recipes.filter(r => getDifficultyStatus(r.steps) === activeFilter);
    }

    if (searchVal) {
        recipes = recipes.filter(r =>
            r.name.toLowerCase().includes(searchVal) ||
            r.category.toLowerCase().includes(searchVal)
        );
    }

    // Ordina per nome (alfabetico)
    recipes.sort((a, b) => a.name.localeCompare(b.name));

    list.innerHTML = '';

    if (recipes.length === 0) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
        recipes.forEach(recipe => list.appendChild(createRecipeRow(recipe)));
    }

    updateBulkBar();
}

function createRecipeRow(recipe) {
    const status = getDifficultyStatus(recipe.steps);
    const cat = CATEGORIES.find(c => c.id === recipe.category) || CATEGORIES[11];
    const li = document.createElement('li');
    li.className = 'favourites-item'; // Assicurati che il CSS supporti questa classe o usa quella giusta
    const recipeId = recipe._id || recipe.id;
    li.dataset.id = recipeId;

    li.innerHTML = `
        <input type="checkbox" onchange="toggleSelect('${recipeId}', this)">
        <span class="item-name">${escapeHtml(recipe.name)}</span>
        <span class="item-category">
            <span class="cat-icon">${cat.emoji}</span>
            <span>${cat.label}</span>
        </span>
        <span class="item-steps">${recipe.steps} steps</span>
        <span class="item-time">${formatDate(recipe.time)}</span>
        <span class="status-badge ${status}">
            <span class="status-dot-circle"></span>
            ${getDifficultyLabel(status)}
        </span>
        <button class="delete-row-btn" onclick="requestDelete(['${recipeId}'])" title="Delete">🗑</button>
    `;

    return li;
}

function escapeHtml(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

/* ---- FILTRI ---- */
function setFilter(filter, btn) {
    activeFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderFavourites();
}

/* ---- SELEZIONE MULTIPLA ---- */
function toggleSelect(id, checkbox) {
    const row = document.querySelector(`.favourites-item[data-id="${id}"]`);
    if (checkbox.checked) {
        row.classList.add('selected');
    } else {
        row.classList.remove('selected');
    }
    updateBulkBar();
}

function getSelectedIds() {
    return [...document.querySelectorAll('.favourites-item.selected')].map(el => el.dataset.id);
}

function updateBulkBar() {
    const selected = getSelectedIds();
    const bar = document.getElementById('bulkBar');
    const count = document.getElementById('bulkCount');
    if (selected.length > 0) {
        bar.classList.add('visible');
        count.textContent = `${selected.length} recipe${selected.length > 1 ? 's' : ''} selected`;
    } else {
        bar.classList.remove('visible');
    }
}

/* ---- AGGIUNTA ---- */
function openAddModal() {
    selectedCategory = '';
    document.getElementById('addRecipeForm').reset();
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('selected'));
    document.getElementById('addModalBackdrop').classList.add('open');
    document.getElementById('recipeName').focus();
}

function closeAddModal(event) {
    if (event && event.target !== document.getElementById('addModalBackdrop')) return;
    document.getElementById('addModalBackdrop').classList.remove('open');
}

function buildCategoryGrid() {
    const grid = document.getElementById('categoryGrid');
    grid.innerHTML = '';
    CATEGORIES.forEach(cat => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'cat-btn';
        btn.dataset.id = cat.id;
        btn.innerHTML = `
            <span class="cat-emoji">${cat.emoji}</span>
            <span class="cat-label">${cat.label}</span>
        `;
        btn.addEventListener('click', () => selectCategory(cat.id));
        grid.appendChild(btn);
    });
}

function selectCategory(id) {
    selectedCategory = id;
    document.querySelectorAll('.cat-btn').forEach(b => {
        b.classList.toggle('selected', b.dataset.id === id);
    });
}

async function addRecipe(event) {
    event.preventDefault();

    const name = document.getElementById('recipeName').value.trim();
    const steps = document.getElementById('recipeSteps').value;
    const time = document.getElementById('recipeTime').value;

    if (!name || !steps || !time) return;

    if (!selectedCategory) {
        const grid = document.getElementById('categoryGrid');
        grid.style.outline = '2px solid var(--accent-orange)';
        grid.style.borderRadius = '10px';
        setTimeout(() => { grid.style.outline = 'none'; }, 1500);
        return;
    }

    const newRecipe = { name, category: selectedCategory, steps: parseInt(steps), time };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(newRecipe)
        });

        if (response.status === 401) {
            window.location.href = '../login';
            return;
        }

        if (response.ok) {
            await loadRecipes();
            document.getElementById('addModalBackdrop').classList.remove('open');
        }
    } catch (error) {
        console.error("Errore durante l'aggiunta:", error);
    }
}

/* ---- ELIMINAZIONE ---- */
function requestDelete(ids) {
    pendingDeleteIds = ids;
    const text = ids.length === 1
        ? `Are you sure you want to delete <strong>${escapeHtml(getRecipeName(ids[0]))}</strong>?`
        : `Are you sure you want to delete <strong>${ids.length} recipes</strong>?`;
    document.getElementById('deleteModalText').innerHTML = text;
    document.getElementById('deleteModalBackdrop').classList.add('open');
}

function confirmBulkDelete() {
    requestDelete(getSelectedIds());
}

async function confirmDelete() {
    try {
        const response = await fetch(API_URL, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ ids: pendingDeleteIds })
        });

        if (response.ok) {
            await loadRecipes();
            closeDeleteModal();
        }
    } catch (error) {
        console.error("Errore durante l'eliminazione:", error);
    }
}

function closeDeleteModal() {
    document.getElementById('deleteModalBackdrop').classList.remove('open');
    pendingDeleteIds = [];
}

function getRecipeName(id) {
    return (favouriteRecipes.find(r => (r._id || r.id) === id) || {}).name || '';
}

/* ---- INIT ---- */
document.addEventListener('DOMContentLoaded', () => {
    //buildCategoryGrid();
    loadRecipes(); // Carica le ricette invece degli ingredienti

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            closeAddModal();
            closeDeleteModal();
        }
    });
});