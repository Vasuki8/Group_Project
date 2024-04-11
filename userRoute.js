// app.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const secretkey=process.env.SECRETKEY;

const User = require('./models/user'); // Import the User model

const app = express();
app.use(express.json());

var bodyParser = require("body-parser"); // pull information from HTML POST (express4)
const exphbs = require("express-handlebars");

app.use(bodyParser.urlencoded({ extended: "true" })); // parse application/x-www-form-urlencoded
app.use(bodyParser.json()); // parse application/json
app.use(bodyParser.json({ type: "application/vnd.api+json" })); // parse application/vnd.api+json as json

var path = require("path");
app.use(express.static(path.join(__dirname, "public")));

app.engine(
    "hbs",
    exphbs.engine({
      extname: "hbs",
    })
  );
  
  app.set("view engine", "hbs");    

mongoose.connect('mongodb+srv://yugsutariya:yug12345@cluster0.m47zs5l.mongodb.net/Auth');



app.get('/register', (req, res) => {
    res.render('register');
});

// Registration endpoint
app.post('/register', async (req, res) => {
    try {
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
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/login', (req, res) => {
    res.render('login');
});

// Login endpoint
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find the user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Check if password matches
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Generate JWT token
        const token = jwt.sign({ userId: user._id }, secretkey);

        // Send the token in response
        res.status(200).json({ token });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
