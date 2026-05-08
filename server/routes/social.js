// gestione azioni social
const express = require('express');
const router  = express.Router();
const User = require('../models/user');
const Recipe  = require('../models/recipe');
const auth    = require('../middleware/authMiddleware');

// GET /api/social/feed - recupera tutte le ricette
router.get('/feed', auth, async (req, res) => {
    try {
        const recipes = await Recipe.find()
            .populate('author', 'username avatarEmoji')
            .sort({createdAt:-1});
        res.json(recipes);
    } catch (err) {
        console.error('GET /social/feed:', err);
        res.status(500).send('Server error');
    }
});

// POST /api/social/like:id - aggiunge/toglie like
router.post('/like/:id', auth, async (req, res) => {
    try {
        const targetRecipe = (await Recipe.findById(req.params.id));
        const userId = req.session.userId;

        if (!targetRecipe) return res.status(404).send('Recipe not found');    

        // se c'è già like, viene tolto
        if (targetRecipe.likes.includes(userId)) {
            targetRecipe.likes = targetRecipe.likes.filter(id => id.toString() !== userId.toString());
        } else {    // viene aggiunto like
            targetRecipe.likes.push(userId);
        }

        await targetRecipe.save();
        res.json({likesCount: targetRecipe.likes.length});
    } catch (err) {
        console.error('POST /social/like/:id:', err);
        res.status(500).send('Server error');
    }
});

// funzione di ricerca
// GET /api/social/search
router.get('/search', auth, async (req, res) => {
    try {
        const query = req.query.q;
        const apiKey = process.env.FOOD_API_KEY;

        const me = await User.findById(req.session.userId); // dati miei per vedere ch seguo
        
        const localUsers = await User.find({ 
            username: { $regex: query, $options: 'i' },
            _id: { $ne: req.session.userId }
        }).select('username avatarEmoji bio');

        const myStarred = me.starredCreators.map(id => id.toString());

        const users = localUsers.map(us => {
            const userObj = us.toObject();
            userObj.isStarred = myStarred.includes(us._id.toString());
            return userObj;            
        });

        /* ho commentato un attimo per non usare punti api. scommentare quando si vogliono cercare ricette community

        const localRecipes = await Recipe.find({ title: { $regex: query, $options: 'i' } }).populate('author', 'username');
        const spoonRes = await fetch(`https://api.spoonacular.com/recipes/complexSearch?query=${query}&number=5&apiKey=${apiKey}`);
        const spoonData = await spoonRes.json();
        */

        // commentare quando si vogliono cercare ricette community
        let localRecipes = [];
        let spoonData = { results: [] };

        res.json({
            community: { users: users, recipes: localRecipes },
            global: spoonData.results
        });
    } catch (err) {
        console.error('GET /social/search:', err);
        res.status(500).send("Search error");
    }
});

// POST /api/social/star/:id - aggiunge/toglie stella ai creator
router.post('/star/:id', auth, async (req, res) => {
    try {
        const me = await User.findById(req.session.userId);
        const targetId = req.params.id;

        if (targetId == req.session.userId.toString()) {
            return res.status(400).send('You cannot star yourself!');
        }

        const index = me.starredCreators.map(id => id.toString()).indexOf(targetId);
        
        if (index > -1) {
            me.starredCreators.splice(index, 1); // toglie stella
        } else {
            me.starredCreators.push(targetId); // aggiunge stella
        }
        await me.save();
        res.json({ isStarred: index === -1 });
    } catch (err) { 
        console.error('POST /social/star/:id:', err);
        res.status(500).send("Error"); 
    }
});

module.exports = router;