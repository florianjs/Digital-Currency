const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));

app.set("view engine", "ejs");

app.use(express.static("public"));

app
  .route("/")
  .get(function(req, res) {
    res.render("login");
  })
  .post(function(req, res) {
    res.redirect("/home");
  });

app.route("/home").get(function(req, res) {
  res.render("home");
});

app.route("/subscribe").get(function(req, res) {
  res.render("subscribe");
});

app.listen("3000", function() {
  console.log("Server started at port 3000");
});
