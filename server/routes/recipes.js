const express = require('express');
const router = express.Router();

const FridgeItem = require('../models/fridge');
const auth = require('../middleware/authMiddleware');

const apiKey = process.env.FOOD_API_KEY;

router.get('/replicable', auth, async (req, res) => {
    try {
        
        const items = await FridgeItem.find({ user: req.session.userId });

        if (!items || items.length === 0) {
            return res.status(200).json([]); 
        }

        const ingredientsList = items
            .map(item => item.name.trim().replace(/\s+/g, '+')) 
            .join(',+'); 
        
        const spoonacularUrl = `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${ingredientsList}&number=4&apiKey=${apiKey}`;
        console.log(`API SPOONACULAR - Ricerca ricette per: ${ingredientsList}`);

        const response = await fetch(spoonacularUrl);

        const quotaUsed = response.headers.get('x-api-quota-used');
        const quotaLeft = response.headers.get('x-api-quota-left');
        console.log(`API SPOONACULAR - Punti usati: ${quotaUsed} / Rimanenti: ${quotaLeft}`);
        
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