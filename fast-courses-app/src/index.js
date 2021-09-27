import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import ReactGA from 'react-ga';
import * as Sentry from '@sentry/browser';

import './index.css';
import App from './App';
// import UnderConstruction from './UnderConstruction';

const debug = process.env.NODE_ENV === 'development';

if (!debug) {
  Sentry.init({ dsn: process.env.REACT_APP_SENTRY_DSN });
}

ReactGA.initialize(process.env.REACT_APP_GOOGLE_ANALYTICS_TRACKING_ID, {
  debug,
});

// Header scroll
window.addEventListener('scroll', (e) => {
  if (window.scrollY >= 62) {
    document.body.classList.add('scrolled');
  } else {
    document.body.classList.remove('scrolled');
  }
});

ReactDOM.render(
  <Router>
    {/* <Route path="/" component={UnderConstruction} /> */}
    <Route path="/" component={App} />
  </Router>,
  document.getElementById('root')
);
