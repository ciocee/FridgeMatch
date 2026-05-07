async function loadReplicableRecipes() {
    const url = 'http://127.0.0.1:3000/api/recipes/replicable';

    try {
        const response = await fetch(url, {
            method: 'GET',
            credentials: 'include' 
        });
        
        if (!response.ok) {
            throw new Error(`Errore HTTP: ${response.status}`);
        }

        const data = await response.json();
        const grid = document.getElementById('replicable-grid');
        
        if (data.length === 0) {
            grid.innerHTML = `
                <article class="recipe-card">
                    <p class="recipe-title" style="text-align: center;">Nessuna ricetta disponibile</p>
                    <div class="recipe-img-placeholder" style="background-color: #f0f0f0; height: 120px; border-radius: 10px; margin-bottom: 10px;"></div>
                </article>
            `;
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
                window.location.href = `../recipe/index.html?id=${cleanRecipeInfo.id}`;
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