import React, { useState, useEffect, useRef } from 'react';
import {
  InstantSearch,
  SearchBox,
  Pagination,
  ClearRefinements,
  RefinementList,
  Panel,
  Stats,
  SortBy,
  RangeInput,
} from 'react-instantsearch-dom';
import qs from 'qs';
import ReactGA from 'react-ga';
import ReactSidebar from 'react-sidebar';
import { Link, Route } from 'react-router-dom';

import { useAuth } from './auth';
import { searchClient, useStore } from './store';
import * as util from './util';

import Planner from './screens/Planner';
import HitOverlay from './screens/HitOverlay';
import Terms from './screens/Terms';
import Privacy from './screens/Privacy';

import IconButton from './partials/IconButton';
import Hits from './partials/Hits';
import RightPanel from './partials/RightPanel';
import CustomRangeSlider from './partials/CustomRangeSlider';

import 'instantsearch.css/themes/algolia.css';
import './App.css';

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

const Header = React.forwardRef(({ user, onTitleClick, ...rest }, ref) => (
  <>
    <header className="header" ref={ref} {...rest}>
      <h1 className="header-title">
        <a
          href="/"
          onClick={(e) => {
            if (!e.metaKey) {
              e.preventDefault();
              onTitleClick();
            }
          }}
        >
          fast-courses<span>▸</span>
        </a>
      </h1>
      <p className="header-subtitle">
        a better way to search Stanford courses*{' '}
        <span className="mobile-note"></span>
      </p>
      <p className="header-actions">
        <Link to="/planner">
          planner <span className="header-actions__label">beta</span>
        </Link>
        <span className="header-actions__spacer" />
        <span className="header-user">{user.name}</span>
      </p>
    </header>
    <div className="callout">
      Now updated for the 2020-2021 academic year! <i>Have you considered taking a gap year?</i>
    </div>
  </>
));

const Welcome = ({ show, onDismiss }) => (
  show ?
    <div className="hit hit__welcome">
      <div className="hit__reviews__close" onClick={onDismiss}>✕</div>
      <div className="hit__body">
        <div>
          <strong>Welcome to a better way to discover Stanford courses.</strong> fast-courses is like ExploreCourses meets Carta... 1000x faster.

          <ol>
            <li>Search above by course number, title, description, etc.</li>
            <li>Filter and sort by term, Ways, and more using the lefthand sidebar</li>
            <li>Click "Expand for recent student reviews" at the bottom of any result to read what other Stanford students have to say about it</li>
            <li>Pin classes to this year's schedule by clicking the ☆ next to the time</li>
            <li>Plan classes for future years (on desktop) by clicking <span className="plan-button-example">plan</span> at the bottom right</li>
          </ol>

          This is an evolving project &ndash; please send feedback and feature requests!
        </div>
      </div>
    </div>
  :
    null
);

const sortTerms = items => util.sortTerms(items, t => t.label);
const sortScheduleDays = items =>
  items.map(item => ({
    ...item,
    label: util.formatDays(item.label),
  }));
const sortUnits = items => {
  let res = items.sort((a,b) => +a.label - +b.label).map(item => ({
    ...item,
    label: `${item.label} unit${item.label === '1' ? '' : 's'}`
  }));
  return res;
};

const App = ({ location, history }) => {
  const { user } = useAuth({ autoAuthenticate: true });
  const [searchState, setSearchState] = useState(urlToSearchState(location));
  const [debouncedSetState, setDebouncedSetState] = useState(null);
  const ref = useRef(null);

  const isMobile = util.useMedia(['(max-width: 980px)'], [true], false);
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);

  const [hasVisited, setHasVisited] = util.useLocalStorage('fastcourses__hasvisited', false);
  const [hasDismissedWelcome, setHasDismissedWelcome] = util.useLocalStorage('fastcourses__hasdismissedwelcome', false);
  const [showWelcome, setShowWelcome] = useState(!hasDismissedWelcome);

  // Check if active query / filters applied
  const { fbclid, ...searchQueryState } = searchState;
  const hasActiveQuery = Object.keys(searchQueryState).length;

  // Trigger an initial state change to update log
  useEffect(() => {
    setHasVisited(true);
    onSearchStateChange(searchState, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onWelcomeDismiss = () => {
    setShowWelcome(false);
    setHasDismissedWelcome(true);
  };

  const onSearchStateChange = (updatedSearchState, initial) => {
    // Handle scroll
    if (!initial && ref && ref.current) {
      const top = ref.current.getBoundingClientRect().height + (isMobile ? 16 : 32);
      if (isMobile || window.scrollY >= top) {
        (isMobile ? document.getElementById('appContent') : window).scrollTo(0, top);
      }
    }

    if (!initial || (hasVisited && hasActiveQuery)) {
      setShowWelcome(false);
    }

    // Debounced URL update
    clearTimeout(debouncedSetState);
    setDebouncedSetState(
      setTimeout(() => {
        history.push(searchStateToUrl({ location }, updatedSearchState), updatedSearchState);
      }, DEBOUNCE_TIME)
    );

    // Update rendered state
    setSearchState(updatedSearchState);

    // Analytics
    const page = `/?query=${updatedSearchState.query}`;
    ReactGA.set({ page: page });
    ReactGA.pageview(page);
  };

  const store = useStore({ user });

  // Render nothing until authenticated
  if (!user) {
    return <div />;
  }

  const SidebarContainer = isMobile ? 'div' : Sticky;

  const PageLeftPanel = (
    <SidebarContainer className="search-panel__filters">
      <div>
        <ClearRefinements />

        <Panel header="Term">
          <RefinementList
            attribute="sections.term"
            transformItems={sortTerms}
          />
        </Panel>

        <Panel header="WAYS / GERs">
          <RefinementList
            attribute="gers"
            searchable
            limit={5}
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
            transformItems={sortScheduleDays}
          />
        </Panel>

        <Panel header="Units">
          <RefinementList
            attribute="units"
            limit={6}
            showMore
            transformItems={sortUnits}
          />
        </Panel>

        <Panel header="Course number">
          <RangeInput attribute="numberInt" />
        </Panel>

        <Panel header="Course suffix">
          <RefinementList
            attribute="numberSuffix"
            searchable
            limit={5}
            showMore
          />
        </Panel>

        {false &&
          <React.Fragment>
            <Panel header="Max class size">
              <RangeInput attribute="sections.maxClassSize" />
            </Panel>

            <Panel header="Current class size">
              <RangeInput attribute="sections.currentClassSize" />
            </Panel>

            <Panel header="Start time">
              <CustomRangeSlider
                attribute="sections.schedules.startTimestamp"
                min={0}
                max={50000}
              />
            </Panel>
          </React.Fragment>
        }

        <Panel header="Sort By">
          <SortBy
            defaultRefinement="courses"
            items={[
              { value: 'courses', label: 'Best match' },
              { value: 'courses_number_asc', label: 'Course number' },
              { value: 'courses_raw_rating_desc', label: 'Raw rating' },
            ]}
          />
        </Panel>
      </div>
    </SidebarContainer>
  );

  const PageRightPanel = (
    <SidebarContainer className="search-panel__right">
      <RightPanel history={history} getClassesForTerm={store.getClassesForTerm} />
    </SidebarContainer>
  );

  const PageContent = (
    <div>
      <style>{'#loader { display: none; }'}</style>
      <Header
        ref={ref}
        user={user}
        onTitleClick={() => {
          history.push('/');
          onSearchStateChange({});
        }}
      />
      <div className="search-panel">
        {!isMobile && PageLeftPanel}
        <div className="search-panel__results">
          <div className="search-panel__query">
            <div className="search-panel__searchbox">
              {isMobile && (
                <IconButton icon="filter" onClick={() => setLeftOpen(true)} />
              )}
              <SearchBox
                translations={{
                  placeholder:
                    'Search by course number, title, description, anything really...',
                }}
                showLoadingIndicator
              />
              {isMobile && (
                <IconButton
                  icon="calendar"
                  onClick={() => setRightOpen(true)}
                />
              )}
            </div>
            <div className="search-panel__stats">
              <Stats />
            </div>
          </div>

          <Welcome show={showWelcome} onDismiss={onWelcomeDismiss} />

          <Hits store={store} />

          <div className="pagination">
            <Pagination />
          </div>

          <div className="attribution">
            <div>
              {util.intersperse(
                [
                  <a
                    className="ais-Menu-link"
                    href="https://github.com/theopolisme/fast-courses"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    open source
                  </a>,
                  <Link className="ais-Menu-link" to="/terms">
                    terms
                  </Link>,
                  <Link className="ais-Menu-link" to="/privacy">
                    privacy
                  </Link>,
                  <a className="ais-Menu-link" href="mailto:tcp@stanford.edu">
                    questions?
                  </a>,
                ],
                <React.Fragment> &middot; </React.Fragment>
              )}
            </div>
            <div>* not affiliated with Stanford University</div>
          </div>
        </div>
        {!isMobile && PageRightPanel}
      </div>
    </div>
  );

  let body;

  if (isMobile) {
    const sidebarStyles = {sidebar: {zIndex: 999}, overlay: {zIndex: 998}};
    body = (
      <ReactSidebar open={leftOpen} onSetOpen={setLeftOpen} sidebar={PageLeftPanel} styles={sidebarStyles}>
      <ReactSidebar open={rightOpen} onSetOpen={setRightOpen} pullRight sidebar={PageRightPanel} styles={sidebarStyles} contentId="appContent">
        {PageContent}
      </ReactSidebar>
      </ReactSidebar>
    );
  } else {
    body = <div id="appContent">{PageContent}</div>;
  }

  return (
    <InstantSearch
      searchClient={searchClient}
      indexName="courses"
      searchState={searchState}
      onSearchStateChange={onSearchStateChange}
      createURL={createURL}
    >
      <Route path={`/planner`} render={props => <Planner {...props} store={store} />} />
      <Route path={`/courses/:slug/:courseId?`} render={props => <HitOverlay {...props} showExtended={true} store={store} />} />
      <Route path={`/terms`} render={props => <Terms {...props} />} />
      <Route path={`/privacy`} render={props => <Privacy {...props} />} />
      {body}
    </InstantSearch>
  );
};

export default App;
