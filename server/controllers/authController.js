const User = require("../models/user");
const bcrypt = require ("bcrypt");

//Register
exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

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

        const user = new User({
            username,
            email,
            password: hashedPassword
        })

        await user.save();

        res.status(201).send("User registered successfully");
        
    }  catch (err) {
        res.status(500).send("Server error");
    }
};

//Login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        //Check campi non vuoti
        if (!email || !password) {
            return res.status(400).send("All fields are required");
        }

        const user = await User.findOne({ $or: [{ email }, { username: email }] });

        if (!user) {
            return res.status(401).send("Invalid credentials");
        }

        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.status(401).send("Invalid credentials");
        }

        req.session.userId = user._id;

        res.status(200).send("Login successful");

    } catch (err) {
        res.status(500).send("Server error");
    }
};

//Logout
exports.logout = (req, res) => {
    req.session.destroy(err => {
        res.sed("Logout successful");
    });
};