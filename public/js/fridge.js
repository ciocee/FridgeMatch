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

const API_URL = 'http://127.0.0.1:3000/api/fridge';

/* ---- CARICAMENTO DAL SERVER ---- */
async function loadItems() {
    try {
        const response = await fetch(API_URL, {
            method: 'GET',
            credentials: 'include'
        });

        if (response.status === 401) {
            window.location.href = '../login/index.html';
            return;
        }

        if (response.ok) {
            fridgeItems = await response.json();
            renderFridge();
        } else {
            console.error('Errore nel recupero dati:', response.status);
        }
    } catch (error) {
        console.error('Errore di connessione:', error);
    }
}

/* ---- CALCOLO STATO SCADENZA ---- */
function getExpiryStatus(expiryDateStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDateStr);
    expiry.setHours(0, 0, 0, 0);
    const diffMs = expiry - today;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 7)  return 'red';
    if (diffDays <= 14) return 'orange';
    if (diffDays <= 21) return 'yellow';
    return 'green';
}

function getStatusLabel(status) {
    switch (status) {
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

/* ---- RENDER ---- */
function renderFridge() {
    const list = document.getElementById('fridgeList');
    const emptyState = document.getElementById('emptyState');
    const searchVal = document.getElementById('searchInput').value.toLowerCase().trim();

    // FIX: era [...FridgeItem] con F maiuscola
    let items = [...fridgeItems];

    if (activeFilter !== 'all') {
        items = items.filter(i => getExpiryStatus(i.expiry) === activeFilter);
    }

    if (searchVal) {
        items = items.filter(i =>
            i.name.toLowerCase().includes(searchVal) ||
            i.category.toLowerCase().includes(searchVal)
        );
    }

    items.sort((a, b) => new Date(a.expiry) - new Date(b.expiry));

    list.innerHTML = '';

    if (items.length === 0) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
        items.forEach(item => list.appendChild(createItemRow(item)));
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
        <button class="delete-row-btn" onclick="requestDelete(['${itemId}'])" title="Delete">🗑</button>
    `;

    return li;
}

function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

/* ---- FILTRI ---- */
function setFilter(filter, btn) {
    activeFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderFridge();
}

/* ---- SELEZIONE MULTIPLA ---- */
function toggleSelect(id, checkbox) {
    const row = document.querySelector(`.fridge-item[data-id="${id}"]`);
    if (checkbox.checked) {
        row.classList.add('selected');
    } else {
        row.classList.remove('selected');
    }
    updateBulkBar();
}

function getSelectedIds() {
    return [...document.querySelectorAll('.fridge-item.selected')].map(el => el.dataset.id);
}

function updateBulkBar() {
    const selected = getSelectedIds();
    const bar = document.getElementById('bulkBar');
    const count = document.getElementById('bulkCount');
    if (selected.length > 0) {
        bar.classList.add('visible');
        count.textContent = `${selected.length} item${selected.length > 1 ? 's' : ''} selected`;
    } else {
        bar.classList.remove('visible');
    }
}

/* ---- AGGIUNTA ---- */
function openAddModal() {
    selectedCategory = '';
    document.getElementById('addItemForm').reset();
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('selected'));
    document.getElementById('addModalBackdrop').classList.add('open');
    document.getElementById('itemName').focus();
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

async function addItem(event) {
    event.preventDefault();

    const name = document.getElementById('itemName').value.trim();
    const qty = document.getElementById('itemQty').value;
    const unit = document.getElementById('itemUnit').value;
    const expiry = document.getElementById('itemExpiry').value;

    if (!name || !qty || !expiry) return;

    if (!selectedCategory) {
        const grid = document.getElementById('categoryGrid');
        grid.style.outline = '2px solid var(--accent-orange)';
        grid.style.borderRadius = '10px';
        setTimeout(() => { grid.style.outline = 'none'; }, 1500);
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

        if (response.status === 401) {
            window.location.href = '../login/index.html';
            return;
        }

        if (response.ok) {
            await loadItems();
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
        console.error("Errore durante l'eliminazione:", error);
    }
}

function closeDeleteModal() {
    document.getElementById('deleteModalBackdrop').classList.remove('open');
    pendingDeleteIds = [];
}

function getItemName(id) {
    // FIX: era fridgeitem.find(...) che usava il require eliminato
    return (fridgeItems.find(i => (i._id || i.id) === id) || {}).name || '';
}

/* ---- SIDEBAR ---- */
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    if (sidebar) sidebar.classList.toggle('active');
    if (overlay) overlay.classList.toggle('active');
}

function handleLogout() {
    fetch('http://127.0.0.1:3000/auth/logout', {
        method: 'POST',
        credentials: 'include'
    }).finally(() => {
        window.location.href = '../login/index.html';
    });
}

/* ---- INIT ---- */
document.addEventListener('DOMContentLoaded', () => {
    buildCategoryGrid();
    loadItems();

    const today = new Date().toISOString().split('T')[0];
    document.getElementById('itemExpiry').min = today;

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            closeAddModal();
            closeDeleteModal();
        }
    });
});