import React, { useState } from 'react';
import {
  InstantSearch,
  SearchBox,
  Pagination,
  ClearRefinements,
  RefinementList,
  Panel,
  Stats,
  SortBy,
} from 'react-instantsearch-dom';
import qs from 'qs';

import Hits from './partials/Hits';
import RightPanel from './partials/RightPanel';

import { searchClient, useStore } from './store';
import * as util from './util';

import 'instantsearch.css/themes/algolia.css';
import './App.css';

const HEADER_SCROLL = 109;
const DEBOUNCE_TIME = 400;

const createURL = state => {
  if (state.pages === 1) { delete state.pages; }
  return `?${qs.stringify(state)}`;
};

const searchStateToUrl = ({ location }, searchState) =>
  searchState ? `${location.pathname}${createURL(searchState)}` : '';

const urlToSearchState = ({ search }) => qs.parse(search.slice(1));

const Sticky = ({ className, children }) => {
  return <div className={`${className} sticky`}>{children}</div>;
};

const Header = () => (
  <header className="header">
    <h1 className="header-title">
      <a href="/">fast-courses<span>▸</span></a>
    </h1>
    <p className="header-subtitle">
      a better way to search Stanford courses* <span className="mobile-note">(more features on desktop!)</span>
    </p>
  </header>
);

const App = ({ location, history }) => {
  const [searchState, setSearchState] = useState(urlToSearchState(location));
  const [debouncedSetState, setDebouncedSetState] = useState(null);

  const onSearchStateChange = updatedSearchState => {
    console.log('searchState', window.scrollY, HEADER_SCROLL)
    if (window.scrollY >= HEADER_SCROLL) {
      window.scrollTo(0, HEADER_SCROLL);
    }

    clearTimeout(debouncedSetState);

    setDebouncedSetState(
      setTimeout(() => {
        history.push(searchStateToUrl({ location }, updatedSearchState), updatedSearchState);
      }, DEBOUNCE_TIME)
    );

    setSearchState(updatedSearchState);
  };

  const store = useStore();

  return (
    <div>
      <Header />
      <InstantSearch
        searchClient={searchClient}
        indexName="courses"
        searchState={searchState}
        onSearchStateChange={onSearchStateChange}
        createURL={createURL}
      >
        <div className="search-panel">

          <Sticky className="search-panel__filters">
            <div>
              <ClearRefinements />

              <Panel header="Term">
                <RefinementList
                  attribute="sections.term"
                  transformItems={items =>
                    util.sortTerms(items, t => t.label)
                  }
                />
              </Panel>

              <Panel header="Subject">
                <RefinementList
                  attribute="subject"
                  searchable
                  limit={5}
                />
              </Panel>

              <Panel header="Instructor">
                <RefinementList
                  attribute="sections.schedules.instructors.name"
                  searchable
                  limit={5}
                />
              </Panel>

              <Panel header="Schedule">
                <RefinementList
                  attribute="sections.schedules.days"
                  transformItems={items =>
                    items.map(item => ({
                      ...item,
                      label: util.formatDays(item.label),
                    }))
                  }
                />
              </Panel>

              <Panel header="Units">
                <RefinementList
                  attribute="units"
                  limit={6}
                  showMore
                  transformItems={items => {
                    let res = items.sort((a,b) => +a.label - +b.label).map(item => ({
                      ...item,
                      label: `${item.label} unit${item.label === '1' ? '' : 's'}`
                    }));
                    return res;
                  }}
                />
              </Panel>

              <Panel header="Sort By">
                <SortBy
                  defaultRefinement="courses"
                  items={[
                    { value: 'courses', label: 'Best match' },
                    { value: 'courses_number_asc', label: 'Course number' },
                  ]}
                />
              </Panel>
            </div>
          </Sticky>

          <div className="search-panel__results">
            <div className="search-panel__query">
              <SearchBox
                className="search-panel__searchbox"
                translations={{placeholder: "Search by course number, title, description, anything really..."}}
                showLoadingIndicator
              />
              <div className="search-panel__stats"><Stats /></div>
            </div>

            <Hits store={store} />

            <div className="pagination">
              <Pagination />
            </div>

            <div className="attribution">
              <div>
                <a className="ais-Menu-link" href="https://github.com/theopolisme/fast-courses">open source</a>
                {' '}&middot;{' '}
                <a className="ais-Menu-link" href="mailto:tcp@stanford.edu">questions?</a>
              </div>
              <div>* not affiliated with Stanford University</div>
            </div>

          </div>

          <Sticky className="search-panel__right">
            <RightPanel updateSearchState={onSearchStateChange} />
          </Sticky>
        </div>
      </InstantSearch>
    </div>
  );
};

export default App;
