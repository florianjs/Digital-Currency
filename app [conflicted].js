require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const findOrCreate = require("mongoose-findorcreate");

const defaultPicture = "img/profil.jpg";

/* DEFAULT AMOUNT OF TOKENS WHEN A USER REGISTER
 */
const defaultTokens = 50;

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));

app.set("view engine", "ejs");

app.use(express.static("public"));

app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
  })
);
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/tonkenDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

mongoose.set("useFindAndModify", false);

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  tokens: Number
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

app
  .route("/")
  .get(function(req, res) {
    res.render("login");
    res.end();
  })
  .post(
    passport.authenticate("local", {
      successRedirect: "/home",
      failureRedirect: "/"
    }),
    function(req, res) {}
  );

app.get("/logout", function(req, res) {
  req.session.destroy();
  req.logout();
  req.session = null;
  res.redirect("/");
});

app.route("/home").get(function(req, res) {
  if (req.isAuthenticated()) {
    res.render("home", {
      defaultPicture: defaultPicture,
      tokens: req.user.tokens,
      username: req.user.username
    });
  }
});

app
  .route("/subscribe")
  .get(function(req, res) {
    res.render("subscribe");
  })
  .post(function(req, res) {
    User.register(
      {
        username: req.body.username,
        email: req.body.email,
        tokens: defaultTokens
      },
      req.body.password,
      function(err, user) {
        if (err) {
          console.log(err);
          res.redirect("/subscribe");
        } else {
          passport.authenticate("local")(req, res, function() {
            res.redirect("/home");
          });
        }
      }
    );
  });

app
  .route("/send")
  .get(function(req, res) {
    res.render("send", { error: " ", amountError: "" });
  })
  .post(function(req, res) {
    if (
      req.body.receiver !== req.user.username &&
      req.body.amount <= req.user.tokens
    ) {
      User.findOneAndUpdate(
        { username: req.body.receiver },
        { $inc: { tokens: Number(req.body.amount) } },
        function(err, founded) {
          if (err) {
            res.render("send", {
              error: "User doesn't exist",
              amountError: ""
            });
          }
          if (founded) {
            User.findOneAndUpdate(
              { username: req.user.username },
              {
                $set: {
                  tokens: Number(req.user.tokens) - Number(req.body.amount)
                }
              },
              function(err, founded) {
                if (founded) {
                  res.redirect("/home");
                }
              }
            );
          } else {
            console.log("Username doesn't exist");
            res.render("send", {
              error: "User doesn't exist",
              amountError: ""
            });
          }
        }
      );
    } else {
      res.render("send", {
        error: "",
        amountError: "You don't have enought tokens"
      });
    }
  });

app.listen("3000", function() {
  console.log("Server started at port 3000");
});
