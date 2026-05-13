window.API_BASE_URL = `http://${window.location.hostname}:3000`;
const API_URL = `${API_BASE_URL}/api/social`; 

// caricamento feed
async function loadFeed() {
    const container = document.getElementById('recipe-feed');
    if (!container) return;

    try {
        const res = await fetch(`${API_URL}/feed`, {credentials: 'include'});
        const data = await res.json(); 
        container.innerHTML = "";

        // sezione ricette da starred creators
        if (data.starredRecipes && data.starredRecipes.length > 0) {
            const title = document.createElement('h2');
            title.textContent = "Posts from creators you starred";
            title.className = "section-title";
            container.appendChild(title);
            
            data.starredRecipes.forEach(recipe => {
                container.appendChild(createRecipeArticle(recipe));
            });
        }

        // sezione ricette generali
        const titleGen = document.createElement('h2');
        titleGen.textContent = "Recent Recipes";
        titleGen.className = "section-title";
        titleGen.style.marginTop = "2rem";
        container.appendChild(titleGen);

        data.otherRecipes.forEach(recipe => {
            container.appendChild(createRecipeArticle(recipe));
        });        

    } catch (err) {
        console.error("Feed error:", err);
    }
}

function createRecipeArticle(recipe) {
    const article = document.createElement('article');
    article.className = 'recipe-card';
    const imageUrl = `${API_BASE_URL}${recipe.image}`;
    
    const myId = sessionStorage.getItem('userId');
    const authorId = recipe.author._id || recipe.author;
    const isMine = recipe.author._id === myId;

    article.innerHTML = `
        <img src="${imageUrl}" class="recipe-image" onclick="location.href='./detail/?id=${recipe._id}'">
        <div class="recipe-content">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <h3 onclick="location.href='./detail/?id=${recipe._id}'" style="cursor:pointer">${recipe.title}</h3>
                ${isMine ? `<button class="delete-post-btn" onclick="deleteMyRecipe('${recipe._id}', this)">🗑️</button>` : ''}
            </div>
            <p>By @${recipe.author.username}</p>
            <button class="like-btn" onclick="toggleLike('${recipe._id}', this)">
                ❤️ <span>${recipe.likes.length}</span>
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

// funzione like ricetta
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

        // caso in cui la ricerca non produce risultati
        const noUsers = !results.community.users || results.community.users.length === 0;
        const noRecipes = !results.community.recipes || results.community.recipes.length === 0;

        const existingEmpty = document.getElementById('no-results-msg');
        if (existingEmpty) existingEmpty.remove();

        if (noUsers && noRecipes) {
            const msg = document.createElement('p');
            msg.id = 'no-results-msg';
            msg.style.cssText = 'padding:2rem; color:var(--gray-medium); text-align:center; font-size:1rem;';
            msg.textContent = `No results found for "${query}"`;
            document.getElementById('search-results-area').appendChild(msg);
        }

    } catch (err) {
        console.error("Search error:", err);
    }
}

// gestione stella: se un creator è starred, chiede conferma prima di toglierla. sennò la mette
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
        const res = await fetch(`${API_BASE_URL}/api/social/star/${userId}`, {
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
        const res = await fetch(`${API_BASE_URL}/api/social/star/${pendingUnstarId}`, {
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

// apertura modal upload ricetta
function openRecipeModal() {
    document.getElementById('recipeModal').classList.add('open');
    suggestFridgeIngredients();
}

// chiusura modal upload ricetta
function closeRecipeModal(event) {
    if (!event || event.target.id === 'recipeModal' || event.target.className === 'modal-close' || event.target.className === 'btn-cancel') {
        document.getElementById('recipeModal').classList.remove('open');
    }
}

// per suggerire gli ingredienti dal proprio frigo quando si pubblica una ricetta
async function suggestFridgeIngredients() {
    const container = document.getElementById('fridge-checklist-container');
    if (!container) return;
  
    try {
        const ingredients = await loadFridgeData();
        container.innerHTML = ""; 

        if (ingredients.length === 0) {
            container.innerHTML = "<p style='font-size:0.8rem; color:var(--gray-medium)'>Your fridge is empty.</p>";
            return;
        }   

        ingredients.forEach(item => {
            const div = document.createElement('div');
            div.className = "checkbox-item";

            const checkbox = document.createElement('input');
                checkbox.type = "checkbox";
                checkbox.value = item.name;
                checkbox.id = `check-${item._id}`;
            
            checkbox.onchange = (e) => {
                if (e.target.checked) {
                    if (!selectedIngredients.includes(item.name)) selectedIngredients.push(item.name);
                } else {
                    const index = selectedIngredients.indexOf(item.name);
                    if (index > -1) selectedIngredients.splice(index, 1);
                }
                renderIngredientTags(); // Aggiorna la visualizzazione dei tag (Parte 4)
            };

            const label = document.createElement('label');
            label.htmlFor = `check-${item._id}`;
            label.textContent = item.name;

            div.appendChild(checkbox);
            div.appendChild(label);
            container.appendChild(div);
        });               
    } catch (err) {
        container.innerHTML = "<p>Error loading ingredients.</p>";
    }
}

function renderIngredientTags() {
    const container = document.getElementById('selected-ingredients-tags');
    container.innerHTML = selectedIngredients.map(ing => 
        `<span class="tag">${ing} <small onclick="removeIng('${ing}')" style="cursor:pointer">x</small></span>`
    ).join('');
}

// per rimuovere i tag degli ingredienti
function removeIng(name) {
    const index = selectedIngredients.indexOf(name);
    if (index > -1) {
        selectedIngredients.splice(index, 1);
        renderIngredientTags();
    }
}
window.removeIng = removeIng;

const selectedIngredients = []; // array ingredienti scelti dal frigo

function initUploadEvents() {
    const ingInput = document.getElementById('ingredient-input');
    if (ingInput) {
        ingInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault(); 

                const item = e.target.value;
                if (item && !selectedIngredients.includes(item)) {
                    selectedIngredients.push(item);
                    renderIngredientTags();
                    e.target.value = "";
                }
        }   
    });
    }

    const imgInput = document.getElementById('recipe-img');
    const imgPreview = document.getElementById('image-preview');
    const previewContainer = document.getElementById('image-preview-container');

    if (imgInput) {
        imgInput.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    imgPreview.src = e.target.result;
                    previewContainer.classList.remove('hidden');
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
                    alert("Recipe shared with the community!");
                    selectedIngredients.length = 0; // per svuotare l'array
                    renderIngredientTags();
                    closeRecipeModal();
                    if (typeof loadFeed === "function" && document.getElementById('recipe-feed')) {
                        loadFeed();
                    } else {
                    // se nel profilo, ricarica la pagina per vedere la nuova ricetta tra le mie ricette
                        window.location.reload();
                    }
                } else {
                    const errorMsg = await res.text();
                    alert("Upload failed: " + errorMsg);                    
                }
            } catch (err) {
                console.error("Errore di rete:", err);            
            }                        
        });
    }
}

// caricamento del feed
document.addEventListener('DOMContentLoaded', () => {
    loadFeed();
    initUploadEvents();
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
});

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeUnstarModal();
});


