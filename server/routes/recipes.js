const express = require('express');
const router = express.Router();

// 1. Importiamo il modello del frigo e il middleware di autenticazione
const FridgeItem = require('../models/fridge');
const auth = require('../middleware/authMiddleware');

const apiKey = process.env.FOOD_API_KEY;

// 2. Aggiungiamo 'auth' per assicurarci di avere req.session.userId
router.get('/replicable', auth, async (req, res) => {
    try {
        
        // 3. Cerchiamo gli ingredienti dell'utente loggato nel database
        const items = await FridgeItem.find({ user: req.session.userId });

        // Se il frigo è vuoto, restituiamo un array vuoto (nessuna ricetta)
        if (!items || items.length === 0) {
            return res.status(200).json([]); 
        }

        // 4. Estraiamo solo i nomi degli ingredienti e li prepariamo per Spoonacular.
    
        const ingredientsList = items
            .map(item => item.name.trim().replace(/\s+/g, '+')) 
            .join(',+'); 
        
        const spoonacularUrl = `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${ingredientsList}&number=4&apiKey=${apiKey}`;
        console.log(`API SPOONACULAR - Ricerca ricette per: ${ingredientsList}`);

        const response = await fetch(spoonacularUrl);
        
        if (!response.ok) {
            return res.status(response.status).json({ message: "Errore di comunicazione con Spoonacular" });
        }

        const data = await response.json();
        
        res.status(200).json(data);

    } catch (error) {
        console.error("Errore nel fetch delle ricette:", error);
        res.status(500).json({ message: "Errore interno del server" });
    }
});

router.get('/recipe/:id', auth, async (req, res) => {
    try {
        const recipeId = req.params.id;
        
        const spoonacularUrl = `https://api.spoonacular.com/recipes/${recipeId}/information?includeNutrition=false&apiKey=${apiKey}`;
        console.log(`API SPOONACULAR - Ricerca dettagli per ID: ${recipeId}`);

        const response = await fetch(spoonacularUrl);
        
        if (!response.ok) {
            return res.status(response.status).json({ message: "Errore API Spoonacular" });
        }

        const data = await response.json();
        res.status(200).json(data);

    } catch (error) {
        console.error("Errore dettagli ricetta:", error);
        res.status(500).json({ message: "Errore interno del server" });
    }
});

module.exports = router;