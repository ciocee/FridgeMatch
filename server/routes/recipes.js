const express = require('express');
const router = express.Router();

const FridgeItem = require('../models/fridge');
const RecipeCache = require('../models/recipeCache');
const GlobalSearchCache = require('../models/globalSearchCache'); // <-- Nuovo modello
const auth = require('../middleware/authMiddleware');

const apiKey = process.env.FOOD_API_KEY;

// carica ricette per la dashboard usando la cache
router.get('/replicable', auth, async (req, res) => {
    try {
        const items = await FridgeItem.find({ user: req.session.userId });

        if (!items || items.length === 0) {
            return res.status(200).json([]); 
        }

        const sortedIngredients = [...new Set(items.map(i => i.name.toLowerCase().trim()))].sort();
        const ingredientsKey = sortedIngredients.join(',');

        const cachedResults = await GlobalSearchCache.findOne({ ingredientsKey: ingredientsKey });

        if (cachedResults) {
            console.log(`INGREDIENTI CACHE - Risultati trovati per: [${ingredientsKey}]`);
            return res.status(200).json(cachedResults.results);
        }

        const ingredientsParam = sortedIngredients.map(name => name.replace(/\s+/g, '+')).join(',+');
        
        const limit = req.query.limit || 4; // default: 4 ricette per la dashboard
        const spoonacularUrl = `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${ingredientsParam}&number=${limit}&apiKey=${apiKey}`;
        
        console.log("INGREDIENTI CACHE - Chiamata a Spoonacular...");
        const response = await fetch(spoonacularUrl);

        const quotaRequest = response.headers.get('x-api-quota-request');
        const quotaUsed = response.headers.get('x-api-quota-used');
        const quotaLeft = response.headers.get('x-api-quota-left');
        console.log(`API SPOONACULAR - Ricerca ricette per: [${ingredientsKey}] - Costo: ${quotaRequest} - Punti usati: ${quotaUsed} / Rimanenti: ${quotaLeft}`);
        
        if (!response.ok) {
            return res.status(response.status).json({ message: "Errore di comunicazione con Spoonacular" });
        }

        const data = await response.json();

        try {
            const newCache = new GlobalSearchCache({
                ingredientsKey: ingredientsKey,
                results: data
            });
            await newCache.save();
            console.log(`INGREDIENTI CACHE - Nuova combinazione salvata: [${ingredientsKey}]`);
        } catch (saveError) {
            console.log("Nota: Cache già presente o errore di salvataggio concorrente.");
        }
        
        res.status(200).json(data);

    } catch (error) {
        console.error("Errore nel fetch delle ricette:", error);
        res.status(500).json({ message: "Errore interno del server" });
    }
});

// carica ricette replicable nella pagina dedicata usando la Cache e complexSearch
router.get('/replicable-extended', auth, async (req, res) => {
    try {
        const items = await FridgeItem.find({ user: req.session.userId });

        if (!items || items.length === 0) {
            return res.status(200).json([]); 
        }

        const sortedIngredients = [...new Set(items.map(i => i.name.toLowerCase().trim()))].sort();
        const ingredientsParam = sortedIngredients.map(name => name.replace(/\s+/g, '+')).join(',+');
        
        const limit = req.query.limit || 20;
        const cacheKey = `extended_${sortedIngredients.join(',')}_limit_${limit}`;

        // 1. CONTROLLO CACHE
        const cachedResults = await GlobalSearchCache.findOne({ ingredientsKey: cacheKey });
        if (cachedResults) {
            console.log(`CACHE (Extended) - Risultati trovati per: [${cacheKey}]`);
            return res.status(200).json(cachedResults.results);
        }

        // 2. LA CHIAMATA "MAGICA" AL COMPLEX SEARCH
        // Usiamo includeIngredients, ordiniamo per max-used-ingredients e aggiungiamo addRecipeInformation e fillIngredients
        const spoonacularUrl = `https://api.spoonacular.com/recipes/complexSearch?includeIngredients=${ingredientsParam}&sort=max-used-ingredients&fillIngredients=true&addRecipeInformation=true&number=${limit}&apiKey=${apiKey}`;
        
        const response = await fetch(spoonacularUrl);

        const quotaRequest = response.headers.get('x-api-quota-request');
        const quotaUsed = response.headers.get('x-api-quota-used');
        const quotaLeft = response.headers.get('x-api-quota-left');
        console.log(`API SPOONACULAR - Ricerca Extended (complexSearch) - Costo: ${quotaRequest} - Punti usati: ${quotaUsed} / Rimanenti: ${quotaLeft}`);
        
        if (!response.ok) {
            return res.status(response.status).json({ message: "Errore di comunicazione con Spoonacular" });
        }

        const rawData = await response.json();
        const results = rawData.results || [];

        // 3. FORMATTIAMO I DATI PER IL TUO FRONTEND
        // Il tuo frontend si aspetta un array piatto, quindi lo estraiamo da rawData.results
        const enrichedData = results.map(recipe => ({
            id: recipe.id,
            title: recipe.title,
            image: recipe.image,
            usedIngredientCount: recipe.usedIngredientCount || 0,
            missedIngredientCount: recipe.missedIngredientCount || 0,
            // Ecco le tue info sulle diete, arrivate gratis!
            glutenFree: recipe.glutenFree || false,
            dairyFree: recipe.dairyFree || false,
            vegetarian: recipe.vegetarian || false,
            vegan: recipe.vegan || false,
            healthScore: recipe.healthScore || 0,
            readyInMinutes: recipe.readyInMinutes || 0
        }));

        // 4. SALVATAGGIO IN CACHE
        try {
            const newCache = new GlobalSearchCache({
                ingredientsKey: cacheKey,
                results: enrichedData
            });
            await newCache.save();
        } catch (saveError) {
            console.log("Nota: Cache già presente o errore di salvataggio.");
        }

        // 5. INVIO AL FRONTEND
        res.status(200).json(enrichedData);

    } catch (error) {
        console.error("Errore nel fetch delle ricette extended:", error);
        res.status(500).json({ message: "Errore interno del server" });
    }
});

router.get('/recipe/:id', auth, async (req, res) => {
    try {
        const recipeId = Number(req.params.id);
        
        const cachedRecipe = await RecipeCache.findOne({ id: recipeId });

        if (cachedRecipe) {
            console.log(`DB CACHE - Trovata ricetta salvata per ID: ${recipeId}`);
            return res.status(200).json(cachedRecipe);
        }

        const spoonacularUrl = `https://api.spoonacular.com/recipes/${recipeId}/information?includeNutrition=true&apiKey=${apiKey}`;
        console.log(`API SPOONACULAR - Ricerca dettagli per ID: ${recipeId} (Non presente in Cache)`);

        const response = await fetch(spoonacularUrl);
        
        const quotaRequest = response.headers.get('x-api-quota-request');
        const quotaUsed = response.headers.get('x-api-quota-used');
        const quotaLeft = response.headers.get('x-api-quota-left');
        console.log(`API SPOONACULAR - Costo: ${quotaRequest} - Punti usati: ${quotaUsed} / Rimanenti: ${quotaLeft}`);

        if (!response.ok) {
            return res.status(response.status).json({ message: "Errore API Spoonacular" });
        }

        const data = await response.json();

        // Funzione helper per estrarre i macronutrienti
        const getNutrient = (name) => {
            if (!data.nutrition || !data.nutrition.nutrients) return "N/A";
            const nut = data.nutrition.nutrients.find(n => n.name === name);
            return nut ? `${Math.round(nut.amount)}${nut.unit}` : "N/A";
        };

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
            
            macros: {
                calories: getNutrient('Calories'),
                protein: getNutrient('Protein'),
                carbs: getNutrient('Carbohydrates'),
                fat: getNutrient('Fat')
            },
            
            analyzedInstructions: data.analyzedInstructions ? data.analyzedInstructions.map(instructionBlock => ({
                name: instructionBlock.name,
                steps: instructionBlock.steps.map(step => ({
                    number: step.number,
                    step: step.step
                }))
            })) : []
        };

        const newCachedRecipe = new RecipeCache(recipeDataToSave);
        await newCachedRecipe.save();
        console.log(`RICETTE CACHE - Nuova ricetta salvata nel db per ID: ${recipeId}`);

        res.status(200).json(recipeDataToSave);

    } catch (error) {
        console.error("Errore dettagli ricetta:", error);
        res.status(500).json({ message: "Errore interno del server" });
    }
});

module.exports = router;