const API_BASE_URL = `http://${window.location.hostname}:3000`;

async function loadReplicableRecipes() {
    const API_REPLICABLE = `${API_BASE_URL}/api/recipes/replicable`;

    try {
        const response = await fetch(API_REPLICABLE, {
            method: 'GET',
            credentials: 'include' 
        });
        
        if (!response.ok) {
            throw new Error(`Errore HTTP: ${response.status}`);
        }

        const data = await response.json();
        const grid = document.getElementById('replicable-grid');
        
        if (!grid) return;

        if (data.length === 0) {
                grid.innerHTML = `<p>No recipes available based on your fridge.</p>`;
            return; 
        }

        grid.innerHTML = ''; 

        data.forEach(recipe => {
            const cleanRecipeInfo = {
                id: recipe.id,
                title: recipe.title,
                image: recipe.image,
                imageType: recipe.imageType
            };

            const article = document.createElement('article');
            article.className = 'recipe-card';
            article.dataset.recipeId = cleanRecipeInfo.id; 

            article.style.cursor = 'pointer';
            article.addEventListener('click', () => {
                window.location.href = `../replicable/index.html?id=${cleanRecipeInfo.id}`;
            });

            article.innerHTML = `
                <p class="recipe-title">${cleanRecipeInfo.title}</p>
                <div class="recipe-img-wrapper">
                    <img src="${cleanRecipeInfo.image}" alt="${cleanRecipeInfo.title}" class="recipe-img">
                </div>
            `;

            grid.appendChild(article);
        });

    } catch (error) {
        console.error("Si è verificato un errore durante il recupero delle ricette:", error);
        document.getElementById('replicable-grid').innerHTML = '<p class="error-msg">Impossibile caricare le ricette in questo momento.</p>';
    }
}