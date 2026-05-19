const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware'); 

// GET /api/explore/search - Ricerca Globale Spoonacular (Solo Ricette via complexSearch)
router.get('/search', auth, async (req, res) => {
    try {
        const query = req.query.q;
        const apiKey = process.env.FOOD_API_KEY;

        // Nuovo endpoint: complexSearch! (Chiediamo 12 risultati per riempire bene la griglia)
        const spoonacularUrl = `https://api.spoonacular.com/recipes/complexSearch?query=${query}&number=12&apiKey=${apiKey}`;
        console.log(`API SPOONACULAR - Ricerca per "${query}" (complexSearch)`);

        const response = await fetch(spoonacularUrl);
        
        // RECUPERO E LOG DEI COSTI/QUOTA
        const quotaUsed = response.headers.get('x-api-quota-used');
        const quotaLeft = response.headers.get('x-api-quota-left');
        console.log(`API SPOONACULAR - Punti usati: ${quotaUsed} / Rimanenti: ${quotaLeft}`);

        // Gestione errori pulita
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`API SPOONACULAR DETTAGLI ERRORE:`, errorText);
            return res.status(response.status).json({ 
                message: "Errore API Spoonacular", 
                details: errorText 
            });
        }

        const data = await response.json();

        // complexSearch restituisce le ricette nell'array "results".
        // Rinominiamo 'title' in 'name' così il nostro file js/explore.js 
        // non si accorge di nulla e continua a funzionare perfettamente!
        const globalRecipes = (data.results || []).map(recipe => ({
            id: recipe.id,
            name: recipe.title, 
            image: recipe.image
        }));

        res.json({ 
            recipes: globalRecipes
        });
        
    } catch (err) {
        console.error('GET /explore/search error:', err);
        res.status(500).send("Search error");
    }
});

module.exports = router;