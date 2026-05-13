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

            document.getElementById('recipeTitle').textContent = recipe.title;

            const imgElement = document.getElementById('recipeImage');
            imgElement.src = isCommunityRecipe 
                ? `${API_BASE_URL}${recipe.image}` 
                : recipe.image;

            document.getElementById('recipeTime').textContent = recipe.readyInMinutes || '--';
            
            const ingredientsUl = document.getElementById('recipeIngredients');
            ingredientsUl.innerHTML = '';
            
            const list = isCommunityRecipe ? recipe.ingredients : recipe.extendedIngredients;
            
            list.forEach(ing => {
                const li = document.createElement('li');
                li.textContent = isCommunityRecipe ? ing : ing.original;
                ingredientsUl.appendChild(li);
            });

        } else {
            document.getElementById('loadingMsg').textContent = "Error: Recipe not found.";
        }
    } catch (error) {
        document.getElementById('loadingMsg').textContent = "Connection error.";
    }
}