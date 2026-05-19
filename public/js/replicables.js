window.API_BASE_URL = `http://${window.location.hostname}:3000`;
const API_FAV_URL = `${API_BASE_URL}/api/favourites`;

async function loadReplicableRecipes() {
    const API_REPLICABLE = `${API_BASE_URL}/api/recipes/replicable`;

    try {
        const response = await fetch(API_REPLICABLE, {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) throw new Error(`Errore HTTP: ${response.status}`);

        const data = await response.json();
        const grid = document.getElementById('replicable-grid');
        if (!grid) return;
        if (data.length === 0) return;

        grid.innerHTML = '';

        // Carica preferiti esistenti per mostrare subito il cuore corretto
        let favouriteIds = new Set();
        try {
            const favRes = await fetch(API_FAV_URL, { credentials: 'include' });
            if (favRes.ok) {
                const favs = await favRes.json();
                favs.forEach(f => favouriteIds.add(String(f.recipeId)));
            }
        } catch (e) { /* ignora */ }

        data.slice(0, 4).forEach(recipe => {
            const isFav = favouriteIds.has(String(recipe.id));

            const article = document.createElement('article');
            article.className = 'recipe-card';
            article.dataset.recipeId = recipe.id;
            article.style.cursor = 'pointer';
            article.style.position = 'relative';

            article.innerHTML = `
                <button class="card-heart-btn${isFav ? ' active' : ''}"
                        title="${isFav ? 'Remove from favourites' : 'Add to favourites'}"
                        data-fav="${isFav}">${isFav ? '❤️' : '🤍'}</button>
                <p class="recipe-title">${recipe.title}</p>
                <div class="recipe-img-wrapper">
                    <img src="${recipe.image}" alt="${recipe.title}" class="recipe-img">
                </div>
            `;

            // Click card → apri ricetta (non sul cuore)
            article.addEventListener('click', (e) => {
                if (e.target.closest('.card-heart-btn')) return;
                window.location.href = `../replicable/?id=${recipe.id}`;
            });

            // Click cuore → toggle preferito
            const heartBtn = article.querySelector('.card-heart-btn');
            heartBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                heartBtn.disabled = true;
                const currentlyFav = heartBtn.dataset.fav === 'true';

                if (currentlyFav) {
                    try {
                        const res = await fetch(`${API_FAV_URL}/${recipe.id}`, {
                            method: 'DELETE', credentials: 'include'
                        });
                        if (res.ok) {
                            heartBtn.dataset.fav = 'false';
                            heartBtn.textContent = '🤍';
                            heartBtn.classList.remove('active');
                            heartBtn.title = 'Add to favourites';
                            if (typeof loadFavouriteRecipes === 'function') loadFavouriteRecipes();
                        }
                    } catch (err) { console.error(err); }
                } else {
                    try {
                        const res = await fetch(`${API_FAV_URL}/${recipe.id}`, {
                            method: 'POST',
                            credentials: 'include',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                title: recipe.title,
                                image: recipe.image,
                                readyInMinutes: recipe.readyInMinutes || null,
                                servings: recipe.servings || null,
                                glutenFree: false, dairyFree: false,
                                vegetarian: false, vegan: false,
                                macros: {}
                            })
                        });
                        if (res.ok || res.status === 409) {
                            heartBtn.dataset.fav = 'true';
                            heartBtn.textContent = '❤️';
                            heartBtn.classList.add('active');
                            heartBtn.title = 'Remove from favourites';
                            if (typeof loadFavouriteRecipes === 'function') loadFavouriteRecipes();
                        }
                    } catch (err) { console.error(err); }
                }

                heartBtn.disabled = false;
            });

            grid.appendChild(article);
            
            
        });

    } catch (error) {
        console.error("There was an error during recipe loading:", error);
        const grid = document.getElementById('replicable-grid');
        if (grid) grid.innerHTML = '<p class="error-msg">Impossible to load recipes at the moment.</p>';
    }
}