window.API_BASE_URL = `http://${window.location.hostname}:3000`;

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

const API_URL = `${API_BASE_URL}/api/grocery`;

let groceryItems     = [];
let activeFilter     = 'all';
let selectedCategory = '';
let pendingDeleteIds = [];
let pendingBoughtId  = '';

/* CARICAMENTO*/
async function loadItems() {
    try {
        const res = await fetch(API_URL, { credentials: 'include' });
        if (res.status === 401) { window.location.href = '../login'; return; }
        if (!res.ok) { console.error('Errore caricamento lista:', res.status); return; }
        groceryItems = await res.json();
        renderList();
    } catch (e) {
        console.error('Connessione fallita:', e);
    }
}

/*RENDER*/

function renderList() {
    const list      = document.getElementById('groceryList');
    const empty     = document.getElementById('emptyState');
    const countEl   = document.getElementById('itemCount');
    const searchVal = document.getElementById('searchInput').value.toLowerCase().trim();

    let items = [...groceryItems];

    if (activeFilter === 'pending') {
        items = items.filter(i => !i.bought);
    } else if (activeFilter === 'fridge') {
        items = items.filter(i => i.fromFridge);
    }

    if (searchVal) {
        items = items.filter(i =>
            i.name.toLowerCase().includes(searchVal) ||
            i.category.toLowerCase().includes(searchVal)
        );
    }

    countEl.textContent = `${groceryItems.length} item${groceryItems.length !== 1 ? 's' : ''}`;
    list.innerHTML = '';

    if (items.length === 0) {
        empty.classList.remove('hidden');
    } else {
        empty.classList.add('hidden');
        items.forEach(item => list.appendChild(createRow(item)));
    }

    updateBulkBar();
}

function createRow(item) {
    const cat = CATEGORIES.find(c => c.id === item.category) || CATEGORIES[11];
    const id  = item._id;
    const li  = document.createElement('li');
    li.className  = 'grocery-item';
    li.dataset.id = id;

    li.innerHTML = `
        <input type="checkbox" class="buy-checkbox" title="Mark as bought"
               onchange="onBuyCheck('${id}', '${escapeHtml(item.name)}', this)">
        <span class="item-name">${escapeHtml(item.name)}</span>
        <span class="item-category">
            <span class="cat-icon">${cat.emoji}</span>
            <span>${cat.label}</span>
        </span>
        <span class="item-qty">${item.qty} ${item.unit}</span>
        <span class="source-badge ${item.fromFridge ? 'fridge' : 'manual'}">
            ${item.fromFridge ? '❄️ Fridge' : '✏️ Manual'}
        </span>
        <button class="delete-row-btn" onclick="requestDelete(['${id}'])" title="Delete">🗑</button>
    `;

    return li;
}

function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

/*  FILTRI */
function setFilter(filter, btn) {
    activeFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderList();
}

/*BULK DELETE */
function getSelectedIds() {
    return [...document.querySelectorAll('.grocery-item.selected')].map(el => el.dataset.id);
}

function updateBulkBar() {
    const sel   = getSelectedIds();
    const bar   = document.getElementById('bulkBar');
    const count = document.getElementById('bulkCount');
    bar.classList.toggle('visible', sel.length > 0);
    if (sel.length > 0) count.textContent = `${sel.length} item${sel.length > 1 ? 's' : ''} selected`;
}

/* AGGIUNTA MANUALE */
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
        btn.innerHTML = `<span class="cat-emoji">${cat.emoji}</span><span class="cat-label">${cat.label}</span>`;
        btn.addEventListener('click', () => selectCategory(cat.id));
        grid.appendChild(btn);
    });
}

function selectCategory(id) {
    selectedCategory = id;
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.toggle('selected', b.dataset.id === id));
}

async function addItem(event) {
    event.preventDefault();

    const name = document.getElementById('itemName').value.trim();
    const qty  = document.getElementById('itemQty').value;
    const unit = document.getElementById('itemUnit').value;

    if (!name || !qty) return;

    if (!selectedCategory) {
        const grid = document.getElementById('categoryGrid');
        grid.style.outline = '2px solid var(--accent-orange)';
        grid.style.borderRadius = '10px';
        setTimeout(() => { grid.style.outline = 'none'; }, 1500);
        return;
    }

    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ name, category: selectedCategory, qty: parseFloat(qty), unit })
        });

        if (res.status === 401) { window.location.href = '../login'; return; }

        if (res.ok) {
            await loadItems();
            document.getElementById('addModalBackdrop').classList.remove('open');
            showToast('Item added to list!', 'success');
        }
    } catch (e) {
        console.error('Errore aggiunta:', e);
    }
}

/* SUGGERISCI DAL FRIGO */
async function suggestFromFridge() {
    const btn = document.querySelector('.suggest-btn');
    btn.disabled = true;
    btn.textContent = '⏳ Loading...';

    try {
        const res = await fetch(`${API_URL}/suggest`, {
            method: 'GET', 
            credentials: 'include'
        });

        if (res.status === 401) { window.location.href = '../login'; return; }

        // Salviamo gli elementi nella nostra nuova variabile in memoria
        currentSuggestions = await res.json(); 

        if (!currentSuggestions || currentSuggestions.length === 0) {
            showToast('ℹ️ No expiring items to suggest!', '');
            return;
        }

        const container = document.getElementById('suggestionListContainer');
        container.innerHTML = '';

        // Usiamo l'indice (i) invece di infilare tutti i dati nell'HTML
        currentSuggestions.forEach((item, i) => {
            const div = document.createElement('div');
            div.style.display = 'flex';
            div.style.alignItems = 'center';
            div.style.gap = '10px';
            
            div.innerHTML = `
                <input type="checkbox" class="buy-checkbox" id="sug_${i}" value="${i}" checked>
                <label for="sug_${i}" style="cursor: pointer; font-weight: 600; color: var(--text-dark); display: flex; align-items: center; gap: 8px;">
                    ${escapeHtml(item.name)} 
                    <span style="color: var(--gray-medium); font-size: 0.85rem; font-weight: normal;">(${item.qty} ${item.unit})</span>
                </label>
            `;
            container.appendChild(div);
        });

        document.getElementById('suggestModalBackdrop').classList.add('open');

    } catch (e) {
        showToast('Connection error', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = '🔄 Suggest from fridge';
    }
}

function closeSuggestModal(event) {
    if (event && event.target !== document.getElementById('suggestModalBackdrop')) return;
    document.getElementById('suggestModalBackdrop').classList.remove('open');
}

async function confirmSuggestions() {
    const checkboxes = document.querySelectorAll('#suggestionListContainer input[type="checkbox"]:checked');
    
    // Recuperiamo gli items selezionati in base all'indice
    const selectedItems = Array.from(checkboxes).map(cb => currentSuggestions[cb.value]);

    if (selectedItems.length === 0) {
        closeSuggestModal();
        return;
    }

    try {
        // Chiamiamo la TUA nuova rotta backend che fa il salvataggio in blocco!
        const res = await fetch(`${API_URL}/suggest/confirm`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ selectedItems })
        });

        if (!res.ok) throw new Error("Failed to save items.");

        closeSuggestModal();
        await loadItems();
        showToast(`✅ ${selectedItems.length} item(s) added from fridge!`, 'success');

    } catch (e) {
        console.error('Errore durante l\'aggiunta dei suggerimenti:', e);
        showToast('Error saving selected items', 'error');
    }
}
/* SEGNA COME ACQUISTATO → AGGIUNGE AL FRIGO*/
function onBuyCheck(id, name, checkbox) {
    // deseleziona subito — sarà il modal a confermare
    checkbox.checked = false;

    pendingBoughtId = id;
    document.getElementById('boughtItemName').textContent = name;

    const today = new Date().toISOString().split('T')[0];
    const expiryInput = document.getElementById('boughtExpiry');
    expiryInput.min   = today;
    expiryInput.value = '';
    expiryInput.style.borderColor = '';

    document.getElementById('boughtModalBackdrop').classList.add('open');
    setTimeout(() => expiryInput.focus(), 300);
}

function closeBoughtModal(event) {
    if (event && event.target !== document.getElementById('boughtModalBackdrop')) return;
    document.getElementById('boughtModalBackdrop').classList.remove('open');
    pendingBoughtId = '';
}

async function confirmBought() {
    const expiryInput = document.getElementById('boughtExpiry');
    const expiry = expiryInput.value;

    if (!expiry) {
        expiryInput.style.borderColor = '#e53e3e';
        return;
    }

    try {
        const res = await fetch(`${API_URL}/${pendingBoughtId}/bought`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ expiry })
        });

        if (res.status === 401) { window.location.href = '../login'; return; }

        if (res.ok) {
            document.getElementById('boughtModalBackdrop').classList.remove('open');
            pendingBoughtId = '';
            await loadItems();
            showToast('✅ Added to fridge!', 'success');
        } else {
            showToast('Error saving to fridge', 'error');
        }
    } catch (e) {
        showToast('Connection error', 'error');
    }
}

/* ELIMINAZIONE */
function requestDelete(ids) {
    pendingDeleteIds = ids;
    const item = groceryItems.find(i => i._id === ids[0]);
    const name = ids.length === 1 && item
        ? `<strong>${escapeHtml(item.name)}</strong>`
        : `<strong>${ids.length} items</strong>`;
    document.getElementById('deleteModalText').innerHTML = `Are you sure you want to delete ${name}?`;
    document.getElementById('deleteModalBackdrop').classList.add('open');
}

function confirmBulkDelete() {
    requestDelete(getSelectedIds());
}

async function confirmDelete() {
    try {
        const res = await fetch(API_URL, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ ids: pendingDeleteIds })
        });

        if (res.ok) {
            await loadItems();
            closeDeleteModal();
            showToast('Item deleted', '');
        }
    } catch (e) {
        console.error('Errore delete:', e);
    }
}

function closeDeleteModal() {
    document.getElementById('deleteModalBackdrop').classList.remove('open');
    pendingDeleteIds = [];
}

/* TOAST */
function showToast(message, type) {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = `toast ${type}`;
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => toast.classList.remove('show'), 3000);
}

/*SIDEBAR / LOGOUT */
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
    document.getElementById('overlay').classList.toggle('active');
}

/*init*/
document.addEventListener('DOMContentLoaded', () => {
    buildCategoryGrid();
    loadItems();

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            closeAddModal();
            closeBoughtModal();
            closeDeleteModal();
            closeSuggestModal();
        }
    });
});