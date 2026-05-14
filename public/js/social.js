window.API_BASE_URL = `http://${window.location.hostname}:3000`;
const API_URL = `${API_BASE_URL}/api/social`; 

// caricamento feed
async function loadFeed() {
    const container = document.getElementById('recipe-feed');
    if (!container) return;

    try {
        const res = await fetch(`${API_URL}/feed`, { 
            credentials: 'include',
        });        
        
        if (!res.ok) {
            throw new Error(`Errore dal server: ${res.status}`);
        }
        
        const data = await res.json();

        // sezione starred
        const starredSection = document.getElementById('starred-feed-section');
        const starredContainer = document.getElementById('starred-recipe-feed');
        const divider = document.getElementById('feed-divider');

        if (data.starredRecipes && data.starredRecipes.length > 0) {
            starredSection.classList.remove('hidden');
            divider.classList.remove('hidden');
            starredContainer.innerHTML = '';
            data.starredRecipes.forEach(recipe => {
                starredContainer.appendChild(createRecipeArticle(recipe));
            });
        } else {
            if(starredSection) starredSection.classList.add('hidden');
            if(divider) divider.classList.add('hidden');
        }

        // sezione generale
        const mainFeedSection = document.getElementById('main-feed-section');
        if (mainFeedSection) mainFeedSection.classList.remove('hidden'); 
        container.innerHTML = '';
        
        const otherRecipes = data.otherRecipes || [];

        if (otherRecipes.length === 0) {
            container.innerHTML = '<p class="loading-msg">No recipes yet. Be the first to share!</p>';
        } else {
            otherRecipes.forEach(recipe => {
                container.appendChild(createRecipeArticle(recipe));
            });
        }

    } catch (err) {
        console.error("Feed error:", err);
        container.innerHTML = `<p class="loading-msg" style="color:red;">Impossibile caricare il feed. Riprova più tardi.</p>`;
        const mainFeedSection = document.getElementById('main-feed-section');
        if (mainFeedSection) mainFeedSection.classList.remove('hidden'); 
    }
}

function createRecipeArticle(recipe) {
    const article = document.createElement('article');
    article.className = 'recipe-card';
    const imageUrl = `${API_BASE_URL}${recipe.image}`;
    
    const myId = sessionStorage.getItem('userId');
    const hasMyLike = myId && recipe.likes && recipe.likes.includes(myId);
    
    const authorId = recipe.author._id || recipe.author;
    const isMine = myId && authorId === myId;

    article.innerHTML = `
        <img src="${imageUrl}" class="recipe-image" onclick="location.href='./detail/?id=${recipe._id}'">
        <div class="recipe-content">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <h3 onclick="location.href='./detail/?id=${recipe._id}'" style="cursor:pointer">${recipe.title}</h3>
                ${isMine ? `<button class="delete-post-btn" onclick="deleteMyRecipe('${recipe._id}', this)">🗑️</button>` : ''}
            </div>
            <p>By @${recipe.author ? recipe.author.username : 'user'}</p>
            <button class="like-btn ${hasMyLike ? 'active' : ''}" onclick="toggleLike('${recipe._id}', this)">
                ❤️ <span>${recipe.likes ? recipe.likes.length : 0}</span>
            </button>
        </div>
    `;
    return article;
}

// funzione per eliminare una propria ricetta
async function deleteMyRecipe(id, btn) {
    if (!confirm("Are you sure you want to delete this recipe?")) return;

    try {
        const res = await fetch(`${API_URL}/recipe/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        if (res.ok) {
            btn.closest('.recipe-card').remove();
            alert("Recipe deleted!");
        }
    } catch (err) {
        console.error("Delete error:", err);
    }
}

// funzione like ricetta (Motore universale)
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

    if (query === "") { 
        resultsArea?.classList.add('hidden');
        loadFeed();
        return;
    }
    
    // nasconde le sezioni del feed durante la ricerca
    document.getElementById('starred-feed-section')?.classList.add('hidden');
    document.getElementById('feed-divider')?.classList.add('hidden');
    document.getElementById('main-feed-section')?.classList.add('hidden');
    resultsArea?.classList.remove('hidden');

    try {
        const res = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}`, { credentials: 'include' });
        const results = await res.json();

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
                        <div class="creator-avatar" onclick="location.href='profile/?id=${user._id}'">${user.avatarEmoji || '👤'}</div>
                        <strong onclick="location.href='profile/?id=${user._id}'">@${user.username}</strong>
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
                recipesSection.classList.remove('hidden'); 
                results.community.recipes.forEach(recipe => {
                    const article = document.createElement('article');
                    article.className = 'recipe-card';
                    const imageUrl = `${API_BASE_URL}${recipe.image}`;
                    article.innerHTML = `
                        <img src="${imageUrl}" class="recipe-image" onclick="location.href='../social/detail/?id=${recipe._id}'">
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

// apertura modal upload ricetta
function openRecipeModal() {
    document.getElementById('recipeModal').classList.add('open');
    suggestFridgeIngredients();
}

// chiusura modal upload ricetta
function closeRecipeModal() {
    document.getElementById('recipeModal').classList.remove('open');
}

// per suggerire gli ingredienti dal proprio frigo
async function suggestFridgeIngredients() {
    const container = document.getElementById('fridge-checklist-container');
    if (!container) return;
  
    try {
        const ingredients = await loadFridgeData();
        container.innerHTML = ""; 
        if (ingredients.length === 0) {
            container.innerHTML = "<p>Fridge is empty.</p>";
            return;
        }   
        ingredients.forEach(item => {
            const div = document.createElement('div');
            div.className = "checkbox-item";
            div.innerHTML = `
                <input type="checkbox" value="${item.name}" id="check-${item._id}" onchange="handleCheckChange(this)">
                <label for="check-${item._id}">${item.name}</label>
            `;
            container.appendChild(div);
        });               
    } catch (err) { container.innerHTML = "<p>Error loading ingredients.</p>"; }
}

function renderIngredientTags() {
    const container = document.getElementById('selected-ingredients-tags');
    if (!container) return;
    container.innerHTML = selectedIngredients.map(ing => 
        `<span class="tag">${ing} <small onclick="removeTag('${ing}')" style="cursor:pointer">x</small></span>`
    ).join('');
}

function removeTag(name) {
    const index = selectedIngredients.indexOf(name);
    if (index > -1) {
        selectedIngredients.splice(index, 1);
        const cb = Array.from(document.querySelectorAll('.checkbox-item input')).find(i => i.value === name);
        if (cb) cb.checked = false;
        renderIngredientTags();
    }
}
window.removeTag = removeTag;

const selectedIngredients = [];

function initUploadEvents() {
    const ingInput = document.getElementById('ingredient-input');
    if (ingInput) {
        ingInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault(); 
                const item = e.target.value.trim();
                if (item && !selectedIngredients.includes(item)) {
                    selectedIngredients.push(item);
                    renderIngredientTags();
                    e.target.value = "";
                }
            }
        });
    }

    const imgInput = document.getElementById('recipe-img');
    if (imgInput) {
        imgInput.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const preview = document.getElementById('image-preview');
                    const previewContainer = document.getElementById('image-preview-container');
                    if (preview && previewContainer) {
                        preview.src = e.target.result;
                        previewContainer.classList.remove('hidden');
                    }
                }
                reader.readAsDataURL(file);
            }
        });
    }

    const uploadForm = document.getElementById('upload-recipe-form');
    if (uploadForm) {
        uploadForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            formData.delete('ingredients');
            formData.append('ingredients', JSON.stringify(selectedIngredients));                        
            
            try {
                const res = await fetch(`${API_URL}/upload-recipe`, {
                    method: 'POST',
                    body: formData, 
                    credentials: 'include'
                });        
                if (res.ok) {
                    alert("Recipe shared!");
                    selectedIngredients.length = 0;
                    closeRecipeModal();
                    loadFeed();
                }
            } catch (err) { console.error(err); }                        
        });
    }
}

function handleCheckChange(checkbox) {
    if (checkbox.checked) {
        if (!selectedIngredients.includes(checkbox.value)) selectedIngredients.push(checkbox.value);
    } else {
        const index = selectedIngredients.indexOf(checkbox.value);
        if (index > -1) selectedIngredients.splice(index, 1);
    }
    renderIngredientTags();
}

// Inizializzazione 
document.addEventListener('DOMContentLoaded', () => {
    loadFeed();
    initUploadEvents();
    const searchInput = document.getElementById('social-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            if (searchInput.value.trim().length > 2 || searchInput.value.trim().length === 0) executeSocialSearch();
        });
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') executeSocialSearch();
        });        
    }
});