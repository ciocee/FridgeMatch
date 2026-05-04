// per definire la truttura dell'oggetto ricetta
const mongoose = require('mongoose');

const RecipeSchema = new.mongoose.Schema({
    author: {   
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    title: {
        type: String,
        required: true
    },

    image: {
        type: String,   // percorso
        required: true        
    },

    ingredients: [{ type: String }], // array di strings

    likes: [{ 
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
    }],

    comments: [{ 
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
            text: String,
            date: {type: Date, default: Date.now}
    }],
    createdAt: {type: Date, default: Date.now}
});

module.exports = mongoose.model('Recipe', RecipeSchema);