

var express  = require('express');
var mongoose = require('mongoose');
var app      = express();
var database = require('./config/database');
var bodyParser = require('body-parser');         // pull information from HTML POST (express4)
 
var port     = process.env.PORT || 3000;
app.use(bodyParser.urlencoded({'extended':'true'}));            // parse application/x-www-form-urlencoded
app.use(bodyParser.json());                                     // parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json


mongoose.connect(database.url);

var Movie = require('./models/employee');
 
 
//get all employee data from db

app.get('/',(req,res)=>{
    res.send('hello world');
})


app.get('/api/movies', async function(req, res) {
    try {
        // Fetch all employees from the database
        const movies = await Movie.find();
        
        // Send the retrieved employees as JSON response
        res.json(movies);
    } catch (err) {
        // If an error occurs, send a 500 status along with the error message
        res.status(500).send(err.message);
    }
});


// get a employee with ID of 1
app.get('/api/movies/:movie_id', async function(req, res) {
    try {
        let id = req.params.movie_id;
        // Use await to wait for the promise returned by findById()
        const movie = await Movie.findById(id);
        
        // If employee is null, return a 404 Not Found status
        if (!movie) {
            return res.status(404).json({ message: "Movie not found" });
        }
        
        // If employee is found, return it as JSON response
        res.json(movie);
    } catch (err) {
        // If an error occurs, send a 500 status along with the error message
        res.status(500).send(err.message);
    }
});



// create employee and send back all employees after creation
app.post('/api/movies', async function(req, res) {
    console.log(req.body);
    try {
        // create a new employee record
            const newMovie = new Movie(req.body);

    // Save the new movie to the database
        const savedMovie = await newMovie.save();

        res.status(201).json(savedMovie);
        
    } catch (err) {
        res.status(500).send(err.message);
    }
});


// create employee and send back all employees after creation
app.put('/api/movies/:movie_id', async function(req, res) {
    try {
        // Extract movie ID from request parameters
        const id = req.params.movie_id;

        // Find the movie record by ID
        const existingMovie = await Movie.findById(id);

        // Check if the movie exists
        if (!existingMovie) {
            return res.status(404).json({ message: "Movie not found" });
        }

        // Update movie properties with data from request body
        existingMovie.plot = req.body.plot || existingMovie.plot;
        existingMovie.genres = req.body.genres || existingMovie.genres;
        existingMovie.runtime = req.body.runtime || existingMovie.runtime;
        existingMovie.cast = req.body.cast || existingMovie.cast;
        existingMovie.num_mflix_comments = req.body.num_mflix_comments || existingMovie.num_mflix_comments;
        existingMovie.title = req.body.title || existingMovie.title;
        existingMovie.fullplot = req.body.fullplot || existingMovie.fullplot;
        existingMovie.languages = req.body.languages || existingMovie.languages;
        existingMovie.released = req.body.released || existingMovie.released;
        existingMovie.directors = req.body.directors || existingMovie.directors;
        existingMovie.rated = req.body.rated || existingMovie.rated;
        existingMovie.awards = req.body.awards || existingMovie.awards;
        existingMovie.lastupdated = req.body.lastupdated || existingMovie.lastupdated;
        existingMovie.year = req.body.year || existingMovie.year;
        existingMovie.imdb = req.body.imdb || existingMovie.imdb;
        existingMovie.countries = req.body.countries || existingMovie.countries;
        existingMovie.type = req.body.type || existingMovie.type;
        existingMovie.tomatoes = req.body.tomatoes || existingMovie.tomatoes;

        // Save the updated movie to the database
        const updatedMovie = await existingMovie.save();

        // Send response with updated movie
        res.json({ message: 'Movie updated successfully', movie: updatedMovie });
    } catch (err) {
        // If an error occurs during the update operation, send a 500 status code along with the error message
        res.status(500).send(err.message);
    }
});




// delete a employee by id
app.delete('/api/movies/:movie_id', async function(req, res) {
    try {
        // Extract movie ID from request parameters
        const id = req.params.movie_id;

        // Delete the movie record from the database
        const deleteResult = await Movie.deleteOne({ _id: id });

        // Check if the movie was deleted successfully
        if (deleteResult.deletedCount === 0) {
            return res.status(404).json({ message: "Movie not found" });
        }

        // Send response indicating successful deletion
        res.json({ message: 'Movie deleted successfully' });
    } catch (err) {
        // If an error occurs during the deletion operation, send a 500 status code along with the error message
        res.status(500).send(err.message);
    }
});




app.listen(port);
console.log("App listening on port : " + port);

