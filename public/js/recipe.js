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
        const response = await fetch(`${API_SINGLE_RECIPE}/${id}`, {
            method: 'GET',
            credentials: 'include'
        });

        if (response.status === 401) {
            window.location.href = '../login/index.html';
            return;
        }

        if (response.ok) {
            const recipe = await response.json();
            
            // Nascondi il messaggio di caricamento e mostra la scheda
            document.getElementById('loadingMsg').style.display = 'none';
            document.getElementById('recipeContent').style.display = 'block';

            // Riempie i testi e l'immagine nell'HTML
            document.getElementById('recipeTitle').textContent = recipe.title;
            document.getElementById('recipeImage').src = recipe.image;
            document.getElementById('recipeTime').textContent = recipe.readyInMinutes;
            document.getElementById('recipeServings').textContent = recipe.servings;
            document.getElementById('recipeHealth').textContent = recipe.healthScore;

            // Gestione emoji
            const dietaryContainer = document.getElementById('recipeDietary');
            dietaryContainer.innerHTML = ''; // Pulisce il contenitore

            // Funzione per creare i "badge" con un po' di stile
            function createBadge(emoji, text) {
                const span = document.createElement('span');
                // Stile simile ai tuoi bottoni dei filtri
                span.style.backgroundColor = '#f1f8f5'; 
                span.style.color = 'var(--primary-green)';
                span.style.padding = '4px 12px';
                span.style.borderRadius = '20px';
                span.style.fontSize = '0.9rem';
                span.style.fontWeight = 'bold';
                span.innerHTML = `${emoji} ${text}`;
                return span;
            }

            // Controlla i booleani di Spoonacular e aggiunge il badge se è "true"
            if (recipe.glutenFree) {
                dietaryContainer.appendChild(createBadge('🌾', 'Gluten-Free'));
            }
            if (recipe.dairyFree) {
                dietaryContainer.appendChild(createBadge('🥛', 'Dairy-Free'));
            }
            if (recipe.vegetarian) {
                dietaryContainer.appendChild(createBadge('🥚', 'Vegetarian'));
            }
            if (recipe.vegan) {
                dietaryContainer.appendChild(createBadge('🌿', 'Vegan'));
            }
            
            // Inserisce il testo HTML di riepilogo
            document.getElementById('recipeSummary').innerHTML = recipe.summary;

            // Crea la lista degli ingredienti con un ciclo
            const ingredientsUl = document.getElementById('recipeIngredients');
            ingredientsUl.innerHTML = ''; // Assicuriamoci di pulire la lista prima
            
            if (recipe.extendedIngredients && recipe.extendedIngredients.length > 0) {
                recipe.extendedIngredients.forEach(ing => {
                    const li = document.createElement('li');
                    li.textContent = ing.original;
                    ingredientsUl.appendChild(li);
                });
            } else {
                ingredientsUl.innerHTML = '<li>Nessun ingrediente trovato.</li>';
            }

            // POPOLA I PASSAGGI DELLA RICETTA (INSTRUCTIONS)
            const stepsOl = document.getElementById('recipeSteps');
            stepsOl.innerHTML = ''; // Assicurati che sia vuota

            // Controlliamo se Spoonacular ci ha fornito le istruzioni divise a step (formato moderno)
            if (recipe.analyzedInstructions && recipe.analyzedInstructions.length > 0) {
                const steps = recipe.analyzedInstructions[0].steps;
                
                steps.forEach(stepObj => {
                    const li = document.createElement('li');
                    li.style.marginBottom = '12px'; // Dà un po' di spazio tra uno step e l'altro
                    li.textContent = stepObj.step;
                    stepsOl.appendChild(li);
                });
            } 
            // Fallback: se non ci sono gli step separati ma c'è un blocco di testo unico (formato vecchio)
            else if (recipe.instructions) {
                const li = document.createElement('li');
                li.innerHTML = recipe.instructions; 
                stepsOl.appendChild(li);
            } 
            // Se la ricetta non ha proprio istruzioni
            else {
                stepsOl.innerHTML = '<li>Nessuna istruzione disponibile per questa ricetta.</li>';
            }

        } else {
            document.getElementById('loadingMsg').textContent = "Error loading recipe details.";
        }
    } catch (error) {
        console.error("Errore:", error);
        document.getElementById('loadingMsg').textContent = "Connection error.";
    }
}