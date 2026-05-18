const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/authMiddleware');
const Favourite = require('../models/favourite');

/* ─────────────────────────────────────────
   GET /api/favourites
   Restituisce tutte le ricette preferite dell'utente
───────────────────────────────────────── */
router.get('/', auth, async (req, res) => {
    try {
        const favs = await Favourite.find({ user: req.session.userId }).sort({ addedAt: -1 });
        res.json(favs);
    } catch (err) {
        console.error('GET /api/favourites:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

/* ─────────────────────────────────────────
   GET /api/favourites/check/:recipeId
   Controlla se una ricetta è già nei preferiti
───────────────────────────────────────── */
router.get('/check/:recipeId', auth, async (req, res) => {
    try {
        const exists = await Favourite.findOne({
            user: req.session.userId,
            recipeId: req.params.recipeId
        });
        res.json({ isFavourite: !!exists });
    } catch (err) {
        console.error('GET /api/favourites/check:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

/*  Aggiunge una ricetta ai preferiti (con snapshot dati)*/
router.post('/:recipeId', auth, async (req, res) => {
    try {
        const { recipeId } = req.params;
        // I dati della ricetta arrivano nel body (snapshot)
        const { title, image, readyInMinutes, servings, glutenFree, dairyFree, vegetarian, vegan, macros } = req.body;

        const newFav = new Favourite({
            user: req.session.userId,
            recipeId,
            title,
            image,
            readyInMinutes,
            servings,
            glutenFree,
            dairyFree,
            vegetarian,
            vegan,
            macros
        });

        await newFav.save();
        res.status(201).json({ success: true });
    } catch (err) {
        if (err.code === 11000) {
            // Duplicato: già nei preferiti
            return res.status(409).json({ message: 'Already in favourites' });
        }
        console.error('POST /api/favourites:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

/*Rimuove una ricetta dai preferiti */
router.delete('/:recipeId', auth, async (req, res) => {
    try {
        await Favourite.findOneAndDelete({
            user: req.session.userId,
            recipeId: req.params.recipeId
        });
        res.json({ success: true });
    } catch (err) {
        console.error('DELETE /api/favourites:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;