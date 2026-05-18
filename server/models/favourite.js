const mongoose = require('mongoose');

const FavouriteSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    recipeId: {
        type: String,   // string per supportare sia ID Spoonacular (numero) che ID community (ObjectId stringa)
        required: true
    },
    // snapshot dei dati principali per mostrare la card senza rifare chiamate API
    title: { type: String, default: '' },
    image: { type: String, default: '' },
    readyInMinutes: { type: Number },
    servings: { type: Number },
    glutenFree: { type: Boolean, default: false },
    dairyFree:  { type: Boolean, default: false },
    vegetarian: { type: Boolean, default: false },
    vegan:      { type: Boolean, default: false },
    macros: {
        calories: String,
        protein:  String,
        carbs:    String,
        fat:      String
    },
    addedAt: { type: Date, default: Date.now }
});

// Indice univoco: un utente non può salvare due volte la stessa ricetta
FavouriteSchema.index({ user: 1, recipeId: 1 }, { unique: true });

module.exports = mongoose.model('Favourite', FavouriteSchema);