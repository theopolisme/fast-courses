import { useEffect } from 'react';
import algoliasearch from 'algoliasearch/lite';
import createPersistedState from 'use-persisted-state';
import ReactGA from 'react-ga';

const useAppState = createPersistedState('fastCoursesAppState');

let HAS_INITIAL_FETCHED = false;

export const searchClient = algoliasearch(
  process.env.REACT_APP_ALGOLIA_ACCOUNT,
  process.env.REACT_APP_ALGOLIA_TOKEN
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

export const useStore = () => {
  const [appData, setAppData] = useAppState({ classes: [] });

  // On initial load, fetch all missing
  useEffect(() => {
    if (!HAS_INITIAL_FETCHED && appData.classes.length) {
      HAS_INITIAL_FETCHED = true;

      const filters = appData.classes.map(c => {
        const classId = c.split('|')[1];
        return `sections.classId:${classId}`;
      }).join(' OR ');

      searchIndex.search({
        query: '',
        filters: filters
      }, (err, res) => {
        const newCache = res.hits.reduce((updated, hit) => {
          hit.sections.forEach(section => {
            updated[`${hit.number}|${section.classId}`] = makeCacheEntry(hit, section);
          });
          return updated;
        }, {});
        Object.assign(cache, newCache);
        setAppData(appData);
      })
    }
  }, [appData, setAppData]);

  return {
    appData,
    hasClass: id => {
      return appData.classes.indexOf(id) !== -1;
    },
    addClass: (id, hit, section) => {
      Object.assign(cache, { [id]: makeCacheEntry(hit, section) });
      setAppData({ ...appData, classes: appData.classes.concat(id) })
      ReactGA.event({ category: 'Calendar', action: 'Add class', label: id });
    },
    removeClass: id => {
      setAppData({ ...appData, classes: appData.classes.filter(c => c !== id) })
      ReactGA.event({ category: 'Calendar', action: 'Remove class', label: id });
    },
    getClassesForTerm: termId => {
      return appData.classes.map(c => cache[c]).filter(c => c && c.termId === termId);
    }
  };
};
