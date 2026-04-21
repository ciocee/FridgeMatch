const User = require("../models/user");
const bcrypt = require ("bcrypt");

//Register
exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        console.log("REGISTER - body ricevuto:", { username, email, password: password ? "***" : "VUOTA" });

        //Check campi non vuoti
        if (!username || !email || !password) { 
            return res.status(400).send("All fields are required");
        }
    
        //Check email
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(400).send("Email already have an account");
        }

        //Check username
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return res.status(400).send("Username already have an account");
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        console.log("REGISTER - hash generato:", hashedPassword.substring(0, 20) + "...");

        const user = new User({
            username,
            email,
            password: hashedPassword
        })

        await user.save();
        console.log("REGISTER - utente salvato con id:", user._id);

        res.status(201).send("User registered successfully");
        
    }  catch (err) {
        console.error("REGISTER ERROR:", err);
        res.status(500).send("Server error");
    }
};

//Login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log("LOGIN - tentativo con:", { email, password: password ? "***" : "VUOTA" });
        
        //Check campi non vuoti
        if (!email || !password) {
            return res.status(400).send("All fields are required");
        }

        const user = await User.findOne({ $or: [{ email }, { username: email }] });
        console.log("LOGIN - utente trovato:", user ? `sì (id: ${user._id})` : "NO → 401");

        if (!user) {
            return res.status(401).send("Invalid credentials");
        }

        console.log("LOGIN - password nel DB (primi 20 car):", user.password.substring(0, 20) + "...");

        const match = await bcrypt.compare(password, user.password);
        console.log("LOGIN - bcrypt.compare risultato:", match);

        if (!match) {
            return res.status(401).send("Invalid credentials");
        }

        req.session.userId = user._id;

        res.status(200).send("Login successful");

    } catch (err) {
        console.error("LOGIN ERROR:", err);
        res.status(500).send("Server error");
    }
};

//Logout
exports.logout = (req, res) => {
    req.session.destroy(err => {
        res.send("Logout successful");
    });
};