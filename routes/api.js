const express = require('express');
const router = express.Router();
const ExerciseUser = require('../models/ExerciseUser');
const dateValidator = /\d{4}-\d{2}-\d{2}/;

/**
 * Adds new user to the database
 * @param {string} username - Name of the user to add
 * @param {object} res - response object upon which res.json('') will be called
 * @param {function} next - function to be called upon error (ex. next(error))
 */
function addNewUser(username, res, next) {
  ExerciseUser.create({ username }, (err, newItem) => {
    if (err) {
      next(err);
    } else {
      res.json({ username: newItem.username, _id: newItem._id });
    }
  });
}

router.post('/exercise/new-user', (req, res, next) => {
  const username = req.body.username;
  ExerciseUser.findOne({ username }, (err, item) => {
    if (err) {
      next(err);
    } else if (item) {
      res.send('username already taken!');
    } else {
      addNewUser(username, res, next);
    }
  });
});

/**
 * Checks whether all of the items are null or not
 * and returns appropriate message (string)
 * @param {object} body
 */
function checkProps({ userId, description, duration }) {
  if (!userId) {
    return 'unknown _id';
  } else if (!description) {
    return 'Path `description` is required.';
  } else if (!duration) {
    return 'Path `duration` is required.';
  } else {
    return '';
  }
}

/**
 * Adds exercise to the user's log 
 * @param {string} userId - id of user to whose log exercise will be added
 * @param {object} exercise - object in form {
    description: String,
    duration: Number,
    date: Date
  } which will be added onto user's log
 * @param {object} res - response object upon which res.json({...}) will be called
 * @param {object} next - function to be called upon error (ex. next(error))
 */
function addExerciseToUser(userId, exercise, res, next) {
  ExerciseUser.findByIdAndUpdate(
    userId,
    {
      $push: { log: exercise }
    },
    { new: true },
    (err, item) => {
      if (err) next(err);
      else {
        res.json({
          username: item.username,
          _id: item._id,
          ...exercise,
          date: exercise.date.toDateString()
        });
      }
    }
  );
}
router.post('/exercise/add', (req, res, next) => {
  const invalidPropsMsg = checkProps(req.body);
  if (invalidPropsMsg != '') {
    res.send(invalidPropsMsg);
  } else {
    const date = dateValidator.test(req.body.date)
      ? new Date(req.body.date)
      : new Date();

    const exercise = {
      description: req.body.description,
      duration: Number.parseInt(req.body.duration),
      date: date
    };

    addExerciseToUser(req.body.userId, exercise, res, next);
  }
});
/**
 * Creates (exercise)=>condition function based on `from` and `to` optional parameters
 * @param {string} from - string in format yyyy-mm-dd (optional)
 * @param {string} to - string in format yyyy-mm-dd (optional)
 */
function createCompareFunction(from, to) {
  const fromTime = new Date(from).getTime();
  const toTime = new Date(to).getTime();
  if (fromTime && toTime) {
    return (exercise) => {
      const currTime = exercise.date.getTime();
      return fromTime <= currTime && currTime <= toTime;
    };
  } else if (fromTime) {
    return (exercise) => fromTime <= exercise.date.getTime();
  } else if (toTime) {
    return (exercise) => exercise.date.getTime() <= toTime;
  } else {
    return () => false;
  }
}
/**
 * Sends user exercise log in json format as response to the client
 * @param {object} user - erxerciseUser object
 * @param {object} query - object in format {from:Date, to: Date, limit:Number} , where all fields are optional
 * @param {object} res - response object upon which res.json({...}) will be called
 * @param {object} next - function to be called upon error (ex. next(error))
 */
function sendUserExerciseLog(user, { from, to, limit }, res, next) {
  try {
    let retObj = {};
    let cbCompare = createCompareFunction(from, to);
    if (from) retObj.from = new Date(from).toDateString();
    if (to) retObj.to = new Date(to).toDateString();

    let retLog = [];
    for (let exercise of user.log) {
      if (cbCompare(exercise)) {
        if ((limit && retLog.length < limit) || !limit) {
          retLog.push({
            description: exercise.description,
            duration: exercise.duration,
            date: exercise.date.toDateString()
          });
        }
      }
    }
    res.json({
      _id: user._id,
      username: user.username,
      ...retObj,
      count: retLog.length,
      log: retLog
    });
  } catch (err) {
    next(err);
  }
}

router.get('/exercise/log', (req, res, next) => {
  if (!req.query.userId) {
    res.send('unknown userId');
  } else {
    ExerciseUser.findById(req.query.userId, (err, item) => {
      if (err) next(err);
      else {
        sendUserExerciseLog(item, req.query, res, next);
      }
    });
  }
});

module.exports = router;
