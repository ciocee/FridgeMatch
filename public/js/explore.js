window.API_BASE_URL = `http://${window.location.hostname}:3000`;

async function loadExploreResults() {
    const grid = document.getElementById('explore-grid');
    const subtitle = document.getElementById('search-subtitle');
    const searchInput = document.getElementById('explore-search-input');

    if (!grid || !subtitle) return;

    // Recupera la query dall'URL (es: ?q=chicken)
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');

    if (!query) {
        subtitle.textContent = "No search query provided.";
        return;
    }

    // Compila automaticamente la search bar con la parola cercata
    if (searchInput) {
        searchInput.value = query;
    }

    subtitle.textContent = `Results for "${query}"`;
    grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--gray-medium);">Loading recipes... ⏳</p>';

    try {
        const response = await fetch(`${window.API_BASE_URL}/api/explore/search?q=${encodeURIComponent(query)}`, {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) throw new Error("Errore nel caricamento dei risultati");

        const data = await response.json();
        const recipes = data.recipes || []; // Prendiamo SOLO le ricette
        
        // Se non ci sono ricette, mostriamo il messaggio di errore
        if (recipes.length === 0) {
            grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center;">No recipes found for "<strong>${query}</strong>". Try another keyword!</p>`;
            return;
        }

        grid.innerHTML = ''; 

        // --- STAMPA SOLO RICETTE ---
        recipes.forEach(recipe => {
            const article = document.createElement('article');
            article.className = 'recipe-card';
            article.style.cursor = 'pointer';
            
            const imgSrc = recipe.image 
                ? `<div class="recipe-img-wrapper"><img src="${recipe.image}" alt="${recipe.name}" class="recipe-img"></div>` 
                : `<div class="recipe-img-placeholder"></div>`;

            // ECCO IL BLOCCO MODIFICATO (Senza lo span "Recipe")
            article.innerHTML = `
                <div style="position:relative; height:100%;">
                    <p class="recipe-title">${recipe.name}</p>
                    ${imgSrc}
                </div>
            `;

            // Al click andiamo alla pagina di dettaglio
            article.onclick = () => {
                window.location.href = `../replicable/?id=${recipe.id}`;
            };

            grid.appendChild(article);
        });
        
    } catch (error) {
        console.error(error);
        grid.innerHTML = "<p style='grid-column: 1/-1; text-align: center;'>Error connecting to server. Please try again later.</p>";
    }
}

// Configura la nuova barra di ricerca
function setupExploreSearch() {
    const searchInput = document.getElementById('explore-search-input');
    const searchBtn = document.getElementById('explore-search-btn');

    if (!searchInput || !searchBtn) return;

    const performNewSearch = () => {
        const newQuery = searchInput.value.trim();
        if (newQuery) {
            // Ricarica la pagina corrente ma con la nuova query nell'URL
            window.location.href = `?q=${encodeURIComponent(newQuery)}`;
        }
    };

    searchBtn.addEventListener('click', performNewSearch);
    
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            performNewSearch();
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    setupExploreSearch();
    loadExploreResults();
});