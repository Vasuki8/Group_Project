const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const movieSchema = new Schema({
  plot: String,
  genres: [String],
  runtime: Number,
  cast: [String],
  num_mflix_comments: Number,
  title: String,
  fullplot: String,
  languages: [String],
  released: Date,
  directors: [String],
  rated: String,
  awards: {
    wins: Number,
    nominations: Number,
    text: String
  },
  lastupdated: Date,
  year: Number,
  imdb: {
    rating: Number,
    votes: Number,
    id: Number
  },
  countries: [String],
  type: String,
  tomatoes: {
    viewer: {
      rating: Number,
      numReviews: Number,
      meter: Number
    },
    lastUpdated: Date
  }
});

const Movie = mongoose.model('Movie', movieSchema);

module.exports = Movie;
