  require('dotenv').config();
  var express = require("express");
  var mongoose = require("mongoose");
  var app = express();
  const bcrypt=require('bcryptjs');
  var database = require("./config/database");
  var database1=require('./config/userdatabase')
  const secretkey=process.env.SECRETKEY;
  const jwt=require('jsonwebtoken');

  var bodyParser = require("body-parser"); // pull information from HTML POST (express4)
  const exphbs = require("express-handlebars");
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

  // Connect to user database
  const userConnection = mongoose.createConnection(database1.userurl);

  const {movieSchema} = require('./models/employee');
  const {UserSchema} = require('./models/user');

  // Create models for movie and user
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
    // Get the JWT token from the request headers or cookies
    const token = req.headers.authorization || (req.cookies && req.cookies.token);

    // Check if token exists
    if (!token) {
        // If token doesn't exist, redirect to login page
        return res.redirect('/login'); // Adjust the URL if needed
    }

    try {
        // Verify the JWT token
        const decoded = jwt.verify(token, secretkey); // Use your secret key here

        // Attach the decoded token to the request for future use
        req.user = decoded;

        // If token is valid, continue to the next middleware or route handler
        return next();
    } catch (error) {
        // If token is invalid or expired, redirect to login page
        return res.redirect('/login'); // Adjust the URL if needed
    }
}
  


  app.get("/api/movies/new", isAuthenticated, (req, res) => {
    // console.log("Reached /api/movies/new route handler");
    res.render("movie-form", { layout: "main", loggedIn: true });
  });

  app.get("/movies",async(req,res)=>{
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 10;

    const movies = await Movie
        .find()
        .sort({_id: -1})
        .skip((page - 1) * perPage)
        .limit(perPage);

    res.json(movies)
  })

  // GET route to fetch all movies with pagination support
  // GET route to fetch movies with pagination and optional title filter
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


  app.get("/register", (req, res) => {
    res.render("register", { layout: "main", loggedIn: false });
  });

  app.post('/register', async (req, res) => {
    try {
        // Extract user details from request body
        const { username, email, password } = req.body;

        // Check if user with the same email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user document
        const newUser = new User({
            username,
            email,
            password: hashedPassword
        });

        // Save the user to the database
        await newUser.save();

        res.status(201).json({ message: 'User registered successfully' });
        // 
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
  });


  app.get("/login", (req, res) => {
    res.render("login", { layout: "main", loggedIn: false });
  });

  // Route for user login
  app.post('/login', async (req, res) => {
    try {
        // Extract username and password from request body
        const { email, password } = req.body;

        // Find the user by username
        const user = await User.findOne({ email });

        // If user not found or password doesn't match, send error response
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        // Generate JWT token
        const token = jwt.sign({ userId: user._id }, secretkey);

        // Redirect to movie-form page after successful login
        res.redirect('/api/movies/new');
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});



  app.get("/", (req, res) => {
    res.send("hello world");
  });

  // Route to render the movie add form
  // app.get("/api/movies/new", (req, res) => {
  //   res.render("movie-form"); // Renders the add-movie.handlebars file in the views directory
  // });

  // POST route to add a new movie
  app.post("/api/movies", async function (req, res) {
    try {
      // Create a new movie in the database using the data from the request body
      await Movie.create(req.body);
      const movie = await Movie.find().lean();
      // res.render("movie-list", { movie });
      res.redirect("/api/movies");
    } catch (err) {
      res.status(500).send(err.message);
    }
  });

  // GET route to fetch all movies
  // app.get("/api/movies", isAuthenticated,async function (req, res) {
  //   try {
  //     // Fetch all movies from the database
  //     const movies = await Movie.find();

  //     // Send the retrieved movies as JSON response
  //     res.json(movies);
  //   } catch (err) {
  //     // If an error occurs, send a 500 status along with the error message
  //     res.status(500).send(err.message);
  //   }
  // });

  // GET route to fetch a single movie by ID
  app.get("/api/movies/:movie_id", isAuthenticated,async function (req, res) {
    try {
      let id = req.params.movie_id;
      // Use await to wait for the promise returned by findById()
      const movie = await Movie.findById(id);

      // If movie is null, return a 404 Not Found status
      if (!movie) {
        return res.status(404).json({ message: "Movie not found" });
      }

      // If movie is found, return it as JSON response
      res.json(movie);
    } catch (err) {
      // If an error occurs, send a 500 status along with the error message
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
  app.put("/api/movies/:movie_id", isAuthenticated,async function (req, res) {
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
      // (Assuming req.body contains the updated movie data)
      existingMovie.plot = req.body.plot || existingMovie.plot;
      existingMovie.genres = req.body.genres || existingMovie.genres;
      // Update other movie properties as needed

      // Save the updated movie to the database
      const updatedMovie = await existingMovie.save();

      // Send response with updated movie
      res.json({ message: "Movie updated successfully", movie: updatedMovie });
    } catch (err) {
      res.status(500).send(err.message);
    }
  });

  // DELETE route to delete a movie by ID
  app.delete("/api/movies/:movie_id", isAuthenticated,async function (req, res) {
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
      res.json({ message: "Movie deleted successfully" });
    } catch (err) {
      res.status(500).send(err.message);
    }
  });

  app.listen(port);
  console.log("App listening on port : " + port);
