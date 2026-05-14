const selectedIngredients = [];

document.addEventListener('DOMContentLoaded', async() => {
    const ingredients = await loadFridgeData();
    const container = document.getElementById('fridge-checklist-container');

    if (!container) return;

    if (ingredients && ingredients.length > 0) {
       container.innerHTML = ingredients.map(item => `
            <div class="checkbox-item">
                <input type="checkbox" value="${item.name}" id="check-${item._id}" 
                       onchange="handleCheckChange(this)">
                <label for="check-${item._id}">${item.name}</label>
            </div>
        `).join(''); 
    } else {
        container.innerHTML = "<p class='loading-msg'>Your fridge is empty.</p>";        
    }

    const imgInput = document.getElementById('recipe-img');
    if (imgInput) {
        imgInput.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                const freader = new FileReader();
                freader.onload = (e) => {
                    document.getElementById('image-preview').src = e.target.result;
                    document.getElementById('image-preview').classList.remove('hidden');
                    document.getElementById('preview-placeholder').classList.add('hidden');
                };                
                freader.readAsDataURL(file);
            }        
        });
    }

    // gestione aggiunta manuale ingredienti
    const manualInput = document.getElementById('ingredient-input-manual');
    if (manualInput) {
        manualInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); 
                                
                const item = manualInput.value.trim();
                if (item && !selectedIngredients.includes(item)) {
                    selectedIngredients.push(item);
                    renderIngredientTags();
                    manualInput.value = "";
                }
            }
        });
    }

    // invio form
    const uploadForm = document.getElementById('upload-recipe-form');
    if (uploadForm) {
        uploadForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            formData.delete('ingredients'); 
            formData.append('ingredients', JSON.stringify(selectedIngredients));

            try {
                const res = await fetch('http://127.0.0.1:3000/api/social/upload-recipe', {
                    method: 'POST',
                    body: formData,
                    credentials: 'include'
                }); 

                if (res.ok) {
                    alert("Recipe shared with the community!");
                    location.href = "../social"; 
                }
            } catch (err) {
                console.error("Errore invio:", err);
            }
        });
    }
});

function renderIngredientTags() {
    const container = document.getElementById('selected-ingredients-tags');
    if (!container) return;

    container.innerHTML = selectedIngredients.map(ing => `
        <span class="tag">
            ${ing} 
            <small onclick="removeTag('${ing}')" style="cursor:pointer; margin-left:8px;">✕</small>
        </span>
    `).join('');
}

// fa funzionare la 'x' nei tag degli ingredienti
function removeTag(name) {
    const index = selectedIngredients.indexOf(name);
    if (index > -1) {
        selectedIngredients.splice(index, 1);
        
        const cb = Array.from(document.querySelectorAll('.checkbox-item input'))
                        .find(i => i.value === name);
        if (cb) cb.checked = false;
        
        renderIngredientTags();
    }
}
window.removeTag = removeTag; 

// funzione per l'aggiunta/rimozione ingredienti mentre si sta pubblicando la ricetta
function handleCheckChange(checkbox) {
    if (checkbox.checked) {
        if (!selectedIngredients.includes(checkbox.value)) {
            selectedIngredients.push(checkbox.value);
        }
    } else {
        const index = selectedIngredients.indexOf(checkbox.value);
        if (index > -1) selectedIngredients.splice(index, 1);
    }
    renderIngredientTags(); 
}