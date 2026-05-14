window.API_BASE_URL = `http://${window.location.hostname}:3000`;
const API_SINGLE_RECIPE = `${API_BASE_URL}/api/recipes/recipe`;

document.addEventListener('DOMContentLoaded', () => {
    // 1. Legge l'ID dall'URL della pagina
    const urlParams = new URLSearchParams(window.location.search);
    const recipeId = urlParams.get('id');

    if (!recipeId) {
        document.getElementById('loadingMsg').textContent = "Recipe not found!";
        return;
    }

    // 2. Chiama la funzione per scaricare i dati
    loadRecipeDetails(recipeId);
});

async function loadRecipeDetails(id) {
    try {
        // Distinguiamo tra ricetta del DB 
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
            
            document.getElementById('loadingMsg').style.display = 'none';
            document.getElementById('recipeContent').style.display = 'block';

            // --- 1. INFO BASE ---
            document.getElementById('recipeTitle').textContent = recipe.title;

            const imgElement = document.getElementById('recipeImage');
            imgElement.src = isCommunityRecipe 
                ? `${API_BASE_URL}${recipe.image}` 
                : recipe.image;

            document.getElementById('recipeTime').textContent = recipe.readyInMinutes || '--';
            document.getElementById('recipeServings').textContent = recipe.servings || '--';
            document.getElementById('recipeHealth').textContent = recipe.healthScore || '--';

            // --- 2. DIETE (Badge)---
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

            if (isCommunityRecipe && recipe.diets && Array.isArray(recipe.diets) && recipe.diets.length > 0) {
            }

            // --- 3. INGREDIENTI ---
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
                ingredientsUl.innerHTML = '<li>Nessun ingrediente specificato.</li>';
            }

            // --- 4. SUMMARY ---
            const summaryEl = document.getElementById('recipeSummary');
            if (recipe.summary) {
                summaryEl.innerHTML = recipe.summary;
            } else if (recipe.description) {
                summaryEl.textContent = recipe.description;
            } else {
                summaryEl.textContent = "Nessun riepilogo disponibile per questa ricetta.";
            }

            // --- 5. ISTRUZIONI ---
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
                    stepsUl.innerHTML = '<li>Istruzioni non disponibili in formato leggibile.</li>';
                }
            } else {
                stepsUl.innerHTML = '<li>Nessuna istruzione disponibile.</li>';
            }

        } else {
            document.getElementById('loadingMsg').textContent = "Error: Recipe not found.";
        }
    } catch (error) {
        console.error("Errore nel caricamento:", error);
        document.getElementById('loadingMsg').textContent = "Connection error.";
    }
}