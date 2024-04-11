const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const movieSchema = new Schema({
    plot: { type: String, default: '' }, // Make plot optional with default value
    genres: { type: [String], default: [] }, // Make genres optional with default empty array
    runtime: { type: Number, default: 0 }, // Make runtime optional with default value
    cast: { type: [String], default: [] }, // Make cast optional with default empty array
    num_mflix_comments: { type: Number, default: 0 }, // Make num_mflix_comments optional with default value
    title: { type: String, required: true }, // Make title required
    fullplot: { type: String, default: '' }, // Make fullplot optional with default value
    languages: { type: [String], default: [] }, // Make languages optional with default empty array
    released: Date, // Keep released as it is
    directors: { type: [String], default: [] }, // Make directors optional with default empty array
    rated: { type: String, default: '' }, // Make rated optional with default value
    awards: {
        wins: { type: Number, default: 0 }, // Make wins optional with default value
        nominations: { type: Number, default: 0 }, // Make nominations optional with default value
        text: { type: String, default: '' } // Make text optional with default value
    },
    lastupdated: { type: Date, default: Date.now }, // Make lastupdated optional with default value
    year: { type: Number, default: 0 }, // Make year optional with default value
    imdb: {
        rating: { type: Number, default: 0 }, // Make rating optional with default value
        votes: { type: Number, default: 0 }, // Make votes optional with default value
        id: { type: Number, default: 0 } // Make id optional with default value
    },
    countries: { type: [String], default: [] }, // Make countries optional with default empty array
    type: { type: String, default: '' }, // Make type optional with default value
    tomatoes: {
        viewer: {
            rating: { type: Number, default: 0 }, // Make rating optional with default value
            numReviews: { type: Number, default: 0 }, // Make numReviews optional with default value
            meter: { type: Number, default: 0 } // Make meter optional with default value
        },
        lastUpdated: { type: Date, default: Date.now } // Make lastUpdated optional with default value
    }
});

module.exports.movieSchema=movieSchema;
