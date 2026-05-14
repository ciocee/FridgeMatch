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


// caricamento profilo
async function loadProfile(url, isMine) {
    try {
        const res = await fetch(url, { credentials: 'include' });
        if (res.status === 401) { window.location.href = '../login/index.html'; return; }
        if (!res.ok) { showToast('Error loading profile', 'error'); return; }

        profileData = await res.json();
        renderProfile(profileData, isMine, profileData.isStarred);
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
            closeDeleteAccountModal();
        }
    });
});

// render profilo
function renderProfile({ user, recipes }, isMine, isStarred = false) {    
    document.getElementById('profileUsername').textContent = `@${user.username}`;
    
    // mostra edit username solo se è il mio profilo
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
    const deleteAccountBtn = document.querySelector(".btn-delete-account");

    if (!isMine) {
        if (!document.getElementById('profileStarBtn')) {
            const starBtn = document.createElement('button');
            starBtn.id = 'profileStarBtn';
            starBtn.className = `star-btn ${isStarred ? 'active' : ''}`;
            starBtn.textContent = isStarred ? '⭐ Starred' : '⭐ Star';
            starBtn.onclick = () => toggleStar(user._id, starBtn);
            
            document.getElementById('profileUsername').insertAdjacentElement('afterend', starBtn);
        }
        
        if (editBioBtn) editBioBtn.classList.add('hidden');
        addRecipeBtns.forEach(btn => btn.classList.add('hidden'));
        if (avatarRing) avatarRing.style.pointerEvents = 'none';
        document.querySelector('.avatar-hint').style.display = 'none';
        if (recipesTabBtn) recipesTabBtn.textContent = `🍽️ ${user.username}'s Recipes`;
        if (!deleteAccountBtn) deleteAccountBtn.classList.add("hidden");

    } else {
        if (editBioBtn) editBioBtn.classList.remove('hidden');
        addRecipeBtns.forEach(btn => btn.classList.remove('hidden'));
        if (avatarRing) avatarRing.style.pointerEvents = 'all';
        document.querySelector('.avatar-hint').style.display = 'block';
        if (recipesTabBtn) recipesTabBtn.textContent = "🍽️ My Recipes";
        if (!deleteAccountBtn) deleteAccountBtn.classList.remove("hidden");

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
    if (!grid) return;

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
    const backdrop = document.getElementById('emojiPickerBackdrop');
    if (backdrop) backdrop.classList.remove('open');
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
    if (!grid) return;

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
    const content = document.getElementById(`tab-${tab}`);
    if (content) content.classList.remove('hidden');
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


/* UTILITIES */
function escapeHtml(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

function showToast(message, type) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast ${type}`;
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    if (sidebar) sidebar.classList.toggle('active');
    if (overlay) overlay.classList.toggle('active');
}

/* CAMBIO USERNAME */
function openUsernameEdit() {
    const usernameEl = document.getElementById('profileUsername');
    if (!usernameEl) return;
    const current = usernameEl.textContent.replace('@', '');
    document.getElementById('usernameInput').value = current;
    document.getElementById('usernameCharCount').textContent = `${current.length} / 30`;
    document.getElementById('usernameError').textContent = '';
    document.getElementById('usernameForm').classList.remove('hidden');
    document.getElementById('usernameInput').focus();
}

function closeUsernameEdit() {
    const form = document.getElementById('usernameForm');
    if (form) form.classList.add('hidden');
}

async function saveUsername() {
    const input = document.getElementById('usernameInput');
    const errorEl = document.getElementById('usernameError');
    const username = input.value.trim();

    if (errorEl) errorEl.textContent = '';

    if (username.length < 3) {
        if (errorEl) errorEl.textContent = 'At least 3 characters required.';
        return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        if (errorEl) errorEl.textContent = 'Only letters, numbers, _ and - allowed.';
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/auth/username`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ username })
        });

        if (res.status === 409) { if (errorEl) errorEl.textContent = 'Username already taken.'; return; }
        if (!res.ok) { if (errorEl) errorEl.textContent = await res.text(); return; }

        document.getElementById('profileUsername').textContent = `@${username}`;
        document.title = `FridgeMatch: @${username}`;
        if (profileData) profileData.user.username = username;

        document.getElementById('usernameForm').classList.add('hidden');
        showToast('Username updated!', 'success');
    } catch (e) {
        if (errorEl) errorEl.textContent = 'Connection error.';
    }
}

window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        window.location.reload(); 
    }
});

// gestione eliminazione account
function requestDeleteAccount() {
    document.getElementById('deleteAccountBackdrop').classList.add('open');
}

function closeDeleteAccountModal() {
    document.getElementById('deleteAccountBackdrop').classList.remove('open');
}

async function confirmDeleteAccount() {
    try {
        const res = await fetch(`${PROFILE_URL}/me`, {
            method: 'DELETE',
            credentials: 'include'
        });
        if (res.ok) {
            sessionStorage.clear();
            window.location.href = '../login/index.html';
        } else {
            showToast('Error deleting account', 'error');
        }
    } catch (e) {
        showToast('Connection error', 'error');
    }
}