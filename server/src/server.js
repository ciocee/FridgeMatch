const express = require("express");
const session = require("express-session");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: "fridgematch-secret",
  resave: false,
  saveUninitialized: false
}));

//Memoria di Testing (finto database)
const users = [];

// Register (non so se va qui)
app.post("/register", (req, res) => {
    const {username, email, password} = req.body;

    const emailUser = users.find(u => u.email === email);
    if (emailUser) {
        return res.status(400).send("Email already have an account");
    }
    const user = users.find(u =>u.username === username);
    if (user) {
        return res.status(400).send("Username already exists");
    }

    users.push({username, email, password});
    res.status(201).send("User registered successfully");
});

// Login (non so se va qui)
app.post("/login", (req, res) => {
    const {email, password} = req.body;

    const user = users.find(u => u.email === email || u.username === email);

    if (!user || user.password !== password) {
        return res.status(401).send("Invalid credentials");
    }

    req.session.user = user;
    
    res.status(200).send("Login successful");
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});