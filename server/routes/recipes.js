const express = require('express');
const router = express.Router();

const FridgeItem = require('../models/fridge');
const RecipeCache = require('../models/recipeCache');
const GlobalSearchCache = require('../models/globalSearchCache'); // <-- Nuovo modello
const auth = require('../middleware/authMiddleware');

const apiKey = process.env.FOOD_API_KEY;

// --- ROTTA REPLICABLE: Con Global Search Cache ---
router.get('/replicable', auth, async (req, res) => {
    try {
        const items = await FridgeItem.find({ user: req.session.userId });

        if (!items || items.length === 0) {
            return res.status(200).json([]); 
        }

        // 1. CREAZIONE CHIAVE NORMALIZZATA
        const sortedIngredients = [...new Set(items.map(i => i.name.toLowerCase().trim()))].sort();
        const ingredientsKey = sortedIngredients.join(',');

        // 2. CONTROLLO CACHE GLOBALE
        const cachedResults = await GlobalSearchCache.findOne({ ingredientsKey: ingredientsKey });

        if (cachedResults) {
            console.log(`GLOBAL CACHE - Risultati trovati per: [${ingredientsKey}]`);
            return res.status(200).json(cachedResults.results);
        }

        // 3. SE NON TROVATA, CHIAMATA API
        const ingredientsParam = sortedIngredients.map(name => name.replace(/\s+/g, '+')).join(',+');
        const limit = req.query.limit || 4; // default: 4 ricette per la dashboard
        const spoonacularUrl = `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${ingredientsParam}&number=${limit}&apiKey=${apiKey}`;
        
        console.log("GLOBAL CACHE - Chiamata a Spoonacular...");
        const response = await fetch(spoonacularUrl);

        const quotaUsed = response.headers.get('x-api-quota-used');
        const quotaLeft = response.headers.get('x-api-quota-left');
        console.log(`API SPOONACULAR - Ricerca ricette per: [${ingredientsKey}] - Punti usati: ${quotaUsed} / Rimanenti: ${quotaLeft}`);
        
        if (!response.ok) {
            return res.status(response.status).json({ message: "Errore di comunicazione con Spoonacular" });
        }

        const data = await response.json();

        // 4. SALVATAGGIO NELLA CACHE GLOBALE
        try {
            const newCache = new GlobalSearchCache({
                ingredientsKey: ingredientsKey,
                results: data
            });
            await newCache.save();
            console.log(`GLOBAL CACHE - Nuova combinazione salvata: [${ingredientsKey}]`);
        } catch (saveError) {
            console.log("Nota: Cache già presente o errore di salvataggio concorrente.");
        }
        
        res.status(200).json(data);

    } catch (error) {
        console.error("Errore nel fetch delle ricette:", error);
        res.status(500).json({ message: "Errore interno del server" });
    }
});

// --- ROTTA RECIPE/:ID ---
router.get('/recipe/:id', auth, async (req, res) => {
    try {
        const recipeId = Number(req.params.id);
        
        // 1. CERCA LA RICETTA NEL DATABASE MONGODB
        const cachedRecipe = await RecipeCache.findOne({ id: recipeId });

        if (cachedRecipe) {
            console.log(`DB CACHE - Trovata ricetta salvata per ID: ${recipeId}`);
            return res.status(200).json(cachedRecipe);
        }

        // 2. SE NON ESISTE, CHIAMA L'API DI SPOONACULAR
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

        // Funzione helper per estrarre i macronutrienti
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

        // 4. SALVA LA RICETTA NEL DATABASE MONGODB
        const newCachedRecipe = new RecipeCache(recipeDataToSave);
        await newCachedRecipe.save();
        console.log(`DB CACHE - Nuova ricetta salvata nel db per ID: ${recipeId}`);

        res.status(200).json(recipeDataToSave);

    } catch (error) {
        console.error("Errore dettagli ricetta:", error);
        res.status(500).json({ message: "Errore interno del server" });
    }
});

module.exports = router;