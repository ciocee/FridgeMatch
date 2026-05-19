window.API_BASE_URL = `http://${window.location.hostname}:3000`;
const API_SINGLE_RECIPE = `${API_BASE_URL}/api/recipes/recipe`;
const API_FAV_URL       = `${API_BASE_URL}/api/favourites`;

const GROCERY_CATEGORIES = [
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

let currentRecipeData = null;
let ingredientQueue = [];
let activeQuickCategory = '';

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const recipeId = urlParams.get('id');

    if (!recipeId) {
        document.getElementById('loadingMsg').textContent = "Recipe not found!";
        return;
    }

    loadRecipeDetails(recipeId);
    setupQuickAddModalEvents();
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

            document.getElementById('recipeTitle').textContent = recipe.title;

            const imgElement = document.getElementById('recipeImage');
            if (recipe.image && recipe.image.startsWith('data:image')) {
                imgElement.src = recipe.image;
            } else {
                imgElement.src = isCommunityRecipe 
                    ? `${API_BASE_URL}${recipe.image}` 
                    : recipe.image;
            }

            document.getElementById('recipeTime').textContent    = recipe.readyInMinutes || '--';
            document.getElementById('recipeServings').textContent = recipe.servings || '--';
            document.getElementById('recipeHealth').textContent  = recipe.healthScore || '--';

            await setupFavouriteButton(id, recipe, isCommunityRecipe);

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

            const ingredientsUl = document.getElementById('recipeIngredients');
            const ingredientsDiv = ingredientsUl.parentElement;
            const ingredientsH3 = ingredientsDiv.querySelector('h3');

            const headingWrapper = document.createElement('div');
            headingWrapper.style.cssText = 'display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--gray-light); padding-bottom: 10px; margin-bottom: 15px;';
            ingredientsH3.style.cssText = 'margin: 0; padding: 0; border: none; color: var(--text-dark);';
            ingredientsDiv.insertBefore(headingWrapper, ingredientsH3);
            headingWrapper.appendChild(ingredientsH3);

            const list = isCommunityRecipe ? recipe.ingredients : recipe.extendedIngredients;
            const missingIngredients = []; 

            if (list && list.length > 0) {
                try {
                    ingredientsUl.innerHTML = '<li style="list-style:none;">Checking your fridge... ❄️</li>';

                    const fridgeRes = await fetch(`${API_BASE_URL}/api/fridge`, { credentials: 'include' });
                    const fridgeItems = fridgeRes.ok ? await fridgeRes.json() : [];
                    const fridgeNames = fridgeItems.map(item => item.name.toLowerCase().trim());

                    ingredientsUl.innerHTML = ''; 

                    list.forEach(ing => {
                        const li = document.createElement('li');
                        li.style.display = 'flex';
                        li.style.justifyContent = 'space-between';
                        li.style.alignItems = 'center';
                        li.style.marginBottom = '12px';
                        li.style.paddingBottom = '4px';

                        const ingName = isCommunityRecipe ? ing : ing.name;
                        const ingOriginal = isCommunityRecipe ? ing : ing.original;

                        const textSpan = document.createElement('span');
                        textSpan.textContent = ingOriginal;
                        li.appendChild(textSpan);

                        const isPresent = fridgeNames.some(fName =>
                            ingName.toLowerCase().includes(fName) || fName.includes(ingName.toLowerCase())
                        );

                        const statusBadge = document.createElement('span');
                        statusBadge.style.cssText = 'font-size: 0.8rem; font-weight: bold; padding: 4px 10px; border-radius: 20px; transition: all 0.3s ease;';
                        // Salviamo il nome esatto nell'attributo dataset per trovarlo dopo
                        statusBadge.dataset.ingredient = ingName; 

                        if (isPresent) {
                            statusBadge.textContent = '❄️ In Fridge';
                            statusBadge.style.color = 'var(--primary-green)';
                            statusBadge.style.background = '#e6f4ea';
                        } else {
                            statusBadge.textContent = '❌ Missing';
                            statusBadge.style.color = '#d97706'; 
                            statusBadge.style.background = '#fffbeb'; 
                            missingIngredients.push(ingName); 
                        }
                        li.appendChild(statusBadge);
                        ingredientsUl.appendChild(li);
                    });

                    if (missingIngredients.length > 0) {
                        const globalAddBtn = document.createElement('button');
                        globalAddBtn.id = 'globalAddMissingBtn'; // ID per ritrovarlo
                        globalAddBtn.style.cssText = 'padding: 6px 14px; font-size: 1rem; background: var(--primary-green); color: white; border: none; border-radius: 20px; cursor: pointer; font-weight: bold; transition: background 0.2s, transform 0.1s;';
                        globalAddBtn.textContent = `🛒 Add ${missingIngredients.length} missing to Grocery`;

                        globalAddBtn.onmouseover = () => { globalAddBtn.style.background = '#1a773d'; }; 
                        globalAddBtn.onmouseout = () => { globalAddBtn.style.background = 'var(--primary-green)'; };

                        globalAddBtn.onclick = () => {
                            // Legge di nuovo i missing basandosi sui badge attuali
                            ingredientQueue = Array.from(document.querySelectorAll('#recipeIngredients span[data-ingredient]'))
                                                .filter(b => b.textContent.includes('Missing'))
                                                .map(b => b.dataset.ingredient);
                            
                            globalAddBtn.style.display = 'none';
                            processNextIngredient();
                        };
                        headingWrapper.appendChild(globalAddBtn);
                    }

                } catch (err) {
                    ingredientsUl.innerHTML = '<li>Error checking ingredients.</li>';
                }
            } else {
                ingredientsUl.innerHTML = '<li>No ingredients specified.</li>';
            }

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
        document.getElementById('loadingMsg').textContent = "Connection error.";
    }
}

async function setupFavouriteButton(recipeId, recipe, isCommunityRecipe) {
    const btn = document.getElementById('favBtn');
    if (!btn) return;

    let isFav = false;
    try {
        const checkRes = await fetch(`${API_FAV_URL}/check/${recipeId}`, { credentials: 'include' });
        if (checkRes.ok) {
            const data = await checkRes.json();
            isFav = data.isFavourite;
        }
    } catch (e) {}

    updateFavBtn(btn, isFav);

    btn.addEventListener('click', async () => {
        btn.disabled = true;
        const currentlyFav = btn.dataset.fav === 'true';

        if (currentlyFav) {
            try {
                const res = await fetch(`${API_FAV_URL}/${recipeId}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });
                if (res.ok) updateFavBtn(btn, false);
            } catch (e) {}
        } else {
            const imageUrl = isCommunityRecipe ? `${API_BASE_URL}${recipe.image}` : recipe.image;
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
            } catch (e) {}
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

/* ─────────────────────────────────────────
   GESTIONE MODAL "QUICK ADD" GROCERY (LA CODA)
───────────────────────────────────────── */
function buildQuickCategoryGrid() {
    const grid = document.getElementById('quickAddCategoryGrid');
    if (!grid || grid.children.length > 0) return; 

    GROCERY_CATEGORIES.forEach(cat => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'cat-btn';
        btn.dataset.id = cat.id;
        btn.innerHTML = `<span style="font-size:1.2rem">${cat.emoji}</span><span>${cat.label}</span>`;
        btn.onclick = () => {
            activeQuickCategory = cat.id;
            document.querySelectorAll('#quickAddCategoryGrid .cat-btn').forEach(b => {
                b.classList.toggle('selected', b.dataset.id === cat.id);
            });
        };
        grid.appendChild(btn);
    });
}

// Funzione richiamata anche dalla X o dallo sfondo scuro
function abortQuickAdd() {
    document.getElementById('quickAddBackdrop').classList.remove('open');
    ingredientQueue = []; // Svuota la coda
    
    // Controlla quanti missing sono rimasti e aggiorna il bottone
    updateGlobalAddButton();
}
window.abortQuickAdd = abortQuickAdd; // Rende la funzione accessibile nell'HTML

function updateGlobalAddButton() {
    const btn = document.getElementById('globalAddMissingBtn');
    if (btn) {
        let stillMissing = 0;
        document.querySelectorAll('#recipeIngredients span[data-ingredient]').forEach(b => {
            if (b.textContent.includes('Missing')) stillMissing++;
        });
        
        if (stillMissing > 0) {
            btn.style.display = 'block';
            btn.textContent = `🛒 Add ${stillMissing} missing to Grocery`;
        } else {
            btn.style.display = 'none';
        }
    }
}

function processNextIngredient() {
    if (ingredientQueue.length === 0) {
        document.getElementById('quickAddBackdrop').classList.remove('open');
        updateGlobalAddButton();
        return;
    }

    const nextIngredient = ingredientQueue.shift(); 
    
    buildQuickCategoryGrid();
    document.getElementById('quickAddName').value = nextIngredient;
    document.getElementById('quickAddQty').value = 1;
    document.getElementById('quickAddUnit').value = 'units'; 
    
    activeQuickCategory = '';
    document.querySelectorAll('#quickAddCategoryGrid .cat-btn').forEach(b => b.classList.remove('selected'));

    document.getElementById('quickAddBackdrop').classList.add('open');
}

function setupQuickAddModalEvents() {
    const quickAddForm = document.getElementById('quickAddForm');
    const skipBtn = document.getElementById('quickAddSkipBtn');

    if(quickAddForm) {
        quickAddForm.onsubmit = async (e) => {
            e.preventDefault();
            
            if (!activeQuickCategory) {
                alert("Please select a category!");
                return;
            }

            const currentIngredientName = document.getElementById('quickAddName').value.trim();

            const payload = {
                name: currentIngredientName,
                category: activeQuickCategory,
                qty: parseFloat(document.getElementById('quickAddQty').value),
                unit: document.getElementById('quickAddUnit').value
            };

            const submitBtn = quickAddForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = "Saving...";

            try {
                const res = await fetch(`${API_BASE_URL}/api/grocery`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(payload)
                });
                
                if(res.ok) {
                    // Magia: aggiorna il badge in diretta!
                    document.querySelectorAll('#recipeIngredients span[data-ingredient]').forEach(badge => {
                        if (badge.dataset.ingredient === currentIngredientName) {
                            badge.textContent = '🛒 In List';
                            badge.style.color = '#0369a1'; // Azzurro scuro
                            badge.style.background = '#e0f2fe'; // Azzurro chiaro
                        }
                    });

                    processNextIngredient(); 
                } else {
                    alert("Error saving item. Please try again.");
                }
            } catch (err) {
                console.error("Errore salvataggio:", err);
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = "Save to List";
            }
        };
    }

    if(skipBtn) {
        skipBtn.onclick = () => processNextIngredient();
    }
}