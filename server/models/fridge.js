const mongoose = require('mongoose');

const FridgeItemSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Collega l'item all'utente
    name: { type: String, required: true },
    category: { type: String, required: true },
    qty: { type: Number, required: true },
    unit: { type: String, required: true },
    expiry: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('FridgeItem', FridgeItemSchema);