const express = require('express');
const router  = express.Router();
const GroceryItem = require('../models/grocery');
const FridgeItem  = require('../models/fridge');
const auth = require('../middleware/authMiddleware');

// GET: tutti gli item della lista
router.get('/', auth, async (req, res) => {
    try {
        const items = await GroceryItem.find({ user: req.session.userId }).sort({ createdAt: -1 });
        res.json(items);
    } catch (err) {
        console.error('GET /grocery:', err);
        res.status(500).send('Server Error');
    }
});

// POST: aggiunge un item manualmente
router.post('/', auth, async (req, res) => {
    try {
        const { name, category, qty, unit, fromFridge} = req.body;
        if (!name || !category || !qty || !unit) {
            return res.status(400).send('All fields are required');
        }
        const newItem = new GroceryItem({
            user: req.session.userId,
            name, category, qty, unit,
            fromFridge: fromFridge || false
        });
        const saved = await newItem.save();
        res.json(saved);
    } catch (err) {
        console.error('POST /grocery:', err);
        res.status(500).send('Server Error');
    }
});

// GET /suggest: restituisce SOLO gli item in scadenza per mostrarli nel modale
router.get('/suggest', auth, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const threshold = new Date(today);
        threshold.setDate(threshold.getDate() + 7);

        const expiringItems = await FridgeItem.find({
            user: req.session.userId,
            expiry: { $lte: threshold }
        });

        if (expiringItems.length === 0) {
            return res.json([]); // Ritorna un array vuoto invece di un oggetto con message
        }

        const currentList  = await GroceryItem.find({ user: req.session.userId });
        const existingNames = currentList.map(i => i.name.toLowerCase());
        const toAdd = expiringItems.filter(i => !existingNames.includes(i.name.toLowerCase()));

        // NON SALVIAMO PIÙ QUI! Restituiamo solo l'array al frontend
        res.json(toAdd);
    } catch (err) {
        console.error('GET /grocery/suggest:', err);
        res.status(500).send('Server Error');
    }
});

// NUOVA ROTTA: Salva gli elementi selezionati dal modale del frigo
router.post('/suggest/confirm', auth, async (req, res) => {
    try {
        const { selectedItems } = req.body;
        
        if (!selectedItems || selectedItems.length === 0) {
            return res.status(400).json({ message: 'Nessun elemento selezionato' });
        }

        // Prepariamo l'array da salvare, forzando fromFridge a true dal server
        const itemsToInsert = selectedItems.map(item => ({
            user: req.session.userId,
            name: item.name,
            category: item.category,
            qty: item.qty,
            unit: item.unit,
            fromFridge: true // <-- Fissato dal backend, senza bisogno di chiederlo al frontend!
        }));

        // Salviamo tutto nel database in un colpo solo
        await GroceryItem.insertMany(itemsToInsert);
        
        res.json({ message: 'Items added successfully' });
    } catch (err) {
        console.error('POST /grocery/suggest/confirm:', err);
        res.status(500).send('Server Error');
    }
});

// PATCH /:id/bought: segna come acquistato e aggiunge al frigo
router.patch('/:id/bought', auth, async (req, res) => {
    try {
        const { expiry } = req.body;
        if (!expiry) return res.status(400).send('Expiry date is required');

        const groceryItem = await GroceryItem.findOne({
            _id: req.params.id,
            user: req.session.userId
        });
        if (!groceryItem) return res.status(404).send('Item not found');

        await new FridgeItem({
            user: req.session.userId,
            name: groceryItem.name,
            category: groceryItem.category,
            qty: groceryItem.qty,
            unit: groceryItem.unit,
            expiry: new Date(expiry)
        }).save();

        await GroceryItem.findByIdAndDelete(groceryItem._id);
        res.json({ msg: 'Item moved to fridge' });
    } catch (err) {
        console.error('PATCH /grocery/:id/bought:', err);
        res.status(500).send('Server Error');
    }
});

// DELETE: eliminazione multipla
router.delete('/', auth, async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || ids.length === 0) return res.status(400).send('No IDs provided');
        await GroceryItem.deleteMany({ _id: { $in: ids }, user: req.session.userId });
        res.json({ msg: 'Items deleted' });
    } catch (err) {
        console.error('DELETE /grocery:', err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;