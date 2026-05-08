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

// funzione di ricerca
// GET /api/social/search
router.get('/search', auth, async (req, res) => {
    try {
        const query = req.query.q;
        const apiKey = process.env.SPOONACULAR_API_KEY;
        const localUsers = await User.find({ username: { $regex: query, $options: 'i' } });
        const localRecipes = await Recipe.find({ title: { $regex: query, $options: 'i' } }).populate('author');
        const spoonRes = await fetch(`https://api.spoonacular.com/recipes/complexSearch?query=${query}&number=5&apiKey=${apiKey}`);
        const spoonData = await spoonRes.json();
        res.json({
            community: { users: localUsers, recipes: localRecipes },
            global: spoonData.results
        });
    } catch (err) {
        res.status(500).send("Search error");
    }
});

router.post('/star/:id', auth, async (req, res) => {
    try {
        const me = await User.findById(req.session.userId);
        const targetId = req.params.id;
        const index = me.starredCreators.indexOf(targetId);
        if (index > -1) {
            me.starredCreators.splice(index, 1); // toglie
        } else {
            me.starredCreators.push(targetId); // aggiunge 
        }
        await me.save();
        res.json({ isStarred: index === -1 });
    } catch (err) { res.status(500).send("Error"); }
});

module.exports = router;