require('dotenv').config();
var express = require("express");
var mongoose = require("mongoose");
var app = express();
var database = require("./config/database");

var bodyParser = require("body-parser"); 
const cookieParser = require('cookie-parser');



var port = process.env.PORT || 3000;
app.use(bodyParser.urlencoded({ extended: "true" })); // parse application/x-www-form-urlencoded
app.use(bodyParser.json()); // parse application/json
app.use(bodyParser.json({ type: "application/vnd.api+json" })); // parse application/vnd.api+json as json

var path = require("path");
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());

// Connect to movie database
const movieConnection = mongoose.createConnection(database.url);
const {movieSchema} = require('./models/employee');

// Create models for movie and user
const Movie = movieConnection.model('Movie', movieSchema);      


// GET route to fetch movies with pagination and optional title filter
app.get("/api/movies", async function (req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 10;
    const title = req.query.title; 

    let query = Movie.find().lean();
    if (title) {
      query = query.regex('title', new RegExp(title, 'i')); // Case-insensitive title search
    }
    const movies = await query
      .sort({_id: -1})
      .skip((page - 1) * perPage)
      .limit(perPage);

    res.json(movies);
  } catch (err) {
    res.render('error', { error: err.message });
  }
});


// GET route to fetch all movies
app.get("/api/movies",async function (req, res) {
  try {
    const movies = await Movie.find().lean();

    res.json(movies);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// GET route to fetch a single movie by ID
app.get("/api/movies/:movie_id",async function (req, res) {
  try {
    let id = req.params.movie_id;
    const movie = await Movie.findById(id);

    if (!movie) {
      return res.status(404).json({ message: "Movie not found" });
    }

    res.json(movie);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// POST route to create a new movie
app.post("/api/movies", async function (req, res) {
  console.log(req.body);
  try {

    // Create a new movie record
    const newMovie = new Movie(req.body);
    // Save the new movie to the database
    const savedMovie = await newMovie.save();

    res.status(201).json(savedMovie);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// PUT route to update a movie by ID
app.put("/api/movies/:movie_id",async function (req, res) {
  try {
    // Extract movie ID from request parameters
    const id = req.params.movie_id;

    // Find the movie record by ID
    const existingMovie = await Movie.findById(id);

    if (!existingMovie) {
      return res.status(404).json({ message: "Movie not found" });
    }

    existingMovie.plot = req.body.plot || existingMovie.plot;
    existingMovie.genres = req.body.genres || existingMovie.genres;

    // Save the updated movie to the database
    const updatedMovie = await existingMovie.save();

    res.json({ message: "Movie updated successfully", movie: updatedMovie });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// DELETE route to delete a movie by ID
app.delete("/api/movies/:movie_id",async function (req, res) {
  try {
    // Extract movie ID from request parameters
    const id = req.params.movie_id;

    // Delete the movie record from the database
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
