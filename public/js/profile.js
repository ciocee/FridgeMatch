window.API_BASE_URL = `http://${window.location.hostname}:3000`;
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

// caricamento profilo
async function loadProfile(url, isMine) {
    try {
        const res = await fetch(url, { credentials: 'include' });
        if (res.status === 401) { window.location.href = '../login/index.html'; return; }
        if (!res.ok) { showToast('Error loading profile', 'error'); return; }

        profileData = await res.json();
        renderProfile(profileData, isMine);
    } catch (e) {
        console.error('loadProfile:', e);
        showToast('Connection error', 'error');
    }
}

/* INIT */
document.addEventListener('DOMContentLoaded', () => {
    buildEmojiGrid();

    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id');

    if (userId) {
        loadProfile(`${PROFILE_URL}/${userId}`, false); // false: profilo non mio
    } else {
        loadProfile(`${PROFILE_URL}/me`, true);
    }

    const bioInput = document.getElementById('bioInput');
    if (bioInput) {
        bioInput.addEventListener('input', () => {
            document.getElementById('bioCharCount').textContent = `${bioInput.value.length} / 300`;
        });
    }    
    
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            closeEmojiPicker();
            closeUnstarModal();
        }
    });
});

// render profilo
function renderProfile({ user, recipes }, isMine) {
    document.getElementById('profileUsername').textContent = `@${user.username}`;
    // Mostra/nascondi edit username solo se è il mio profilo
    const editUsernameBtn = document.getElementById('editUsernameBtn');
    if (editUsernameBtn) {
        editUsernameBtn.style.display = isMine ? 'inline-flex' : 'none';
    }
    document.title = `FridgeMatch: @${user.username}`;

    // emoji avatar
    document.getElementById('avatarEmoji').textContent = user.avatarEmoji || '🍳';

    // bio
    document.getElementById('bioText').textContent = user.bio || '';
    document.getElementById('bioInput').value = user.bio || '';
    document.getElementById('bioCharCount').textContent = `${(user.bio || '').length} / 300`;

    // visibilità tasti: nascosti se il profilo non è il proprio non appaiono (btn visibili altrimenti)
    const editBioBtn = document.querySelector('.edit-bio-btn');
    const addRecipeBtns = document.querySelectorAll('.add-item-btn');
    const avatarRing = document.getElementById('avatarDisplay');
    const recipesTabBtn = document.querySelector('.tab-btn'); 
    const headerAddBtn = document.querySelector('.tab-header .add-item-btn');

    if (!isMine) {
        if (editBioBtn) editBioBtn.classList.add('hidden');
        addRecipeBtns.forEach(btn => btn.classList.add('hidden'));
        if (avatarRing) avatarRing.style.pointerEvents = 'none';
        document.querySelector('.avatar-hint').style.display = 'none';
        if (recipesTabBtn) recipesTabBtn.textContent = `🍽️ ${user.username}'s Recipes`;
    } else {
        if (editBioBtn) editBioBtn.classList.remove('hidden');
        addRecipeBtns.forEach(btn => btn.classList.remove('hidden'));
        if (avatarRing) avatarRing.style.pointerEvents = 'all';
        document.querySelector('.avatar-hint').style.display = 'block';
        if (recipesTabBtn) recipesTabBtn.textContent = "🍽️ My Recipes";

        if (recipes.length === 0) {
            if (headerAddBtn) headerAddBtn.classList.add('hidden');
        } else {
            if (headerAddBtn) headerAddBtn.classList.remove('hidden');
        }
    }    

    // stats
    document.getElementById('statRecipes').textContent = recipes.length;
    document.getElementById('statStarred').textContent = (user.starredCreators || []).length;

    renderRecipes(recipes, isMine);
    renderStarredCreators(user.starredCreators || [], isMine);
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
function renderRecipes(recipes, isMine) { 
    const grid = document.getElementById('recipesGrid');

    if (recipes.length === 0) {
        // se il profilo è mio e vuoto, mostro solo un pulsante al centro
        grid.innerHTML = `
            <div class="empty-tab" style="grid-column:1/-1; text-align:center;">
                <div class="empty-icon">🍽️</div>
                <p>No recipes yet</p>
                ${isMine ? `
                    <span>Share your first recipe with the community!</span><br><br>
                    <button class="add-item-btn" onclick="location.href='./add-recipe.html'">+ Share your recipe</button>
                ` : '<span>This user has not shared any recipes yet.</span>'}
            </div>`;
        return;
    }

    grid.innerHTML = '';
    recipes.forEach(recipe => {
        const card = document.createElement('div');
        card.className = 'profile-recipe-card';
        card.style.cursor = 'pointer';
        card.onclick = () => location.href = `./detail.html?id=${recipe._id}`;
        const imgSrc = recipe.image ? `http://127.0.0.1:3000${recipe.image}` : '';
        const date   = new Date(recipe.createdAt).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });

        card.innerHTML = `
            ${imgSrc
                ? `<img class="recipe-image" src="${imgSrc}" alt="${escapeHtml(recipe.title)}">`
                : `<div class="recipe-image" style="display:flex;align-items:center;justify-content:center;font-size:3rem;background:var(--gray-light)">🍳</div>`
            }
            <div class="recipe-content">
                <h3>${escapeHtml(recipe.title)}</h3>
                <p class="recipe-meta">📅 ${date} · ❤️ ${(recipe.likes || []).length} likes</p>
            </div>`;
        grid.appendChild(card);
    });
}

/* TAB CREATOR STELLATI */
function renderStarredCreators(creators, isMine) {
    const grid = document.getElementById('starredGrid');
    if (!grid) return;

    if (creators.length === 0) {
        grid.innerHTML = `
            <div class="empty-tab" style="grid-column:1/-1">
                <div class="empty-icon">⭐</div>
                <p>No starred creators yet</p>
                ${isMine ? `
                    <span>Visit the community and star your favourite chefs!</span><br><br>
                    <a href="./index.html" class="add-item-btn" style="display:inline-block;text-decoration:none">Browse community</a>
                ` : ''} 
            </div>`;
        return;
    }
    grid.innerHTML = '';
    creators.forEach(creator => {
        const card = document.createElement('div');
        card.className = 'creator-card';
        card.dataset.id = creator._id;
        card.style.cursor = 'pointer';
        card.addEventListener('click', (e) => {
            if (e.target.closest('.unstar-btn')) return;
            window.location.href = `profile.html?id=${creator._id}`;
        });
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

/* CAMBIO USERNAME */
function openUsernameEdit() {
    const current = document.getElementById('profileUsername').textContent.replace('@', '');
    document.getElementById('usernameInput').value = current;
    document.getElementById('usernameCharCount').textContent = `${current.length} / 30`;
    document.getElementById('usernameError').textContent = '';
    document.getElementById('usernameForm').classList.remove('hidden');
    document.getElementById('usernameInput').focus();
}

function closeUsernameEdit() {
    document.getElementById('usernameForm').classList.add('hidden');
    document.getElementById('usernameError').textContent = '';
}

async function saveUsername() {
    const input = document.getElementById('usernameInput');
    const errorEl = document.getElementById('usernameError');
    const username = input.value.trim();

    errorEl.textContent = '';

    if (username.length < 3) {
        errorEl.textContent = 'At least 3 characters required.';
        return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        errorEl.textContent = 'Only letters, numbers, _ and - allowed.';
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/auth/username`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ username })
        });

        if (res.status === 409) { errorEl.textContent = 'Username already taken.'; return; }
        if (!res.ok) { errorEl.textContent = await res.text(); return; }

        // Aggiorna UI
        document.getElementById('profileUsername').textContent = `@${username}`;
        document.title = `FridgeMatch: @${username}`;
        if (profileData) profileData.user.username = username;

        document.getElementById('usernameForm').classList.add('hidden');
        showToast('Username updated!', 'success');
    } catch (e) {
        errorEl.textContent = 'Connection error.';
    }
}

// forza il ricaricamento dei dati quando si torna indietro col tasto Back (Parte 4 slide 53)
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        window.location.reload(); 
    }
});
