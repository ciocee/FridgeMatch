const express = require('express');
const router  = express.Router();
const User    = require('../models/user');
const Recipe  = require('../models/recipe');
const auth    = require('../middleware/authMiddleware');

const FOOD_EMOJIS = User.FOOD_EMOJIS;

// GET /api/profile/me
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId)
            .select('-password')
            .populate('starredCreators', 'username avatarEmoji bio');

        if (!user) return res.status(404).send('User not found');

        const recipes = await Recipe.find({ author: req.session.userId })
            .sort({ createdAt: -1 });

        res.json({ user, recipes });
    } catch (err) {
        console.error('GET /profile/me:', err);
        res.status(500).send('Server error');
    }
});

// GET /api/profile/:id — profilo pubblico
router.get('/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password -email')
            .populate('starredCreators', 'username avatarEmoji');

        if (!user) return res.status(404).send('User not found');

        const recipes = await Recipe.find({ author: req.params.id })
            .sort({ createdAt: -1 });

        const me = await User.findById(req.session.userId).select('starredCreators');
        const isStarred = me.starredCreators.map(id => id.toString()).includes(req.params.id);

        res.json({ user, recipes, isStarred });
    } catch (err) {
        console.error('GET /profile/:id:', err);
        res.status(500).send('Server error');
    }
});

// PATCH /api/profile/me — aggiorna bio e/o emoji
router.patch('/me', auth, async (req, res) => {
    try {
        const { bio, avatarEmoji } = req.body;

        const update = {};
        if (bio !== undefined) update.bio = bio;
        if (avatarEmoji && FOOD_EMOJIS.includes(avatarEmoji)) {
            update.avatarEmoji = avatarEmoji;
        }

        const user = await User.findByIdAndUpdate(
            req.session.userId,
            update,
            { returnDocument: 'after', select: '-password' }
        );

        res.json(user);
    } catch (err) {
        console.error('PATCH /profile/me:', err);
        res.status(500).send('Server error');
    }
});

// POST /api/profile/star/:id — stella/destella
router.post('/star/:id', auth, async (req, res) => {
    try {
        const targetId = req.params.id;

        if (targetId === req.session.userId.toString()) {
            return res.status(400).send('You cannot star yourself');
        }

        const me = await User.findById(req.session.userId);
        const alreadyStarred = me.starredCreators.map(id => id.toString()).includes(targetId);

        if (alreadyStarred) {
            me.starredCreators = me.starredCreators.filter(id => id.toString() !== targetId);
        } else {
            me.starredCreators.push(targetId);
        }

        await me.save();
        res.json({ starred: !alreadyStarred, total: me.starredCreators.length });
    } catch (err) {
        console.error('POST /profile/star/:id:', err);
        res.status(500).send('Server error');
    }
});

// DELETE /api/profile/me — elimina account 
router.delete('/me', auth, async (req, res) => {
    console.log('DELETE /me chiamata, userId:', req.session.userId);
    try {
        const userId = req.session.userId;

        await Recipe.deleteMany({ author: userId });
        await User.updateMany(
            { starredCreators: userId },
            { $pull: { starredCreators: userId } }
        );

        await User.findByIdAndDelete(userId);
        req.session.destroy();

        res.json({ message: 'Account deleted' });
    } catch (err) {
        console.error('DELETE /profile/me:', err);
        res.status(500).send('Server error');
    }
});

module.exports = router;