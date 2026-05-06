const mongoose = require("mongoose");

const FOOD_EMOJIS = [
    '🍕','🍔','🌮','🌯','🥗','🍣','🍜','🍝','🍛','🥘',
    '🍲','🥙','🧆','🥚','🍳','🥞','🧇','🥓','🍗','🥩',
    '🍖','🌽','🥕','🥦','🧄','🧅','🥔','🍠','🥑','🫛',
    '🍅','🍆','🥒','🫑','🥬','🥝','🍓','🫐','🍇','🍒',
    '🍑','🥭','🍍','🥥','🍌','🍋','🍊','🍎','🍏','🫙',
    '🧁','🍰','🎂','🍮','🍭','🍫','🍩','🍪','🥐','🥖'
];

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    bio: {
        type: String,
        default: '',
        maxlength: 300
    },
    avatarEmoji: {
        type: String,
        default: function() {
            return FOOD_EMOJIS[Math.floor(Math.random() * FOOD_EMOJIS.length)];
        }
    },
    // creator preferiti (stellati)
    starredCreators: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
});

module.exports = mongoose.model("User", UserSchema);
module.exports.FOOD_EMOJIS = FOOD_EMOJIS;
