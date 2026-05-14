const express = require('express');
const router = express.Router();

const FridgeItem = require('../models/fridge');
const RecipeCache = require('../models/recipeCache');
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
        
        const recipeId = Number(req.params.id);
        
        // 1. CERCA LA RICETTA NEL DATABASE MONGODB
        const cachedRecipe = await RecipeCache.findOne({ id: recipeId });

        if (cachedRecipe) {
            console.log(`DB CACHE - Trovata ricetta salvata per ID: ${recipeId}`);
            return res.status(200).json(cachedRecipe);
        }

        // 2. SE NON ESISTE, CHIAMA L'API DI SPOONACULAR (includeNutrition=true)
        const spoonacularUrl = `https://api.spoonacular.com/recipes/${recipeId}/information?includeNutrition=true&apiKey=${apiKey}`;
        console.log(`API SPOONACULAR - Ricerca dettagli per ID: ${recipeId} (Non presente in Cache)`);

        const response = await fetch(spoonacularUrl);
        
        const quotaUsed = response.headers.get('x-api-quota-used');
        const quotaLeft = response.headers.get('x-api-quota-left');
        console.log(`API SPOONACULAR - Punti usati: ${quotaUsed} / Rimanenti: ${quotaLeft}`);

        if (!response.ok) {
            return res.status(response.status).json({ message: "Errore API Spoonacular" });
        }

        const data = await response.json();

        // --- Funzione helper per estrarre i macronutrienti in sicurezza ---
        const getNutrient = (name) => {
            if (!data.nutrition || !data.nutrition.nutrients) return "N/A";
            const nut = data.nutrition.nutrients.find(n => n.name === name);
            return nut ? `${Math.round(nut.amount)}${nut.unit}` : "N/A";
        };

        // 3. ESTRAI E PULISCI I DATI
        const recipeDataToSave = {
            id: data.id,
            title: data.title,
            image: data.image,
            readyInMinutes: data.readyInMinutes,
            servings: data.servings,
            healthScore: data.healthScore,
    
            glutenFree: data.glutenFree || false,
            dairyFree: data.dairyFree || false,
            vegetarian: data.vegetarian || false,
            vegan: data.vegan || false,

            extendedIngredients: data.extendedIngredients ? data.extendedIngredients.map(ing => ({
                id: ing.id,
                name: ing.name,
                original: ing.original
            })) : [],
            
            //MACRO
            macros: {
                calories: getNutrient('Calories'),
                protein: getNutrient('Protein'),
                carbs: getNutrient('Carbohydrates'),
                fat: getNutrient('Fat')
            },
            
            // Salviamo solo i passaggi testuali delle istruzioni
            analyzedInstructions: data.analyzedInstructions ? data.analyzedInstructions.map(instructionBlock => ({
                name: instructionBlock.name,
                steps: instructionBlock.steps.map(step => ({
                    number: step.number,
                    step: step.step
                }))
            })) : []
        };

        // 4. SALVA LA RICETTA NEL DATABASE MONGODB
        const newCachedRecipe = new RecipeCache(recipeDataToSave);
        await newCachedRecipe.save();
        console.log(`DB CACHE - Nuova ricetta salvata nel db per ID: ${recipeId}`);

        // 5. INVIA I DATI AL FRONTEND
        res.status(200).json(recipeDataToSave);

    } catch (error) {
        console.error("Errore dettagli ricetta:", error);
        res.status(500).json({ message: "Errore interno del server" });
    }
});

module.exports = router;