import { useEffect, useState } from 'react';
import algoliasearch from 'algoliasearch/lite';
import ReactGA from 'react-ga';

let HAS_INITIAL_FETCHED = false;

export const searchClient = algoliasearch(
  process.env.REACT_APP_ALGOLIA_ACCOUNT,
  process.env.REACT_APP_ALGOLIA_TOKEN,
  { _useRequestCache: true }
);
export const searchIndex = searchClient.initIndex(process.env.REACT_APP_ALGOLIA_INDEX);

let cache = {};

const makeCacheEntry = (hit, section) => {
  return {
    number: hit.number,
    title: hit.title,
    units: +hit.unitsMax,
    ...section
  };
}

const fetchExtendedCourse = (id) => {
  return fetch(`${process.env.REACT_APP_ENDPOINT}courses/${id}`, { credentials: 'include' })
    .then(r => r.json());
}

const persistUpdate = ({ op, id }) => {
  return fetch(`${process.env.REACT_APP_ENDPOINT}self`, {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify({
      classes: { op, id }
    }),
    headers: { 'content-type': 'application/json' }
  })
  .then(r => r.json());
}

export const useStore = ({ user }) => {
  const [appData, setAppData] = useState({ classes: [] });
  const [extendedData, setExtendedData] = useState({});

  // On initial load, fetch courses for user
  useEffect(() => {
    if (user && user.classes && user.classes.length && !HAS_INITIAL_FETCHED) {
      HAS_INITIAL_FETCHED = true;

      const filters = user.classes.map(c => {
        const classId = c.split('|')[1];
        return `sections.classId:${classId}`;
      }).join(' OR ');

      searchIndex.search({
        query: '',
        filters: filters
      }, (err, res) => {
        if (err) { return window.alert('Unable to fetch classes: ' + err.message); }
        const newCache = res.hits.reduce((updated, hit) => {
          hit.sections.forEach(section => {
            updated[`${hit.number}|${section.classId}`] = makeCacheEntry(hit, section);
          });
          return updated;
        }, {});
        Object.assign(cache, newCache);
        setAppData({ ...appData, classes: user.classes });
      });
    }
  }, [user, appData, setAppData]);

  return {
    appData,
    hasClass: id => {
      return appData.classes.indexOf(id) !== -1;
    },
    addClass: (id, hit, section) => {
      Object.assign(cache, { [id]: makeCacheEntry(hit, section) });
      setAppData({ ...appData, classes: appData.classes.concat(id) })
      ReactGA.event({ category: 'Calendar', action: 'Add class', label: id });
      persistUpdate({ op: '$addToSet', id });
    },
    removeClass: id => {
      setAppData({ ...appData, classes: appData.classes.filter(c => c !== id) })
      ReactGA.event({ category: 'Calendar', action: 'Remove class', label: id });
      persistUpdate({ op: '$pull', id });
    },
    getClassesForTerm: termId => {
      const classes = appData.classes.map(c => cache[c]).filter(c => c && c.termId === termId);

      // In the case of LEC+DIS combo classes, ensure we only count units once
      const indexedCourses = classes.reduce((o, c) => {
        if (o[c.number]) {
          o[c.number].multiple = true;
          o[c.number].components.push(c.component);
        } else {
          o[c.number] = c;
          o[c.number].components = [c.component];
        }
        return o;
      }, {});

      const courses = Object.values(indexedCourses);

      return { classes, indexedCourses, courses };
    },
    getExtendedData: id => {
      if (extendedData[id]) {
        return extendedData[id];
      }

      fetchExtendedCourse(id)
        .then(c => setExtendedData({ ...extendedData, [id]: c }))
        .catch(e => {
          console.error(e);
          setExtendedData({ ...extendedData, [id]: { error: e.message } });
        });

      return { loading: true };
    }
  };
};
