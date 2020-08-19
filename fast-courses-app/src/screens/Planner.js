import React, { useState } from 'react';
import Modal from 'react-modal';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import Autocomplete from 'algolia-react-autocomplete';
import ReactTooltip from 'react-tooltip';

import { makeTerms, CURRENT_YEAR } from '../config';
import { searchIndex } from '../store';
import * as util from '../util';

import IconButton from '../partials/IconButton';
import Score from '../partials/Score';

import HitOverlay from './HitOverlay';

import "algolia-react-autocomplete/build/css/index.css";
import './Planner.css';

import ColorHash from 'color-hash';

const colorHash = new ColorHash();

const AUTOCOMPLETE_INDICES = [
  {
    source: searchIndex,
    displayKey: 'number',
    templates: {
      header: () => <h2 className="aa-suggestions-category">Courses</h2>,
      suggestion: (suggestion, isSelected) => <div data-selected={isSelected}> {suggestion.number}: {suggestion.title}</div>
    }
  },
];

const YEARS_TO_SHOW = 4;

Modal.setAppElement('#root');

const PlannerItem = ({ term, course, index, settings, store }) => {
  const { termId, yearLabel } = term;
  const [overlayShown, setShowOverlay] = useState(false);
  const subjectColor = colorHash.hex(course.subject);

  return (
    <React.Fragment>
      <Draggable draggableId={`${termId}-${course.objectID}`} index={index}>
        {(provided, snapshot) => (
          <div
            className={`planner__section__course${course.starred ? ' starred' : ''}`}
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            style={{ borderLeftColor: subjectColor, ...provided.draggableProps.style }}
            onClick={e => {
              ReactTooltip.hide();
              if (!e.target.classList.contains('action')) {
                setShowOverlay(true);
              }
            }}
            data-tip=''
            data-for={course.objectID}
          >
            <span className="title">
              {settings.show_titles ?
                <React.Fragment><span className="number">{course.number}</span>: {course.title}</React.Fragment>
              :
              <React.Fragment><span className="number">{course.number}</span> <span className="units">{util.makeUnitsString(course)}</span></React.Fragment>
              }
            </span>
            {course.starred ?
              <span className="action star" onClick={e => { store.removeClassesForCourse(termId, course); }}></span> // '★' : '☆'
            :
              <span className="action delete" onClick={e => { store.removePlannerCourse(termId, course.objectID); }}>✕</span>
            }
          </div>
        )}
      </Draggable>
      <ReactTooltip id={course.objectID} className="planner__tooltip" place="right" effect="solid" delayHide={100} clickable getContent={() => {
        return (
          <React.Fragment>
            <div>
              <span className="hit__header__number">{course.number}</span>{': '}
              {course.title}{' '}
              <Score score={course.currentScore} count={course.currentScoreCount} latest />
            </div>
            <div className="planner__tooltip__actions">
              {util.makeUnitsString(course)}
              {' '}&middot;{' '}
              {course.sections.length ?
                `Offered ${CURRENT_YEAR.yearLabel}: ${[...new Set(util.sortTerms(course.sections, s => s.term).map(s => util.parseTerm(s.term).season))].join(', ')}`
              : `Not offered during ${CURRENT_YEAR.yearLabel} academic year`
              }
            </div>
            {/*<div className="planner__tooltip__actions">
              <span onClick={() => setShowOverlay(true)}>View course details</span>
            </div>*/}
          </React.Fragment>
        );
      }}/>
      {overlayShown ?
        <HitOverlay
          hit={course}
          store={store}
          onClose={() => setShowOverlay(false)}
          showExtended
          planTerm={term}
          hideSchedule={termId !== 'staging' && yearLabel !== CURRENT_YEAR.yearLabel}
          hiddenScheduleYear={yearLabel}
        />
      : null}
    </React.Fragment>
  );
};

const PlannerSection = ({ term, staging, label, settings, store }) => {
  const [collapsed, setCollapsed] = useState(!!term.summer);
  const [adding, setAdding] = useState(false);

  const courses = store.getPlannerCoursesForTerm(term.termId);
  const totalUnits = courses.reduce((t, c) => t + +c.unitsMax, 0);

  const addCourse = (result) => {
    setAdding(false);
    store.addPlannerCourse(term.termId, result);
  }

  return (
    <div className={`planner__section${collapsed ? ' collapsed' : ''}`}>
      <div className="planner__section__header" onClick={!staging ? () => setCollapsed(!collapsed) : null}>
        <div className="planner__section__header__label">{label}</div>
        <div className="planner__section__header__terms">{totalUnits} unit{totalUnits === 1 ? '' : 's'} {staging ? 'staged' : 'planned'}</div>
      </div>
      <Droppable droppableId={term.termId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            className={`planner__section__courses${snapshot.isDraggingOver ? ' dragging-over' : ''}`}
            {...provided.droppableProps}
          >
            {courses.map((c, i) => {
              return (
                <PlannerItem
                  key={c.objectID}
                  course={c}
                  term={term}
                  index={i}
                  settings={settings}
                  store={store}
                />
              );
            })}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
      <div className={`planner__section__add_course${adding ? ' adding' :''}`} onClick={() => !adding && setAdding(true)}>
        {adding ?
          <React.Fragment>
            <Autocomplete indexes={AUTOCOMPLETE_INDICES} onSelectionChange={addCourse}>
              <input key="input" type="search" className="aa-input-search" autocomplete="off" autoFocus placeholder="Start typing..."
                onKeyDown={e => { debugger; if (e.keyCode === 27) { e.preventDefault(); e.stopPropagation(); setAdding(false); }}} />
            </Autocomplete>
            <div className="hit__reviews__close" onClick={e => { setAdding(false); e.stopPropagation(); }}>✕</div>
          </React.Fragment>
        :
          <React.Fragment>
            <IconButton icon="add" /> <span className="text">Add another course</span>
          </React.Fragment>
        }
      </div>
    </div>
  );
};

const PlannerColumn = ({ staging, year, store, i, settings }) => {
  const { terms, yearLabel } = staging ? { yearLabel: 'Unassigned' } : makeTerms(year, { includeSummer: true, extended: true });

  return (
    <div className={`planner__column${staging ? ' staging' : ''}`}>
      <div className="planner__column__header">
        {i === 0 && <IconButton style={{position: 'absolute', left: 0, top: -3 }} icon="arrow_back" onClick={() => store.setPlannerStartYear(year - 1)} />}
        <div className="planner__column__header__label">{yearLabel}</div>
        {i === YEARS_TO_SHOW - 1 && <IconButton style={{position: 'absolute', right: 0, top: -3 }} icon="arrow_forward" onClick={() => store.setPlannerStartYear(year - 2)} />}
      </div>
      {staging ?
        <React.Fragment>
          <PlannerSection term={{ termId: 'staging' }} staging={true} label="" settings={settings} store={store} />
          <div className="planner__options">
            <div className="planner__column__header">Options</div>
            <ul className="ais-RefinementList-list">
              <li className="ais-RefinementList-item">
                <label class="ais-RefinementList-label">
                  <input class="ais-RefinementList-checkbox" type="checkbox" checked={settings.show_starred} onChange={(e) => store.setPlannerSettings({ show_starred: e.target.checked })} />
                  <span class="ais-RefinementList-labelText">Show starred courses</span>
                </label>
              </li>
              <li className="ais-RefinementList-item">
                <label class="ais-RefinementList-label">
                  <input class="ais-RefinementList-checkbox" type="checkbox" checked={settings.show_titles} onChange={(e) => store.setPlannerSettings({ show_titles: e.target.checked })} />
                  <span class="ais-RefinementList-labelText">Show course titles</span>
                </label>
              </li>
            </ul>
          </div>
        </React.Fragment>
      :
        terms.map((term, termIndex) => (
          <PlannerSection term={term} label={`${term.label} ${(termIndex === 0 ? year : year + 1).toString()}`} settings={settings} store={store} />
        ))
      }
    </div>
  );
};

const Planner = ({ history, store }) => {
  const onDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    const ids = draggableId.split('-');

    if (destination === null) return; // no-op

    store.movePlannerCourse({
      startTermId: source.droppableId,
      startIndex: source.index,
      destinationTermId: destination.droppableId,
      destinationIndex: destination.index,
      courseId: ids[ids.length - 1],
    })
  };

  const settings = store.getPlannerSettings();
  const startYear = store.getPlannerStartYear();
  const years = Array.from(Array(YEARS_TO_SHOW)).map((_, i) => startYear + i);

  util.useLockBodyScroll();

  return (
    <Modal
      isOpen={true}
      className="modal__modal planner"
      overlayClassName="modal__overlay"
      onRequestClose={() => history.push('/')}
    >
      <div className="hit__reviews__close" onClick={() => history.push('/')}>✕</div>
      <DragDropContext
        onDragEnd={onDragEnd}
      >
        <PlannerColumn staging={true} store={store} settings={settings} />
        {years.map((year, i) => (
          <PlannerColumn key={year} year={year} store={store} settings={settings} i={i} />
        ))}
      </DragDropContext>
    </Modal>
  );
};

export default Planner;
