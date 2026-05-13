window.API_BASE_URL = `http://${window.location.hostname}:3000`;

async function toggleLikeDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    const btn = document.getElementById('det-like-btn');

    try {
        const res = await fetch(`${API_BASE_URL}/api/social/like/${id}`, {
            method: 'POST',
            credentials: 'include'
        });

        if (res.ok) {
            const data = await res.json();
            btn.querySelector('span').textContent = data.likesCount;
            btn.classList.toggle('active');
        }
    } catch (err) {
        console.error("Like error:", err);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const recipeId = urlParams.get('id');

    if (!recipeId) {
        alert("Recipe ID missing");
        return;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/api/social/recipe/${recipeId}`, { 
            credentials: 'include' 
        });
        
        if (!res.ok) throw new Error("Post not found");
        const recipe = await res.json();
        
        const myId = sessionStorage.getItem('userId');
        const isMine = myId && recipe.author._id === myId;

        if (isMine) {
            const delContainer = document.getElementById('det-delete-container');
            delContainer.innerHTML = `<button class="btn-delete" onclick="deleteRecipeDetail('${recipe._id}')">Delete Post</button>`;
        }

        document.getElementById('det-title').textContent = recipe.title;
        document.getElementById('det-author').textContent = `By @${recipe.author.username}`;
        document.getElementById('det-image').src = `${API_BASE_URL}${recipe.image}`;
        document.getElementById('det-like-btn').querySelector('span').textContent = recipe.likes.length;

        const ingContainer = document.getElementById('det-ingredients');
        recipe.ingredients.forEach(ing => {
            const span = document.createElement('span');
            span.className = 'tag'; 
            span.textContent = ing;
            ingContainer.appendChild(span);
        });
        
        const likeBtn = document.getElementById('det-like-btn');
        if (likeBtn) {
            likeBtn.onclick = toggleLikeDetail; 
        }

    } catch (err) {
        console.error(err);
        document.querySelector('.main-content').innerHTML = "<h2>Error loading post.</h2>";
    }
});

// per cancellare un post ricetta
async function deleteRecipeDetail(id) {
    if (!confirm("Delete this post?")) return;
    const res = await fetch(`${API_BASE_URL}/api/social/recipe/${id}`, { 
        method: 'DELETE', 
        credentials: 'include' 
    });
    if (res.ok) {
        alert("Deleted!");
        window.location.href = "./profile"; 
    }
};