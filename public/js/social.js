// gestione caricamento dinamico del feed e interazioni con i like
const API_URL = 'http://127.0.0.1:3000/api/social'; 

// caricamento feed
async function loadFeed() {
    const container = document.getElementById('recipe-feed');
    if (!container) return;

    try {
        const res = await fetch(`${API_URL}/feed`, {credentials: 'include'});
        const recipes = await res.json();
        container.innerHTML = "";

        recipes.forEach(recipe => {
            const article = document.createElement('article');
            article.className = 'recipe-card';
            article.innerHTML = `
                <img src="${recipe.image}" class="recipe-image">
                <div class="recipe-content">
                    <h3>${recipe.title}</h3>
                    <p>By @${recipe.author.username}</p>
                    <button class="like-btn" onclick="toggleLike('${recipe._id}', this)">
                        ❤️ <span>${recipe.likes.length}</span>
                    </button>
                </div>
            `;
            container.appendChild(article);            
        });
    } catch (err) {
        console.error("Feed error:", err);
    }
}

// funzione like
async function toggleLike(id, btn) {
    try {
        const res = await fetch(`${API_URL}/like/${id}`, {
            method: 'POST',
            credentials: 'include'
        });

        if (res.ok) {
            const data = await res.json();
            btn.querySelector('span').textContent = data.likesCount;
            btn.classList.toggle('active');
        }
    } catch (err) {
        console.error("Like error:", err);
    }
}

// funzione search
async function executeSocialSearch() {
    const queryInput = document.getElementById('social-search-input');
    const query = queryInput.value.trim();
    const resultsArea = document.getElementById('search-results-area');
    const mainFeed = document.getElementById('main-feed-section');

    if (query === "") { // torna al main feed
        if(resultsArea) resultsArea.classList.add('hidden');
        if(mainFeed) mainFeed.classList.remove('hidden');
        return;
    }

    try {
        const res = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}`, { credentials: 'include' });
        const results = await res.json();

        // visibilità sezioni
        if (mainFeed) mainFeed.classList.add('hidden');
        if (resultsArea) resultsArea.classList.remove('hidden');

        const usersGrid = document.getElementById('search-users-grid');
        const usersSection = document.getElementById('search-users-section');
        const recipesGrid = document.getElementById('search-recipes-grid');
        const recipesSection = document.getElementById('search-recipes-section');

        // creators
        if (usersGrid) {
            usersGrid.innerHTML = "";
            if (results.community.users && results.community.users.length > 0) {
                usersSection.classList.remove('hidden');
                results.community.users.forEach(user => {
                    const div = document.createElement('div');
                    div.className = 'creator-card';
                    div.innerHTML = `
                        <div class="creator-avatar" onclick="location.href='profile.html?id=${user._id}'">${user.avatarEmoji || '👤'}</div>
                        <strong onclick="location.href='profile.html?id=${user._id}'">@${user.username}</strong>
                        <button class="star-btn ${user.isStarred ? 'active' : ''}" 
                                onclick="toggleStar('${user._id}', this)">
                            ${user.isStarred ? '⭐ Starred' : '⭐ Star'}
                        </button>
                    `;
                    usersGrid.appendChild(div);
                });
            } else {
                usersSection.classList.add('hidden');
            }
        }

        // ricette
        if (recipesGrid) {
            recipesGrid.innerHTML = "";
            if (results.community.recipes && results.community.recipes.length > 0) {
                recipesSection.classList.remove('hidden'); // Corretto: mostra la sezione, non la grid
                results.community.recipes.forEach(recipe => {
                    const article = document.createElement('article');
                    article.className = 'recipe-card';
                    article.innerHTML = `
                        <img src="${recipe.image}" class="recipe-image" onclick="location.href='../replicable/index.html?id=${recipe._id}'">
                        <div class="recipe-content">
                        <h3>${recipe.title}</h3>
                        <p>By @${recipe.author ? recipe.author.username : 'Community'}</p>
                        </div>
                    `;
                    recipesGrid.appendChild(article);
                });
            } else {
                recipesSection.classList.add('hidden');
            }
        }
    } catch (err) {
        console.error("Search error:", err);
    }
}

// gestione stella: se un creator è starred, chiede conferma prima di toglierla. sennò la mette
let pendingUnstarId = '';
let pendingUnstarBtn = null;

async function toggleStar(userId, btn) {
    const isCurrentlyStarred = btn.classList.contains('active');

    if (isCurrentlyStarred) {
        const username = btn.closest('.creator-card')
            .querySelector('strong').textContent;
        pendingUnstarId = userId;
        pendingUnstarBtn = btn;
        document.getElementById('unstarModalText').innerHTML =
            `Remove <strong>${username}</strong> from your starred creators?`;
        document.getElementById('unstarModalBackdrop').classList.add('open');
        return; 
    }

    try {
        const res = await fetch(`http://127.0.0.1:3000/api/social/star/${userId}`, {
            method: 'POST',
            credentials: 'include'
        });
        if (res.ok) {
            const data = await res.json();
            btn.classList.toggle('active', data.isStarred);
            btn.textContent = data.isStarred ? '⭐ Starred' : '⭐ Star';
        }
    } catch (err) {
        console.error('Star error:', err);
    }
}

function closeUnstarModal(event) {
    if (event && event.target !== document.getElementById('unstarModalBackdrop')) return;
    document.getElementById('unstarModalBackdrop').classList.remove('open');
    pendingUnstarId = '';
    pendingUnstarBtn = null;
}

async function confirmUnstarSocial() {
    try {
        const res = await fetch(`http://127.0.0.1:3000/api/social/star/${pendingUnstarId}`, {
            method: 'POST',
            credentials: 'include'
        });
        if (res.ok) {
            pendingUnstarBtn.classList.remove('active');
            pendingUnstarBtn.textContent = '⭐ Star';
        }
    } catch (err) {
        console.error('Unstar error:', err);
    }
    document.getElementById('unstarModalBackdrop').classList.remove('open');
    pendingUnstarId = '';
    pendingUnstarBtn = null;
}

// apertura modal
function openRecipeModal() {
    document.getElementById('recipeModal').classList.add('open');
}

// chiusura modal
function closeRecipeModal(event) {
    if (!event || event.target.id === 'recipeModal' || event.target.className === 'modal-close' || event.target.className === 'btn-cancel') {
        document.getElementById('recipeModal').classList.remove('open');
    }
}

// event listeners
// nuove cose
document.addEventListener('DOMContentLoaded', () => {
    loadFeed();
    const searchInput = document.getElementById('social-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', async (e) => {
            const query = e.target.value.trim();
            if (query.length > 2 || query.length === 0) {
                await executeSocialSearch();
            }
        });
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                executeSocialSearch();
            }
        });        
    }
    
    const uploadForm = document.getElementById('upload-recipe-form');
    if (uploadForm) {
        uploadForm.addEventListener('submit', function(e) {
            e.preventDefault();
            alert("Recipe shared with the community!");
            closeRecipeModal();
            loadFeed();
        });
    }
}); 

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeUnstarModal();
});


