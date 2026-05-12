require("dotenv").config();

console.log("PORT:", process.env.PORT);
console.log("MONGO:", process.env.MONGO_URI);

const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require('path');

const app = express();
app.use('/uploads', express.static('uploads'));

//DB
mongoose.connect(process.env.MONGO_URI )
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.error("MongoDB connection error:", err));

//Middleware
app.use(cors({
  origin: "http://127.0.0.1:5500",
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

//Routes
app.use("/auth", require("../routes/auth"));
app.use('/api/fridge', require('../routes/fridge'));
app.use("/api/grocery", require("../routes/grocery"));
app.use("/api/profile",   require("../routes/profile"));
app.use("/api/recipes", require("../routes/recipes"));
app.use("/api/social", require("../routes/social"));

//Server
app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});

// Cambio username
exports.changeUsername = async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).send("Not authenticated");
        }

        const { username } = req.body;
        if (!username || username.trim().length < 3) {
            return res.status(400).send("Username must be at least 3 characters");
        }

        const trimmed = username.trim();

        if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
            return res.status(400).send("Username can only contain letters, numbers, _ and -");
        }

        const existing = await User.findOne({ username: trimmed });
        if (existing && existing._id.toString() !== req.session.userId.toString()) {
            return res.status(409).send("Username already taken");
        }

        await User.findByIdAndUpdate(req.session.userId, { username: trimmed });

        res.status(200).send({ message: "Username updated successfully", username: trimmed });

    } catch (err) {
        console.error("CHANGE USERNAME ERROR:", err);
        res.status(500).send("Server error");
    }
};