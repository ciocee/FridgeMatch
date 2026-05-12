const API_BASE_URL = `http://${window.location.hostname}:3000`;
const PROFILE_URL = `${API_BASE_URL}/api/profile`;

const FOOD_EMOJIS = [
    '🍕','🍔','🌮','🌯','🥗','🍣','🍜','🍝','🍛','🥘',
    '🍲','🥙','🧆','🥚','🍳','🥞','🧇','🥓','🍗','🥩',
    '🍖','🌽','🥕','🥦','🧄','🧅','🥔','🍠','🥑','🫛',
    '🍅','🍆','🥒','🫑','🥬','🥝','🍓','🫐','🍇','🍒',
    '🍑','🥭','🍍','🥥','🍌','🍋','🍊','🍎','🍏','🫙',
    '🧁','🍰','🎂','🍮','🍭','🍫','🍩','🍪','🥐','🥖'
];

let profileData     = null;
let pendingUnstarId = '';

/* INIT */
document.addEventListener('DOMContentLoaded', () => {
    buildEmojiGrid();
    loadProfile();

    const bioInput = document.getElementById('bioInput');
    bioInput.addEventListener('input', () => {
        document.getElementById('bioCharCount').textContent = `${bioInput.value.length} / 300`;
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            closeEmojiPicker();
            closeUnstarModal();
        }
    });
});

/* CARICAMENTO PROFILO */
async function loadProfile() {
    try {
        const res = await fetch(`${PROFILE_URL}/me`, { credentials: 'include' });
        if (res.status === 401) { window.location.href = '../login/index.html'; return; }
        if (!res.ok) { showToast('Error loading profile', 'error'); return; }

        profileData = await res.json();
        renderProfile(profileData);
    } catch (e) {
        console.error('loadProfile:', e);
        showToast('Connection error', 'error');
    }
}

function renderProfile({ user, recipes }) {
    document.getElementById('profileUsername').textContent = `@${user.username}`;
    document.title = `FridgeMatch: @${user.username}`;

    // emoji avatar
    document.getElementById('avatarEmoji').textContent = user.avatarEmoji || '🍳';

    // bio
    document.getElementById('bioText').textContent = user.bio || '';
    document.getElementById('bioInput').value = user.bio || '';
    document.getElementById('bioCharCount').textContent = `${(user.bio || '').length} / 300`;

    // stats
    document.getElementById('statRecipes').textContent = recipes.length;
    document.getElementById('statStarred').textContent = (user.starredCreators || []).length;

    renderRecipes(recipes);
    renderStarredCreators(user.starredCreators || []);
}

/* EMOJI PICKER */
function buildEmojiGrid() {
    const grid = document.getElementById('emojiGrid');
    grid.innerHTML = '';
    FOOD_EMOJIS.forEach(emoji => {
        const btn = document.createElement('button');
        btn.className = 'emoji-option';
        btn.textContent = emoji;
        btn.title = emoji;
        btn.addEventListener('click', () => selectEmoji(emoji));
        grid.appendChild(btn);
    });
}

function openEmojiPicker() {
    // evidenzia l'emoji corrente
    const current = document.getElementById('avatarEmoji').textContent;
    document.querySelectorAll('.emoji-option').forEach(btn => {
        btn.classList.toggle('selected', btn.textContent === current);
    });
    document.getElementById('emojiPickerBackdrop').classList.add('open');
}

function closeEmojiPicker(event) {
    if (event && event.target !== document.getElementById('emojiPickerBackdrop')) return;
    document.getElementById('emojiPickerBackdrop').classList.remove('open');
}

async function selectEmoji(emoji) {
    try {
        const res = await fetch(`${PROFILE_URL}/me`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ avatarEmoji: emoji })
        });

        if (!res.ok) { showToast('Error saving emoji', 'error'); return; }

        // aggiorna UI immediatamente
        document.getElementById('avatarEmoji').textContent = emoji;
        if (profileData) profileData.user.avatarEmoji = emoji;

        document.getElementById('emojiPickerBackdrop').classList.remove('open');
        showToast('Avatar updated!', 'success');
    } catch (e) {
        showToast('Connection error', 'error');
    }
}

/* TAB RICETTE */
function renderRecipes(recipes) {
    const grid = document.getElementById('recipesGrid');

    if (recipes.length === 0) {
        grid.innerHTML = `
            <div class="empty-tab" style="grid-column:1/-1">
                <div class="empty-icon">🍽️</div>
                <p>No recipes yet</p>
                <span>Share your first recipe with the community!</span><br><br>
                <a href="./add-recipe.html" class="add-item-btn" style="display:inline-block;text-decoration:none">+ Add recipe</a>
            </div>`;
        return;
    }

    grid.innerHTML = '';
    recipes.forEach(recipe => {
        const card = document.createElement('div');
        card.className = 'profile-recipe-card';
        const imgSrc = recipe.image ? `${API_BASE}${recipe.image}` : '';
        const date   = new Date(recipe.createdAt).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
        const ings   = (recipe.ingredients || []).slice(0, 4);

        card.innerHTML = `
            ${imgSrc
                ? `<img class="recipe-image" src="${imgSrc}" alt="${escapeHtml(recipe.title)}">`
                : `<div class="recipe-image" style="display:flex;align-items:center;justify-content:center;font-size:3rem;background:var(--gray-light)">🍳</div>`
            }
            <div class="recipe-content">
                <h3>${escapeHtml(recipe.title)}</h3>
                <p class="recipe-meta">📅 ${date} · ❤️ ${(recipe.likes || []).length} likes</p>
                <div class="recipe-ingredients-preview">
                    ${ings.map(i => `<span class="ing-tag">${escapeHtml(i)}</span>`).join('')}
                    ${recipe.ingredients.length > 4 ? `<span class="ing-tag">+${recipe.ingredients.length - 4}</span>` : ''}
                </div>
            </div>`;
        grid.appendChild(card);
    });
}

/* TAB CREATOR STELLATI */
function renderStarredCreators(creators) {
    const grid = document.getElementById('starredGrid');

    if (creators.length === 0) {
        grid.innerHTML = `
            <div class="empty-tab" style="grid-column:1/-1">
                <div class="empty-icon">⭐</div>
                <p>No starred creators yet</p>
                <span>Visit the community and star your favourite chefs!</span><br><br>
                <a href="./community.html" class="add-item-btn" style="display:inline-block;text-decoration:none">Browse community</a>
            </div>`;
        return;
    }

    grid.innerHTML = '';
    creators.forEach(creator => {
        const card = document.createElement('div');
        card.className = 'creator-card';
        card.dataset.id = creator._id;

        card.innerHTML = `
            <button class="unstar-btn" title="Remove star"
                    onclick="requestUnstar('${creator._id}', '${escapeHtml(creator.username)}')">⭐</button>
            <div class="creator-avatar-emoji">${creator.avatarEmoji || '👤'}</div>
            <span class="creator-name">@${escapeHtml(creator.username)}</span>
            ${creator.bio ? `<p class="creator-bio">${escapeHtml(creator.bio)}</p>` : ''}
        `;
        grid.appendChild(card);
    });
}

/* SWITCH TAB */
function switchTab(tab, btn) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(s => s.classList.add('hidden'));
    btn.classList.add('active');
    document.getElementById(`tab-${tab}`).classList.remove('hidden');
}

/* BIO */
function openBioEdit() {
    document.getElementById('bioForm').classList.remove('hidden');
    document.getElementById('bioInput').focus();
}

function closeBioEdit() {
    document.getElementById('bioForm').classList.add('hidden');
    if (profileData) {
        document.getElementById('bioInput').value = profileData.user.bio || '';
        document.getElementById('bioCharCount').textContent = `${(profileData.user.bio || '').length} / 300`;
    }
}

async function saveBio() {
    const bio = document.getElementById('bioInput').value.trim();
    try {
        const res = await fetch(`${PROFILE_URL}/me`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ bio })
        });

        if (!res.ok) { showToast('Error saving bio', 'error'); return; }

        profileData.user.bio = bio;
        document.getElementById('bioText').textContent = bio;
        document.getElementById('bioForm').classList.add('hidden');
        showToast('Bio updated!', 'success');
    } catch (e) {
        showToast('Connection error', 'error');
    }
}

/* RIMOZIONE STELLA */
function requestUnstar(id, username) {
    pendingUnstarId = id;
    document.getElementById('unstarModalText').innerHTML =
        `Remove <strong>@${escapeHtml(username)}</strong> from your starred creators?`;
    document.getElementById('unstarModalBackdrop').classList.add('open');
}

function closeUnstarModal() {
    document.getElementById('unstarModalBackdrop').classList.remove('open');
    pendingUnstarId = '';
}

async function confirmUnstar() {
    try {
        const res = await fetch(`${PROFILE_URL}/star/${pendingUnstarId}`, {
            method: 'POST',
            credentials: 'include'
        });

        if (!res.ok) { showToast('Error removing star', 'error'); return; }

        document.querySelector(`.creator-card[data-id="${pendingUnstarId}"]`)?.remove();

        const current = parseInt(document.getElementById('statStarred').textContent);
        document.getElementById('statStarred').textContent = Math.max(0, current - 1);

        if (profileData) {
            profileData.user.starredCreators = (profileData.user.starredCreators || [])
                .filter(c => c._id !== pendingUnstarId);
            if (profileData.user.starredCreators.length === 0) renderStarredCreators([]);
        }

        closeUnstarModal();
        showToast('Creator removed from starred', '');
    } catch (e) {
        showToast('Connection error', 'error');
    }
}

/* UTILITIES */
function escapeHtml(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

function showToast(message, type) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
    document.getElementById('overlay').classList.toggle('active');
}
