const mongoose = require('mongoose');

const GroceryItemSchema = new mongoose.Schema({
    user: {type: mongoose.Schema.Types.ObjectId,ref: 'User',required: true},
    name: {type: String, required: true, trim: true},
    category: {type: String,required: true},
    qty: { type: Number, required: true},
    unit: {type: String,required: true,enum: ['units', 'g', 'kg', 'ml', 'l']},
    fromFridge: {type: Boolean,default: false},
    createdAt: {type: Date, default: Date.now}
});

module.exports = mongoose.model('GroceryItem', GroceryItemSchema);