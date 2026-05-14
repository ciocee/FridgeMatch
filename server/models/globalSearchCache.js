const mongoose = require('mongoose');

const globalSearchCacheSchema = new mongoose.Schema({
    ingredientsKey: { type: String, required: true, unique: true },
    
    results: { type: Array, required: true },
    
    // Opzionale: fa scadere la cache dopo 24 ore (86400 secondi)
    //createdAt: { type: Date, default: Date.now, expires: 86400 } 
});

module.exports = mongoose.model('GlobalSearchCache', globalSearchCacheSchema);