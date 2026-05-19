const mongoose = require('mongoose');

const globalSearchCacheSchema = new mongoose.Schema({
    ingredientsKey: { type: String, required: true, unique: true },
    results: { type: Array, required: true },
    
    createdAt: { type: Date, default: Date.now, expires: 86400 } 
});

module.exports = mongoose.model('GlobalSearchCache', globalSearchCacheSchema);