window.API_BASE_URL = `http://${window.location.hostname}:3000`;
const API_SINGLE_RECIPE = `${API_BASE_URL}/api/recipes/recipe`;
const API_FAV_URL       = `${API_BASE_URL}/api/favourites`;

// Tiene traccia della ricetta corrente per il bottone preferiti
let currentRecipeData = null;

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const recipeId = urlParams.get('id');

    if (!recipeId) {
        document.getElementById('loadingMsg').textContent = "Recipe not found!";
        return;
    }

    loadRecipeDetails(recipeId);
});

async function loadRecipeDetails(id) {
    try {
        const isCommunityRecipe = id.length === 24;

        const endpoint = isCommunityRecipe
            ? `${API_BASE_URL}/api/social/recipe/${id}`
            : `${API_SINGLE_RECIPE}/${id}`;

        const response = await fetch(endpoint, {
            method: 'GET',
            credentials: 'include'
        });

        if (response.ok) {
            const recipe = await response.json();
            currentRecipeData = recipe;

            document.getElementById('loadingMsg').style.display = 'none';
            document.getElementById('recipeContent').style.display = 'block';

            // --- 1. INFO BASE ---
            document.getElementById('recipeTitle').textContent = recipe.title;

            const imgElement = document.getElementById('recipeImage');
            imgElement.src = isCommunityRecipe
                ? `${API_BASE_URL}${recipe.image}`
                : recipe.image;

            document.getElementById('recipeTime').textContent    = recipe.readyInMinutes || '--';
            document.getElementById('recipeServings').textContent = recipe.servings || '--';
            document.getElementById('recipeHealth').textContent  = recipe.healthScore || '--';

            // --- 2. BOTTONE ADD TO FAVOURITES ---
            await setupFavouriteButton(id, recipe, isCommunityRecipe);

            // --- 3. DIETE (Badge) ---
            const dietaryContainer = document.getElementById('recipeDietary');
            dietaryContainer.innerHTML = '';

            const createDietBadge = (label) => {
                const span = document.createElement('span');
                span.textContent = label;
                span.className = 'filter-btn active';
                span.style.cursor = 'default';
                span.style.pointerEvents = 'none';
                dietaryContainer.appendChild(span);
            };

            if (recipe.glutenFree) createDietBadge("🌾 Gluten-Free");
            if (recipe.dairyFree)  createDietBadge("🥛 Dairy-Free");
            if (recipe.vegetarian) createDietBadge("🥚 Vegetarian");
            if (recipe.vegan)      createDietBadge("🌿 Vegan");

            // --- 4. INGREDIENTI ---
            const ingredientsUl = document.getElementById('recipeIngredients');
            ingredientsUl.innerHTML = '';
            const list = isCommunityRecipe ? recipe.ingredients : recipe.extendedIngredients;

            if (list && list.length > 0) {
                list.forEach(ing => {
                    const li = document.createElement('li');
                    li.textContent = isCommunityRecipe ? ing : ing.original;
                    ingredientsUl.appendChild(li);
                });
            } else {
                ingredientsUl.innerHTML = '<li>No ingredients specified.</li>';
            }

            // --- 5. MACROS ---
            if (recipe.macros) {
                document.getElementById('macroCalories').textContent = recipe.macros.calories || 'N/A';
                document.getElementById('macroProtein').textContent  = recipe.macros.protein  || 'N/A';
                document.getElementById('macroFat').textContent      = recipe.macros.fat      || 'N/A';
                document.getElementById('macroCarbs').textContent    = recipe.macros.carbs    || 'N/A';
            } else {
                document.getElementById('macroCalories').textContent = 'N/A';
                document.getElementById('macroProtein').textContent  = 'N/A';
                document.getElementById('macroFat').textContent      = 'N/A';
                document.getElementById('macroCarbs').textContent    = 'N/A';
            }

            // --- 6. ISTRUZIONI ---
            const stepsUl = document.getElementById('recipeSteps');
            stepsUl.innerHTML = '';

            if (!isCommunityRecipe && recipe.analyzedInstructions && recipe.analyzedInstructions.length > 0) {
                recipe.analyzedInstructions[0].steps.forEach(step => {
                    const li = document.createElement('li');
                    li.textContent = step.step;
                    stepsUl.appendChild(li);
                });
            } else if (recipe.instructions) {
                let cleanText = recipe.instructions.replace(/<[^>]*>?/gm, '\n');
                let lines = cleanText.split('\n')
                    .map(line => line.trim())
                    .filter(line => line.length > 15)
                    .filter(line => !line.toLowerCase().includes('subscribe'))
                    .filter(line => !line.toLowerCase().includes('email'))
                    .filter(line => !line.toLowerCase().includes('leave me a comment'))
                    .filter(line => !line.toLowerCase().includes('follow'));

                if (lines.length > 0) {
                    lines.forEach(line => {
                        const li = document.createElement('li');
                        li.textContent = line;
                        stepsUl.appendChild(li);
                    });
                } else {
                    stepsUl.innerHTML = '<li>Instructions not available in a readable format.</li>';
                }
            } else {
                stepsUl.innerHTML = '<li>No instructions available.</li>';
            }

        } else {
            document.getElementById('loadingMsg').textContent = "Error: Recipe not found.";
        }
    } catch (error) {
        console.error("Errore nel caricamento:", error);
        document.getElementById('loadingMsg').textContent = "Connection error.";
    }
}

/* ─────────────────────────────────────────
   GESTIONE BOTTONE ADD TO FAVOURITES
───────────────────────────────────────── */
async function setupFavouriteButton(recipeId, recipe, isCommunityRecipe) {
    const btn = document.getElementById('favBtn');
    if (!btn) return;

    // Controlla se è già nei preferiti
    let isFav = false;
    try {
        const checkRes = await fetch(`${API_FAV_URL}/check/${recipeId}`, { credentials: 'include' });
        if (checkRes.ok) {
            const data = await checkRes.json();
            isFav = data.isFavourite;
        }
    } catch (e) { /* ignora errori di rete */ }

    updateFavBtn(btn, isFav);

    btn.addEventListener('click', async () => {
        btn.disabled = true;

        const currentlyFav = btn.dataset.fav === 'true';

        if (currentlyFav) {
            // Rimuovi dai preferiti
            try {
                const res = await fetch(`${API_FAV_URL}/${recipeId}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });
                if (res.ok) updateFavBtn(btn, false);
            } catch (e) { console.error(e); }
        } else {
            // Aggiungi ai preferiti con snapshot dati
            const imageUrl = isCommunityRecipe
                ? `${API_BASE_URL}${recipe.image}`
                : recipe.image;

            const snapshot = {
                title:          recipe.title,
                image:          imageUrl,
                readyInMinutes: recipe.readyInMinutes,
                servings:       recipe.servings,
                glutenFree:     recipe.glutenFree  || false,
                dairyFree:      recipe.dairyFree   || false,
                vegetarian:     recipe.vegetarian  || false,
                vegan:          recipe.vegan        || false,
                macros:         recipe.macros       || {}
            };

            try {
                const res = await fetch(`${API_FAV_URL}/${recipeId}`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(snapshot)
                });
                if (res.ok || res.status === 409) updateFavBtn(btn, true);
            } catch (e) { console.error(e); }
        }

        btn.disabled = false;
    });
}

function updateFavBtn(btn, isFav) {
    btn.dataset.fav = isFav ? 'true' : 'false';
    if (isFav) {
        btn.textContent = '❤️ Remove from Favourites';
        btn.classList.add('fav-btn-active');
    } else {
        btn.textContent = '🤍 Add to Favourites';
        btn.classList.remove('fav-btn-active');
    }
}