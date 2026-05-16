window.API_BASE_URL = `http://${window.location.hostname}:3000`;

async function loadFullGrid() {
    const grid = document.getElementById('full-grid');
    if (!grid) return;

    try {
        const response = await fetch(`${window.API_BASE_URL}/api/recipes/replicable?limit=20`, {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) throw new Error("Errore nel caricamento");

        const data = await response.json();
        
        if (data.length === 0) {
            grid.innerHTML = "<p>No recipes found with your current ingredients.</p>";
            return;
        }

        grid.innerHTML = ''; 

        data.forEach(recipe => {
            const article = document.createElement('article');
            article.className = 'recipe-card';
            
            article.style.cursor = 'pointer';
            article.onclick = () => {
                window.location.href = `../replicable/?id=${recipe.id}`;
            };

            article.innerHTML = `
                <p class="recipe-title">${recipe.title}</p>
                <div class="recipe-img-wrapper">
                    <img src="${recipe.image}" alt="${recipe.title}" class="recipe-img">
                </div>
                <p style="font-size: 0.8rem; color: var(--primary-green); font-weight: bold; margin-top: 5px;">
                   Match: ${recipe.usedIngredientCount} ingredients
                </p>
            `;
            grid.appendChild(article);
        });

    } catch (error) {
        console.error(error);
        grid.innerHTML = "<p>Error connecting to server.</p>";
    }
}

document.addEventListener('DOMContentLoaded', loadFullGrid);