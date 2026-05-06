// Apertura Modal
function openRecipeModal() {
    document.getElementById('recipeModal').classList.add('open');
}

// Chiusura Modal
function closeRecipeModal(event) {
    if (!event || event.target.id === 'recipeModal' || event.target.className === 'modal-close' || event.target.className === 'btn-cancel') {
        document.getElementById('recipeModal').classList.remove('open');
    }
}

// Gestione invio
document.getElementById('upload-recipe-form').addEventListener('submit', function(e) {
    e.preventDefault();
    alert("Recipe shared with the community!");
    closeRecipeModal();
});