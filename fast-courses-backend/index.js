require('dotenv').config()

const MongoClient = require('mongodb').MongoClient;
const express = require('express');
const cors = require('cors');
const app = express();

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

  app.use(cors({
    origin: true
  }));

  app.get('/', (req, res) => {
    res.send({ message: 'Welcome to the fast-courses API!' });
  });

  app.get('/meta/ratings', async (req, res) => {
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
  });

  app.get('/meta/counts', async (req, res) => {
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
  });

  app.get('/courses/:id', async (req, res) => {
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
  });

  const port = process.env.PORT || 3030;
  app.listen(port, () => console.log(`Now listening on port ${port}!`))
})();
