window.API_BASE_URL = `http://${window.location.hostname}:3000`;

// Categorie con icone
const CATEGORIES = [
    { id: 'meat',       label: 'Meat',       emoji: '🥩' },
    { id: 'fish',       label: 'Fish',       emoji: '🐟' },
    { id: 'dairy',      label: 'Dairy',      emoji: '🧀' },
    { id: 'eggs',       label: 'Eggs',       emoji: '🥚' },
    { id: 'vegetables', label: 'Vegetables', emoji: '🥦' },
    { id: 'fruit',      label: 'Fruit',      emoji: '🍎' },
    { id: 'cereals',    label: 'Cereals',    emoji: '🌾' },
    { id: 'legumes',    label: 'Legumes',    emoji: '🫘' },
    { id: 'bread',      label: 'Bread',      emoji: '🍞' },
    { id: 'sauces',     label: 'Sauces',     emoji: '🫙' },
    { id: 'drinks',     label: 'Drinks',     emoji: '🥤' },
    { id: 'other',      label: 'Other',      emoji: '📦' },
];

// Stato
let fridgeItems = [];
let activeFilter = 'all';
let pendingDeleteIds = [];
let selectedCategory = '';

const API_URL = `${API_BASE_URL}/api/fridge`;

/* ---- CARICAMENTO DAL SERVER (Parte 1: GET) ---- */
async function loadItems() {
    try {
        const response = await fetch(API_URL, {
            method: 'GET',
            credentials: 'include' // Fondamentale per inviare il cookie di sessione
        });

        if (response.status === 401) {
            window.location.href = '../login';
            return;
        }

        if (response.ok) {
            fridgeItems = await response.json();
            renderFridge(); // Chiama il disegno della lista
        } else {
            console.error('Errore nel recupero dati:', response.status);
        }
    } catch (error) {
        console.error('Errore di connessione:', error);
    }
}

/* ---- CALCOLO STATO SCADENZA (Parte 3: Date) ---- */
function getExpiryStatus(expiryDateStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDateStr);
    expiry.setHours(0, 0, 0, 0);
    const diffMs = expiry - today;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0)   return 'expired';
    if (diffDays <= 7)  return 'red';
    if (diffDays <= 14) return 'orange';
    if (diffDays <= 21) return 'yellow';
    return 'green';
}

function getStatusLabel(status) {
    switch (status) {
        case 'expired': return 'Expired';
        case 'red':    return '< 1 week';
        case 'orange': return '< 2 weeks';
        case 'yellow': return '< 3 weeks';
        case 'green':  return '> 3 weeks';
    }
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

/* ---- RENDER (Parte 4: DOM Manipulation) ---- */
function renderFridge() {
    const list = document.getElementById('fridgeList');
    const emptyState = document.getElementById('emptyState');
    const searchInput = document.getElementById('searchInput');
    const searchVal = searchInput ? searchInput.value.toLowerCase().trim() : "";

    let items = [...fridgeItems];

    // Filtro per colore/stato
    if (activeFilter !== 'all') {
        items = items.filter(i => getExpiryStatus(i.expiry) === activeFilter);
    }

    // Filtro ricerca testuale
    if (searchVal) {
        items = items.filter(i =>
            i.name.toLowerCase().includes(searchVal) ||
            i.category.toLowerCase().includes(searchVal)
        );
    }

    // Ordinamento per data 
    items.sort((a, b) => new Date(a.expiry) - new Date(b.expiry));

    list.innerHTML = ''; // Svuota la lista

    // feedback differenziato
    if (items.length === 0) {
        emptyState.classList.remove('hidden');
        
        // se il frigo è proprio vuoto
        if (fridgeItems.length === 0) {
            emptyState.innerHTML = `
                <div class="empty-icon">🥗</div>
                <p>Your fridge is empty!</p>
                <span>Add your first item to get started.</span>
            `;
        } else { // se il frigo non è vuoto ma la ricerca non produce risultati
            emptyState.innerHTML = `
                <div class="empty-icon">🔍</div>
                <p>No matches found</p>
                <span>We couldn't find "${escapeHtml(searchVal)}" in your fridge.</span>
            `;
        }

    } else {
        emptyState.classList.add('hidden');
        items.forEach(item => {
            list.appendChild(createItemRow(item));
        });
    }

    updateBulkBar();
}

function createItemRow(item) {
    const status = getExpiryStatus(item.expiry);
    const cat = CATEGORIES.find(c => c.id === item.category) || CATEGORIES[11];
    const li = document.createElement('li');
    li.className = 'fridge-item';
    
    const itemId = item._id || item.id;
    li.dataset.id = itemId;

    li.innerHTML = `
        <input type="checkbox" onchange="toggleSelect('${itemId}', this)">
        <span class="item-name">${escapeHtml(item.name)}</span>
        <span class="item-category">
            <span class="cat-icon">${cat.emoji}</span>
            <span>${cat.label}</span>
        </span>
        <span class="item-qty">${item.qty} ${item.unit}</span>
        <span class="item-expiry">${formatDate(item.expiry)}</span>
        <span class="status-badge ${status}">
            <span class="status-dot-circle"></span>
            ${getStatusLabel(status)}
        </span>
        <button class="edit-row-btn" onclick="openEditModal('${itemId}')" title="Edit">✎</button>
        <button class="delete-row-btn" onclick="requestDelete(['${itemId}'])" title="Delete">🗑</button>
    `;

    return li;
}

function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

/* ---- AGGIUNTA E MODIFICA (Parte 1: POST/PUT) ---- */

// Apre il modal per aggiungere (resetta i campi)
function openAddModal() {
    selectedCategory = '';
    document.getElementById('editItemId').value = ''; // Svuota l'ID per indicare "nuovo inserimento"
    document.getElementById('modalTitle').textContent = "Add item to fridge";
    document.getElementById('submitBtnModal').textContent = "Add to fridge";
    document.getElementById('addItemForm').reset();
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('selected'));
    document.getElementById('addModalBackdrop').classList.add('open');
}

// Apre il modal per modificare (pre-compila i campi)
function openEditModal(id) {
    const item = fridgeItems.find(i => (i._id || i.id) === id);
    if (!item) return;

    document.getElementById('modalTitle').textContent = "Edit Item";
    document.getElementById('submitBtnModal').textContent = "Save Changes";
    document.getElementById('editItemId').value = id;
    document.getElementById('itemName').value = item.name;
    document.getElementById('itemQty').value = item.qty;
    document.getElementById('itemUnit').value = item.unit;
    // Formattazione data per input type="date"
    document.getElementById('itemExpiry').value = new Date(item.expiry).toISOString().split('T')[0];
    
    selectCategory(item.category);
    document.getElementById('addModalBackdrop').classList.add('open');
}

// Funzione principale che smista tra Add e Update
async function handleFormSubmit(event) {
    event.preventDefault();
    const id = document.getElementById('editItemId').value;
    
    if (id) {
        await updateItem(id);
    } else {
        await addItem(); 
    }
}

async function addItem() {
    const name = document.getElementById('itemName').value.trim();
    const qty = document.getElementById('itemQty').value;
    const unit = document.getElementById('itemUnit').value;
    const expiry = document.getElementById('itemExpiry').value;

    if (!selectedCategory) {
        alert("Please select a category");
        return;
    }

    const newItem = { name, category: selectedCategory, qty: parseFloat(qty), unit, expiry };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(newItem)
        });

        if (response.ok) {
            await loadItems();
            closeAddModal();
        }
    } catch (error) {
        console.error("Errore aggiunta:", error);
    }
}

async function updateItem(id) {
    const updatedData = {
        name: document.getElementById('itemName').value.trim(),
        category: selectedCategory,
        qty: parseFloat(document.getElementById('itemQty').value),
        unit: document.getElementById('itemUnit').value,
        expiry: document.getElementById('itemExpiry').value
    };

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT', // Parte 1 slide 8
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(updatedData)
        });

        if (response.ok) {
            await loadItems();
            closeAddModal();
        }
    } catch (error) {
        console.error("Errore aggiornamento:", error);
    }
}

/* ---- ALTRE FUNZIONI (Eliminazione, Sidebar, Filtri) ---- */

function setFilter(filter, btn) {
    activeFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderFridge();
}

function toggleSelect(id, checkbox) {
    const row = document.querySelector(`.fridge-item[data-id="${id}"]`);
    if (checkbox.checked) row.classList.add('selected');
    else row.classList.remove('selected');
    updateBulkBar();
}

function getSelectedIds() {
    return [...document.querySelectorAll('.fridge-item.selected')].map(el => el.dataset.id);
}

function updateBulkBar() {
    const selected = getSelectedIds();
    const bar = document.getElementById('bulkBar');
    const count = document.getElementById('bulkCount');
    if (bar && count) {
        bar.classList.toggle('visible', selected.length > 0);
        count.textContent = `${selected.length} item${selected.length > 1 ? 's' : ''} selected`;
    }
}

function closeAddModal(event) {
    if (event && event.target !== document.getElementById('addModalBackdrop')) return;
    document.getElementById('addModalBackdrop').classList.remove('open');
}

function buildCategoryGrid() {
    const grid = document.getElementById('categoryGrid');
    if (!grid) return;
    grid.innerHTML = '';
    CATEGORIES.forEach(cat => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'cat-btn';
        btn.dataset.id = cat.id;
        btn.innerHTML = `<span class="cat-emoji">${cat.emoji}</span><span class="cat-label">${cat.label}</span>`;
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

function requestDelete(ids) {
    pendingDeleteIds = ids;
    const text = ids.length === 1
        ? `Are you sure you want to delete <strong>${escapeHtml(getItemName(ids[0]))}</strong>?`
        : `Are you sure you want to delete <strong>${ids.length} items</strong>?`;
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
            await loadItems();
            closeDeleteModal();
        }
    } catch (error) {
        console.error("Errore eliminazione:", error);
    }
}

function closeDeleteModal() {
    document.getElementById('deleteModalBackdrop').classList.remove('open');
    pendingDeleteIds = [];
}

function getItemName(id) {
    return (fridgeItems.find(i => (i._id || i.id) === id) || {}).name || '';
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    if (sidebar) sidebar.classList.toggle('active');
    if (overlay) overlay.classList.toggle('active');
}

document.addEventListener('DOMContentLoaded', () => {
    buildCategoryGrid();
    loadItems();
    const today = new Date().toISOString().split('T')[0];
    const expiryInput = document.getElementById('itemExpiry');
    if (expiryInput) expiryInput.min = today;

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            closeAddModal();
            closeDeleteModal();
        }
    });
});