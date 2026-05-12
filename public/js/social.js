window.API_BASE_URL = `http://${window.location.hostname}:3000`;

// gestione caricamento dinamico del feed e interazioni con i like
const API_URL = `${API_BASE_URL}/api/social`; 

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
        // FIX: corretto il passaggio dell'ID nella URL (Parte 1 slide 102)
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
async function executeSearch(query) {
    try {
        const res = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}`, { credentials: 'include' });
        const results = await res.json();
        const container = document.getElementById('recipe-feed');
        
        container.innerHTML = "<h2>From Community</h2>";

        results.community.users.forEach(user => {
            const div = document.createElement('div');
            div.className = 'creator-card';
            div.innerHTML = `
                <div class="creator-avatar">${user.avatarEmoji}</div>
                <strong>@${user.username}</strong>
                <button class="star-btn" onclick="followUser('${user._id}')">⭐ Star</button>`;
            container.appendChild(div);            
        });

        results.community.recipes.forEach(r => {
            const article = document.createElement('article');
            article.className = 'recipe-card';
            article.innerHTML = `
                <img src="${r.image}" class="recipe-image">
                <div class="recipe-content">
                    <h3>${r.title}</h3>
                    <p>By @${r.author.username}</p>
                </div>`;
            container.appendChild(article);
        });

        container.innerHTML += "<h2 style='margin-top:2rem'>Global Suggestions</h2>"; 
        results.global.forEach(r => {
            const article = document.createElement('article');
            article.className = 'recipe-card';
            article.innerHTML = `
                <img src="${r.image}" class="recipe-image">
                <div class="recipe-content">
                    <h3>${r.title}</h3>
                    <p>Global Recipe</p>
                </div>`;
            
            container.appendChild(article);
        });
    } catch (err) {
        console.error("Search error:", err);
    }
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

document.addEventListener('DOMContentLoaded', loadFeed);

// inizializzazione eventi e dati al caricamento
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');

    if (searchInput) {
        searchInput.addEventListener('input', async (e) => {
            const query = e.target.value.trim();
            if (query.length > 2) {
                await executeSearch(query);
            }
        });
    }
});

// Gestione invio
document.getElementById('upload-recipe-form').addEventListener('submit', function(e) {
    e.preventDefault();
    alert("Recipe shared with the community!");
    closeRecipeModal();
});