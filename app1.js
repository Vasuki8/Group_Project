require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require("body-parser");
const exphbs = require("express-handlebars");
const cookieParser = require('cookie-parser');

const database = require("./config/database");
const database1 = require('./config/userdatabase');

const secretkey = process.env.SECRETKEY;

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: "true" }));
app.use(bodyParser.json());
app.use(bodyParser.json({ type: "application/vnd.api+json" }));
app.use(express.static(__dirname + "/public"));
app.use(cookieParser());

const movieConnection = mongoose.createConnection(database.url);
const userConnection = mongoose.createConnection(database1.userurl);

const { movieSchema } = require('./models/employee');
const { UserSchema } = require('./models/user');

const Movie = movieConnection.model('Movie', movieSchema);
const User = userConnection.model('User', UserSchema);

app.engine(
    "hbs",
    exphbs.engine({
        extname: "hbs",
    })
);

app.set("view engine", "hbs");

function isAuthenticated(req, res, next) {
    const token = req.cookies.jwt;

    if (!token) {
        return res.redirect('/login');
    }

    try {
        const decoded = jwt.verify(token,"yugisgood");
        req.user = decoded;
        return next();
    } catch (error) {
        return res.redirect('/login');
    }
}
    

app.get("/api/movies/new", isAuthenticated, (req, res) => {
    res.render("movie-form", { layout: "main", loggedIn: true });
});

app.get("/api/movies",isAuthenticated, async function (req, res) {
    try {
      // Extract page, perPage, and title parameters from the query string
      const page = parseInt(req.query.page) || 1;
      const perPage = parseInt(req.query.perPage) || 10;
      const title = req.query.title; // Optional title filter

      // Construct the query based on pagination and optional title filter
      let query = Movie.find().lean();
      if (title) {
        query = query.regex('title', new RegExp(title, 'i')); // Case-insensitive title search
      }
      const movies = await query
        .sort({_id: -1})
        .skip((page - 1) * perPage)
        .limit(perPage);

      // Render the 'movies' HBS file and pass the movie data as context
      res.render('movie-list', { movies: movies });
      // res.json(movies);
    } catch (err) {
      // If an error occurs, render an error page
      res.render('error', { error: err.message });
    }
  });

app.post("/api/movies", async function (req, res) {
    try {
        await Movie.create(req.body);
        const movies = await Movie.find().lean();
        res.redirect("/api/movies");
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// app.get("/api/movies", async function (req, res) {
//     try {
//         const movies = await Movie.find();
//         res.json(movies);
//     } catch (err) {
//         res.status(500).send(err.message);
//     }
// });

app.get("/register", (req, res) => {
    res.render("register", { layout: "main", loggedIn: false });
});

app.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            username,
            email,
            password: hashedPassword
        });
        const token = jwt.sign({ userId: newUser._id },"yugisgood");
        res.cookie("jwt", token, {
            maxAge: 600000,
            httpOnly: true
        });
        await newUser.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get("/login", (req, res) => {
    res.render("login", { layout: "main", loggedIn: false });
});

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        const token = jwt.sign({ userId: user._id }, "yugisgood");
        res.cookie("jwt", token, {
            maxAge: 60000,
            httpOnly: true
        });
        res.redirect('/api/movies/new');
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.listen(port, () => {
    console.log(`App listening on port : ${port}`);
});
