const express = require("express");
const session = require("express-session");
const mongoos = require("mongoose");
const cors = require("cors");

const app = express();

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
app.use("/auth", require("./routes/auth"));

//Server
app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});