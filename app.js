require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const findOrCreate = require("mongoose-findorcreate");
const gravatar = require("gravatar");

/* THEME COLOR  */
/*  Available colors: */
/*  red
orange
yellow
green
teal
blue
indigo (DEFAULT)
purple
pink */
const colorTheme = "indigo";

/* DEFAULT AMOUNT OF TOKENS WHEN A USER REGISTER. */
/* Recommended : 0
Default value: 50
 */

const defaultTokens = 50;

/* NAME YOUR TOKEN. */
/* Default name Tonken */
/* Default symbol TKN */

const nameOfYourToken = "Tonken";
const tokenSymbol = "TKN";

/* Is your website open for public subscribers? */
/* true = Yes */
/* false = No, only admin can create accounts
 */

const publicRegister = true;

/* NAME YOUR DATABASE */
/* Default URL (for testing): mongodb://localhost:27017 */
/* default Database Name: tonkenDB */
/* You can leave it as it. */

const nameDB = "tonkenDB";
const urlDB = "mongodb://localhost:27017/";

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

/* Default URL for test environment : Localhost
 */

mongoose.connect(urlDB + nameDB, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

mongoose.set("useFindAndModify", false);

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  tokens: Number,
  admin: Boolean
});

const historySchema = new mongoose.Schema({
  fromUsername: String,
  toUsername: String,
  amount: Number,
  message: String,
  gravatarFrom: String,
  gravatarTo: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
const User = mongoose.model("User", userSchema);
const TokenMovement = mongoose.model("TokenMovement", historySchema);

passport.use(User.createStrategy());

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});

app
  .route("/")
  .get((req, res) => {
    if (req.isAuthenticated()) {
      res.redirect("/home");
    } else {
      res.render("login", { register: publicRegister, colorTheme });
      res.end();
    }
  })
  .post(
    passport.authenticate("local", {
      successRedirect: "/home",
      failureRedirect: "/"
    })
  );

app.get("/logout", (req, res) => {
  req.session.destroy();
  req.logout();
  req.session = null;
  res.redirect("/");
});

app.route("/home").get((req, res) => {
  if (req.isAuthenticated()) {
    TokenMovement.find(
      {
        /* ignore jslint start */
        $or: [
          { fromUsername: req.user.username },
          { toUsername: req.user.username }
        ]
        /* ignore jslint end */
      },
      (err, founded) => {
        const pictureURL = gravatar.url(req.user.email, { s: 128 });

        res.render("home", {
          tokens: req.user.tokens,
          username: req.user.username,
          history: founded,
          user: req.user.username,
          tokenName: nameOfYourToken,
          tokenSymbol,
          colorTheme,
          pictureURL
        });
      }
    );
  } else {
    res.redirect("/");
  }
});

app
  .route("/subscribe")
  .get((req, res) => {
    if (publicRegister) {
      res.render("subscribe", { colorTheme });
    } else {
      res.redirect("/");
    }
  })
  .post((req, res) => {
    User.register(
      {
        username: req.body.username,
        email: req.body.email,
        tokens: defaultTokens,
        admin: false
      },
      req.body.password,
      (err) => {
        if (err) {
          res.redirect("/subscribe");
        } else {
          passport.authenticate("local")(req, res, () => {
            res.redirect("/home");
          });
        }
      }
    );
  });

app
  .route("/send")
  .get((req, res) => {
    if (req.isAuthenticated()) {
      res.render("send", {
        error: " ",
        amountError: "",
        tokenName: nameOfYourToken,
        tokenSymbol,
        colorTheme
      });
    } else {
      res.redirect("/");
    }
  })
  .post((req, res) => {
    if (
      req.body.receiver !== req.user.username &&
      req.body.amount <= req.user.tokens &&
      Number(req.body.amount) > 0 &&
      Number.isInteger(req.body.amount)
    ) {
      User.findOneAndUpdate(
        { username: req.body.receiver },
        /* ignore jslint start */
        { $inc: { tokens: Number(req.body.amount) } },
        /* ignore jslint end */

        (err, founded) => {
          if (err) {
            res.render("send", {
              error: "User doesn't exist",
              amountError: "",
              tokenName: nameOfYourToken,
              tokenSymbol,
              colorTheme
            });
          }
          if (founded) {
            const gravatarFrom = gravatar.url(req.user.email, { s: 128 });
            const gravatarTo = gravatar.url(founded.email, { s: 128 });
            const history = new TokenMovement({
              fromUsername: req.user.username,
              toUsername: req.body.receiver,
              amount: Math.floor(req.body.amount),
              message: req.body.message,
              gravatarFrom,
              gravatarTo
            });

            User.findOneAndUpdate(
              { username: req.user.username },
              {
                /* ignore jslint start */
                $set: {
                  /* ignore jslint end */
                  tokens: Number(req.user.tokens) - Math.floor(req.body.amount)
                }
              },
              (err, found) => {
                if (err) {
                  console.log(err);
                }
                if (found) {
                  history.save();
                  res.redirect("/home");
                }
              }
            );
          } else {
            res.render("send", {
              error: "User doesn't exist",
              amountError: "",
              tokenName: nameOfYourToken,
              tokenSymbol,
              colorTheme
            });
          }
        }
      );
    } else {
      res.render("send", {
        error: "",
        amountError: "You don't have enought tokens",
        tokenName: nameOfYourToken,
        tokenSymbol,
        colorTheme
      });
    }
  });

/* Calculte total number of Tokens */

/* User.aggregate({
  $group: {
    _id: null,
    tokens: { $sum: "$user_tokens" }
  }
}); */

app.route("/admin").get((req, res) => {
  User.findOne({ admin: true, username: req.user.username }, (err, founded) => {
    if (req.isAuthenticated() && founded) {
      User.find({}, (err, users) => {
        res.render("admin", {
          usersDB: users,
          tokenSymbol,
          nameOfYourToken,
          colorTheme,
          totTokens: 100
        });
      });
    } else {
      res.sendStatus(404);
    }
  });
});

app
  .route("/admin/edit/:user")
  .get((req, res) => {
    if (req.user.admin) {
      const editUsername = req.params.user;
      User.findOne({ username: editUsername }, (err, founded) => {
        if (founded) {
          res.render("edit-user", {
            username: editUsername,
            colorTheme
          });
        }
      });
    } else {
      res.redirect("/");
    }
  })
  .post((req, res) => {
    User.findOne({ username: req.params.user }, (err, founded) => {
      if (req.body.newName.length != 0) {
        founded.username = req.body.newName;
        founded.save();
      }
      if (req.body.newEmail.length != 0) {
        founded.email = req.body.newEmail;
        founded.save();
      }
      if (req.body.newTokens > 0) {
        founded.tokens = req.body.newTokens;
        founded.save();
      }
      if (req.body.delete === "on") {
        TokenMovement.deleteMany(
          {
            $or: [
              { fromUsername: founded.username },
              { toUsername: founded.username }
            ]
          },
          (err) => {
            if (err) {
              console.log(err);
            }
          }
        );
        User.deleteOne({ username: founded.username }, (err) => {
          if (err) {
            console.log(err);
          }
        });
      }
      res.redirect("/admin");
    });
  });

app
  .route("/admin/new")
  .get((req, res) => {
    if (req.user.admin) {
      res.render("create-user", { colorTheme });
    } else {
      res.redirect("/");
    }
  })
  .post((req, res) => {
    if (req.body.isAdmin === "on") {
      User.register(
        {
          username: req.body.newName,
          email: req.body.newEmail,
          tokens: req.body.newTokens,
          admin: true
        },
        req.body.password,
        (err) => {
          if (err) {
            console.log(err);
          }
        }
      );
      res.redirect("/admin");
    } else {
      User.register(
        {
          username: req.body.newName,
          email: req.body.newEmail,
          tokens: req.body.newTokens,
          admin: false
        },
        req.body.password,
        (err) => {
          if (err) {
            console.log(err);
          }
        }
      );
      res.redirect("/admin");
    }
  });

app.route("/transaction/:id").get((req, res) => {
  if (req.isAuthenticated()) {
    TokenMovement.findOne({ _id: req.params.id }, (err, transaction) => {
      if (
        req.user.username === transaction.fromUsername ||
        req.user.username === transaction.toUsername
      ) {
        res.render("transaction", {
          message: transaction.message,
          colorTheme,
          from: transaction.fromUsername,
          amount: transaction.amount,
          symbol: tokenSymbol,
          gravatarFrom: transaction.gravatarFrom,
          gravatarTo: transaction.gravatarTo
        });
      } else {
        res.redirect("/");
      }
    });
  } else {
    res.redirect("/");
  }
});

app.route("/admin/user-list").get((req, res) => {
  User.findOne({ admin: true, username: req.user.username }, (err, founded) => {
    if (req.isAuthenticated() && founded) {
      User.find({}, (err, users) => {
        res.render("admin-list", {
          usersDB: users,
          tokenSymbol,
          nameOfYourToken,
          colorTheme
        });
      });
    } else {
      res.sendStatus(404);
    }
  });
});

// DEMO ONLY START

app.get("/1", (req, res) => {
  res.render("demo-1", { colorTheme });
});
app.get("/2", (req, res) => {
  res.render("demo-2", { colorTheme });
});

// DEMO ONLY END

app.listen("3000", () => {
  console.log("Server started at port 3000");
});
