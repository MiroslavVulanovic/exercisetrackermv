const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const shortid = require('shortid');

const ExerciseSchema = new Schema({
  description: String,
  duration: Number,
  date: {
    type: Date,
    default: Date.now
  }
});

const ExerciseUserSchema = new Schema({
  _id: {
    type: String,
    default: shortid.generate
  },
  username: String,
  log: [ExerciseSchema]
});

const ExerciseUser = mongoose.model('exerciseUser', ExerciseUserSchema);

module.exports = ExerciseUser;
