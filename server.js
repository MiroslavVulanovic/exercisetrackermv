require('dotenv').config(); // adds vars from .env file into process.env
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const cors = require('cors');

// Connect to Database
const uri = process.env.MONGO_URI;
if (uri == null) {
  throw 'error: MongoDB uri is undefined!';
}
const options = { useMongoClient: true };

mongoose.Promise = global.Promise;
mongoose.connect(
  uri,
  options,
  (err) => {
    if (err) {
      console.log(err.message);
    } else {
      console.log('Successfully connected to database!');
    }
  }
);

// used for FCC testing
app.use(cors());

// body parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// set up static files
app.use(express.static('public'));

// Handle api requests
app.use('/api', require(process.cwd() + '/routes/api'));

/* HANDLE ERRORS - MUST BE AT THE END OF FILE */
// Not found middleware
app.use((req, res, next) => {
  return next({ status: 404, message: 'not found' });
});

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage;

  if (err.errors) {
    // mongoose validation error
    errCode = 400; // bad request
    const keys = Object.keys(err.errors);
    // report the first validation error
    errMessage = err.errors[keys[0]].message;
  } else {
    // generic or custom error
    errCode = err.status || 500;
    errMessage = err.message || 'Internal Server Error';
  }
  res
    .status(errCode)
    .type('txt')
    .send(errMessage);
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
