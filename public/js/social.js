// gestione caricamento dinamico del feed e interazioni con i like

const API_URL = 'http://127.0.0.1:3000/api/social'; 

// caricamento feed
async function loadFeed() {
    const container = document.getElementById('recipe-feed');
    if (!container) return;

    try {
        const res = await fetch(`${API_URL}/feed`, {credentials: 'include'});
        const recipes = await res.json();
        container.innerHTML = "";

        recipes.array.forEach(recipe => {
            const article = document.createElement('article');
            article.className = 'recipe-card';
            article.innerHTML = `
                <img src="${recipe.image}" class="recipe-image">
                <div class="recipe-content">
                    <h3>${recipe.title}</h3>
                    <p>By @${recipe.author.username}</p>
                    <button class="like-btn" onclick="toggleLike('${recipe._id}', this)">
                        ❤️ <span>${recipe.likes.length}</span>
                    </button>
                </div>
            `;
            container.appendChild(article);            
        });
    } catch (err) {
        console.error("Feed error:", err);
    }
}

// funzione like
async function toggleLike(id, btn) {
    const res = await fetch(`${API_URL}/like:id`, {
        method: 'POST';
        credentials: 'include'
    });

    if (res.ok) {
        const data = await res.json();
        btn.querySelector('span').textContent = data.likesCount;
        btn.classList.toggle('active');
    }
}

document.addEventListener('DOMContentLoaded', loadFeed);