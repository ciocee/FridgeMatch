const express = require('express');
const router = express.Router();
const FridgeItem = require('../models/fridge');
const auth = require('../middleware/authMiddleware');
 
// GET: Recupera gli elementi del frigo dell'utente loggato
router.get('/', auth, async (req, res) => {
    try {
        const items = await FridgeItem.find({ user: req.session.userId }).sort({ expiry: 1 });
        res.json(items);
    } catch (err) {
        res.status(500).send('Errore del server');
    }
});
 
// POST: Aggiunge un elemento
router.post('/', auth, async (req, res) => {
    try {
        const newItem = new FridgeItem({
            ...req.body,
            user: req.session.userId
        });
        const item = await newItem.save();
        res.json(item);
    } catch (err) {
        res.status(500).send('Errore nel salvataggio');
    }
});
 
// DELETE: Rimuove uno o più elementi
router.delete('/', auth, async (req, res) => {
    try {
        const { ids } = req.body;
        await FridgeItem.deleteMany({ _id: { $in: ids }, user: req.session.userId });
        res.json({ msg: 'Elementi eliminati' });
    } catch (err) {
        res.status(500).send('Errore durante l\'eliminazione');
    }
});
 
module.exports = router;

// PUT: Modifica un elemento esistente (Parte 1 slide 8)
router.put('/:id', auth, async (req, res) => {
    try {
        const updatedItem = await FridgeItem.findOneAndUpdate(
            { _id: req.params.id, user: req.session.userId },
            { $set: req.body }, 
            { new: true } 
        );

        if (!updatedItem) return res.status(404).send("Item not found");
        res.json(updatedItem);
    } catch (err) {
        res.status(500).send("Errore durante la modifica");
    }
});

