require("dotenv").config();
var express = require("express");
var mongoose = require("mongoose");
var app = express();
const bcrypt = require("bcryptjs");
var database = require("./config/database");
var database1 = require("./config/userdatabase");
const secretkey = process.env.SECRETKEY;
const jwt = require("jsonwebtoken");

var bodyParser = require("body-parser"); 
const exphbs = require("express-handlebars");
const cookieParser = require("cookie-parser");

var port = process.env.PORT || 3000;
app.use(bodyParser.urlencoded({ extended: "true" })); 
app.use(bodyParser.json());
app.use(bodyParser.json({ type: "application/vnd.api+json" })); 

var path = require("path");
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());

const movieConnection = mongoose.createConnection(database.url);
const userConnection = mongoose.createConnection(database1.userurl);

const { movieSchema } = require("./models/employee");
const { UserSchema } = require("./models/user");

const Movie = movieConnection.model("Movie", movieSchema);
const User = userConnection.model("User", UserSchema);

app.engine(
  "hbs",
  exphbs.engine({
    extname: "hbs",
  })
);

app.set("view engine", "hbs");

function isAuthenticated(req, res, next) {
  const token = req.headers.authorization || (req.cookies && req.cookies.jwt);

  if (!token) {
    return res.redirect("/login"); 
  }

  try {
    const decoded = jwt.verify(token, secretkey);
    req.user = decoded;

    return next();
  } catch (error) {
    return res.redirect("/login"); 
  }
}

app.get("/api/movies/new", isAuthenticated, (req, res) => {
  res.render("movie-form", { layout: "main", loggedIn: true });
});

app.get("/", (req, res) => {
  if (res.cookie.jwt) {
    const verify = jwt.verify(req.cookies.jwt, secretkey);
    res.render("movie-form", { email: verify.email });
  } else {
    res.render("login");
  }
});

app.get("/api/movies/new", (req, res) => {
  res.render("movie-form", { layout: "main", loggedIn: true });
});

app.get("/api/movies", async function (req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 10;
    const title = req.query.title;

    let query = Movie.find().lean();
    if (title) {
      query = query.regex("title", new RegExp(title, "i"));
    }
    const movies = await query
      .sort({ _id: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage);

    res.render("movie-list", { movies: movies });
  } catch (err) {
    res.render("error", { error: err.message });
  }
});

app.get("/register", (req, res) => {
  res.render("register", { layout: "main", loggedIn: false });
});

app.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });
    const token = jwt.sign({ userId: newUser._id }, secretkey);

    res.cookie("jwt", token, {
      maxAge: 600000,
      httpOnly: true,
    });

    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/login", (req, res) => {
  res.render("login", { layout: "main", loggedIn: false });
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ userId: user._id }, secretkey);

    res.cookie("jwt", token, {
      maxAge: 600000,
      httpOnly: true,
    });

    res.redirect("/api/movies/new");
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/", (req, res) => {
  res.send("hello world");
});


app.post("/api/movies", async function (req, res) {
  try {
    await Movie.create(req.body);
    const movie = await Movie.find().lean();
    res.redirect("/api/movies");
  } catch (err) {
    res.status(500).send(err.message);
  }
});


app.post("/api/movies", async function (req, res) {
  console.log(req.body);
  try {
    const newMovie = new Movie(req.body);
    const savedMovie = await newMovie.save();

    res.status(201).json(savedMovie);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.put("/api/movies/:movie_id", async function (req, res) {
  try {
    const id = req.params.movie_id;
    const existingMovie = await Movie.findById(id);

    if (!existingMovie) {
      return res.status(404).json({ message: "Movie not found" });
    }

    existingMovie.plot = req.body.plot || existingMovie.plot;
    existingMovie.genres = req.body.genres || existingMovie.genres;

    const updatedMovie = await existingMovie.save();

    res.json({ message: "Movie updated successfully", movie: updatedMovie });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.delete("/api/movies/:movie_id", async function (req, res) {
  try {
    const id = req.params.movie_id;
    const deleteResult = await Movie.deleteOne({ _id: id });

    if (deleteResult.deletedCount === 0) {
      return res.status(404).json({ message: "Movie not found" });
    }

    res.json({ message: "Movie deleted successfully" });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.listen(port);
console.log("App listening on port : " + port);