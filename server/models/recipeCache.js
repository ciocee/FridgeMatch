const mongoose = require('mongoose');

const recipeCacheSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true }, 
    title: { type: String, required: true },
    image: { type: String },
    readyInMinutes: { type: Number },
    servings: { type: Number },
    healthScore: { type: Number },
    
    glutenFree: { type: Boolean, default: false },
    dairyFree: { type: Boolean, default: false },
    vegetarian: { type: Boolean, default: false },
    vegan: { type: Boolean, default: false },
    
    extendedIngredients: [{
        id: { type: Number },
        name: { type: String },
        original: { type: String } 
    }],
    
    macros: {
        calories: { type: String },
        protein: { type: String },
        carbs: { type: String },
        fat: { type: String }
    },
    
    analyzedInstructions: [{
        name: { type: String },
        steps: [{
            number: { type: Number },
            step: { type: String }
        }]
    }]
}, { 
    timestamps: true 
});

module.exports = mongoose.model('RecipeCache', recipeCacheSchema);