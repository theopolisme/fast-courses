require('dotenv').config()

const MongoClient = require('mongodb').MongoClient;
const axios = require('axios');
const qs = require('qs');
const express = require('express');
const asyncHandler = require('express-async-handler');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const app = express();
 
const { decodeAccessToken } = require('./auth');

const TERMS = {
  '2018-2019 Autumn': 152261,
  '2018-2019 Winter': 152266,
  '2018-2019 Spring': 152269
}

const QUALITY_KEY = "Overall, how would you describe the quality of the instruction in this course?";
const LEARNED_KEY = "How much did you learn from this course?";
const REVIEW_KEY = "What would you like to say about this course to a student who is considering taking it in the future?";
const TIME_KEY = "How many hours per week on average did you spend on this course (including class meetings)?";

const P = 0.8, Q = 20;
const MIN_RATINGS = 20;
const normalizeScore = ({ score, count, globalAverage }) => {
  return (count / (count + MIN_RATINGS)) * score + (MIN_RATINGS / (count + MIN_RATINGS)) * globalAverage;
  // return (P * score) + (5) * (1 - P) * (1 - Math.pow(Math.E, -count / Q));
};

const serializeUserSession = (session, data) => ({
  email: session.user,
  name: session.user.split('@')[0],
  last_login: data.last_login,
  first_login: data.first_login,
  classes: data.classes || []
});

(async function() {
  const url = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DATABASE;
  const client = new MongoClient(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  try {
    await client.connect();
  } catch (err) {
    console.log(err.stack);
    return;
  }

  const db = client.db(dbName);

  await db.collection('reviews').createIndex(
    { 'Course ID': 1 },
    {
      partialFilterExpression: { [REVIEW_KEY]: { $exists: true } },
      name: 'fast-courses.reviews.reviewsByCourse'
    }
  );

  app.use(express.json());

  app.use(session({
      name: 'fast-courses.sid',
      store: new MongoStore({ client: client }),
      saveUninitialized: false,
      resave: false,
      secret: process.env.SECRET
  }));

  app.use(cors({
    origin: true,
    credentials: true,
  }));

  app.get('/', (req, res) => {
    res.send({ message: 'Welcome to the fast-courses API!' });
  });

  app.get('/self', asyncHandler(async (req, res, next) => {
    if (req.session.user) {
      const data = await db.collection('users').findOne({ _id: req.session.user });
      return res.send(serializeUserSession(req.session, data));
    } else {
      return res.status(401).send({ error: { message: 'Not authorized' } });
    }
  }));

  app.post('/self', asyncHandler(async (req, res, next) => {
    if (req.session.user) {
      const { op, id } = req.body.classes;
      if (['$addToSet', '$pull'].indexOf(op) === -1) throw new Error('Unsupported operation');
      const data = await db.collection('users').updateOne({ _id: req.session.user }, { [op]: { classes: id } });
      return res.send({ success: true });
    } else {
      return res.status(401).send({ error: { message: 'Not authorized' } });
    }
  }));

  app.get('/login', (req, res) => {
    const endpoint = `${process.env.AUTH_DOMAIN}oauth2/authorize?${qs.stringify({
      identity_provider: 'Stanford',
      redirect_uri: `${process.env.APP_DOMAIN}authenticate`,
      client_id: process.env.AUTH_CLIENT_ID,
      response_type: 'code',
      scope: 'email profile'
    })}`;
    req.session.redirect = req.query.redirect;
    res.redirect(endpoint);
  });

  app.get('/authenticate', asyncHandler(async (req, res, next) => {
    try {
      const response = await axios.post(`${process.env.AUTH_DOMAIN}oauth2/token`, qs.stringify({
        grant_type: 'authorization_code',
        client_id: process.env.AUTH_CLIENT_ID,
        code: req.query.code,
        redirect_uri: `${process.env.APP_DOMAIN}authenticate`
      }), {
        headers: {
          'content-type': 'application/x-www-form-urlencoded'
        }
      });
      const result = await decodeAccessToken(response.data.access_token);
      const email = result.username.replace(/^Stanford_/, '');
      req.session.user = email;

      const now = (new Date()).toISOString();
      await db.collection('users').updateOne({ _id: email }, {
        $set: { last_login: now },
        $setOnInsert: { first_login: now  }
      }, { upsert: true });

      const redirect = req.session.redirect;
      delete req.session.redirect;
      return res.redirect(redirect);
    } catch (err) {
      if (err.response && err.response.data) { return next(new Error(err.response.data.error)); }
      return next(err);
    }
  }));

  app.get('/meta/ratings', asyncHandler(async (req, res) => {
    if (req.query.secret !== process.env.SECRET) {
      return res.status(401).send({ error: { message: 'Not authorized' } });
    }

    const count = await db.collection('reviews').aggregate([
      { $match: {
        [QUALITY_KEY]: { $exists: true },
        [LEARNED_KEY]: { $exists: true }
      } },
      { $project: {
        "course": "$Course ID",
        "term": "$Term",
        "instructor": "$Instructor",
        "rating": { $avg: [`$${QUALITY_KEY}`, `$${LEARNED_KEY}`] },
      } },
      { $group: {
        "_id": {
          "course": "$course",
          "term": "$term",
          "instructor": "$instructor",
        },
        "total": { $sum: "$rating" },
        "count": { $sum: 1 }
      } },
      { $project: {
        "_id": 1,
        "count": "$count",
        "score": { $divide: ["$total", "$count"] }
      } },
    ]).toArray();

    const intermediate = count.reduce((o, c) => {
      if (!o[c._id.course]) { o[c._id.course] = []; }
      o[c._id.course].push({
        term: c._id.term,
        instructor: c._id.instructor,
        score: c.score,
        count: c.count
      });
      return o;
    }, {});

    const result = {};
    Object.keys(intermediate).map(k => {
      const scores = intermediate[k].sort((a, b) => TERMS[b.term] - TERMS[a.term]);
      const mostRecent = scores.filter(s => s.term === scores[0].term);
      const current_score_count = mostRecent.reduce((t, c) => t + c.count, 0);
      const current_score = mostRecent.reduce((t, c) => t + c.score * c.count, 0) / current_score_count;
      result[k] = { current_score, current_score_count, scores };
    });

    const globalAverage = Object.values(result).reduce((t, r) => t + r.current_score, 0) / Object.values(result).length;

    Object.values(result).forEach(r => {
      r.current_score_normalized = normalizeScore({
        score: r.current_score,
        count: r.current_score_count,
        globalAverage: globalAverage
      });
    });

    res.send(result);
  }));

  app.get('/meta/counts', asyncHandler(async (req, res) => {
    if (req.query.secret !== process.env.SECRET) {
      return res.status(401).send({ error: { message: 'Not authorized' } });
    }

    const count = await db.collection('reviews').aggregate([
      { $match: {
        [REVIEW_KEY]: { $exists: true }
      } },
      { $group: {
        "_id": "$Course ID",
        "count": { $sum: 1 }
      } },
    ]).toArray();
    const result = count.reduce((o, c) => {
      o[c._id] = c.count;
      return o;
    }, {});
    res.send(result);
  }));

  app.get('/courses/:id', asyncHandler(async (req, res) => {
    if (!req.session.user) {
      return res.status(401).send({ error: { message: 'Not authorized' } });
    }

    const reviews = await db.collection('reviews').find({
      "Course ID": req.params.id,
      [REVIEW_KEY]: { $exists: true }
    }, {
      projection: {
        [REVIEW_KEY]: 1,
        [TIME_KEY]: 1,
        Term: 1
      }
    }).toArray();

    const advice = reviews.filter(r => !!r[REVIEW_KEY]).map(r => ({
      id: r._id,
      term: r.Term,
      review: r[REVIEW_KEY]
    })).sort((a, b) => TERMS[b.term] - TERMS[a.term]);

    const hours = reviews.map(r => r[TIME_KEY]).filter(h => !!h);

    res.send({
      id: req.params.id,
      reviews: advice,
      hours: hours
    });
  }));

  app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(err.status || 500).send({ error: { message: err.message } });
  });

  const port = process.env.PORT || 3030;
  app.listen(port, () => console.log(`Now listening on port ${port}!`))
})();
