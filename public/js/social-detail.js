document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const recipeId = urlParams.get('id');

    if (!recipeId) {
        alert("Recipe ID missing");
        return;
    }

    try {
        const res = await fetch(`http://127.0.0.1:3000/api/social/recipe/${recipeId}`, { 
            credentials: 'include' 
        });
        
        if (!res.ok) throw new Error("Post not found");
        const recipe = await res.json();
        const commentInput = document.getElementById('comment-text');

        if (commentInput) {
            commentInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault(); 
                    postComment();
                }
            });
        }
        const myId = sessionStorage.getItem('userId');
        const likeBtn = document.getElementById('det-like-btn');

        if (recipe.likes && recipe.likes.includes(myId)) {
            likeBtn.classList.add('active'); 
        }
        likeBtn.querySelector('span').textContent = recipe.likes.length;

        // visualizzazione commenti
        renderComments(recipe.comments);
        
        const isMine = myId && recipe.author._id === myId;

        if (isMine) {
            const delContainer = document.getElementById('det-delete-container');
            delContainer.innerHTML = `<button class="btn-delete" onclick="deleteRecipeDetail('${recipe._id}')">Delete Post</button>`;
        }

        document.getElementById('det-title').textContent = recipe.title;
        document.getElementById('det-author').textContent = `By @${recipe.author.username}`;
        document.getElementById('det-image').src = `http://127.0.0.1:3000${recipe.image}`;

        // ingredienti
        const ingContainer = document.getElementById('det-ingredients');
        if (recipe.ingredients && recipe.ingredients.length > 0) {
            ingContainer.innerHTML = recipe.ingredients
                .map(ing => `<span class="tag">${ing}</span>`)
                .join('');
        } else {
            ingContainer.innerHTML = '<p style="color:var(--gray-medium)">No ingredients listed.</p>';
        }

        // descrizione
        const descEl = document.getElementById('det-description');
        if (descEl) {
            descEl.textContent = recipe.description || '';
        }
        
        if (likeBtn) {
            likeBtn.onclick = function() { toggleLike(recipe._id, this); }; 
        }

    } catch (err) {
        console.error(err);
        document.querySelector('.main-content').innerHTML = "<h2>Error loading post.</h2>";
    }
});

// per cancellare un post ricetta
async function deleteRecipeDetail(id) {
    if (!confirm("Delete this post?")) return;
    const res = await fetch(`http://127.0.0.1:3000/api/social/recipe/${id}`, { 
        method: 'DELETE', 
        credentials: 'include' 
    });
    if (res.ok) {
        alert("Deleted!");
        window.location.href = "./profile.html"; 
    }
};

function renderComments(comments) {
    const container = document.getElementById('comments-list');
    const myId = sessionStorage.getItem('userId'); 
    const recipeId = new URLSearchParams(window.location.search).get('id');
    
    container.innerHTML = ""; 

    if (!comments || comments.length === 0) {
        container.innerHTML = "<p>No comments yet.</p>";
        return;
    }

    comments.forEach(c => {
        const div = document.createElement('div');
        div.className = 'comment-item';
        
        const commentUserId = (c.user && c.user._id) ? c.user._id : c.user; 
        const isMine = myId && commentUserId.toString() === myId.toString();

        div.innerHTML = `
            <div class="comment-main">
                <strong>@${c.user.username || 'user'}</strong>
                <p>${c.text}</p>
            </div>
            ${isMine ? `<button class="delete-comment-btn" onclick="deleteComment('${recipeId}', '${c._id}')">🗑️</button>` : ''}
        `;
        container.appendChild(div);
    });
}

// per aggiungere un commento ad un post
async function postComment() {
    const input = document.getElementById('comment-text'); 
    if (!input) return;
    const text = input.value.trim(); 
    if (!text) return;

    const id = new URLSearchParams(window.location.search).get('id');
    
    try {
        const res = await fetch(`http://127.0.0.1:3000/api/social/recipe/${id}/comment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
            credentials: 'include'
        });    

        if (res.ok) {
            const updatedComments = await res.json();
            renderComments(updatedComments);
            input.value = "";
        }
    } catch (e) { console.error(e); }
}

// per eliminare il commento di un post (solo se è il proprio commento)
async function deleteComment(recipeId, commentId) {
    if (!confirm("Delete this comment?")) return;
    const res = await fetch(`http://127.0.0.1:3000/api/social/recipe/${recipeId}/comment/${commentId}`, {
        method: 'DELETE',
        credentials: 'include'
    });
    if (res.ok) {
        location.reload(); 
    }
}