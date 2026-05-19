window.API_BASE_URL = `http://${window.location.hostname}:3000`;

let replicableRecipes = [];
let activeFilter = 'all';

async function loadFullGrid() {
    const grid = document.getElementById('full-grid');
    if (!grid) return;

    try {
        const response = await fetch(`${window.API_BASE_URL}/api/recipes/replicable-extended?limit=20`, {
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


// render griglia replicables
function renderReplicableRecipes() {
    const grid = document.getElementById('full-grid');
    const emptyState = document.getElementById('emptyState');
    if (!grid) return;

    const searchVal = document.getElementById('searchInput')?.value.toLowerCase().trim() || '';

    let recipes = [...replicableRecipes];

    // Filtro ricerca
    if (searchVal) {
        recipes = recipes.filter(r => r.title.toLowerCase().includes(searchVal));
    }

    // Ordine alfabetico
    recipes.sort((a, b) => a.title.localeCompare(b.title));

    grid.innerHTML = '';

    if (recipes.length === 0) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
        recipes.forEach(recipe => {
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
    }
}

function setFilter(filter, btn) {
    activeFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderReplicableRecipes();
}
window.setFilter = setFilter;

document.addEventListener('DOMContentLoaded', () => {
    loadFullGrid();
    
    document.getElementById('searchInput')?.addEventListener('input', renderReplicableRecipes);
    
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            document.getElementById('searchInput').value = '';
            activeFilter = 'all';
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelector('.filter-btn').classList.add('active');
            renderReplicableRecipes();
        }
    });
});