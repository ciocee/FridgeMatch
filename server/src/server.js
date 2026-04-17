const express = require("express");
const session = require("express-session");
const app = express();

app.use(express.json());

app.use(session({
  secret: "fridgematch-secret",
  resave: false,
  saveUninitialized: false
}));

//Memoria di Testing
const user = [];