// gestione azioni social
const express = require('express');
const router  = express.Router();
const Recipe  = require('../models/recipe');
const auth    = require('../middleware/authMiddleware');
const recipe = require('../models/recipe');

// GET /api/social/feed - recupera tutte le ricette
router.get('/feed', auth, async (req, res) => {
    try {
        const recipes = (await Recipe.find().populate('author', 'username', 'avatarEmojii')).sort({createdAt:-1});
        res.json(recipes);
    } catch (err) {
        console.error('GET /social/feed:', err);
        res.status(500).send('Server error');
    }
});

// POST /api/social/like:id - aggiunge/toglie like
router.post('/like:id', auth, async (req, res) => {
    try {
        const recipes = (await Recipe.findById(req.params.id));
        const userId = req.session.userId;

        // se c'è già like, viene tolto
        if (recipe.likes.includes(userId)) {
            recipe.likes = recipe.likes.filter(id => id.toString() !== userId.toString());
        } else {    // viene aggiunto like
            recipe.likes.push(userId);
        }

        await recipe.save();
        res.json({likesCount: recipe.likes.length});
    } catch (err) {
        console.error('POST /social/like:id', err);
        res.status(500).send('Server error');
    }
});

module.exports = router;