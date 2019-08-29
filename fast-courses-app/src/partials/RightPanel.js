import React from 'react';
import WeekCalendar from './WeekCalendar';
import {
  Panel,
} from 'react-instantsearch-dom';
import ReactTooltip from 'react-tooltip'

import * as util from '../util';

import ColorHash from 'color-hash';

const colorHash = new ColorHash();

const CURRENT_TERMS = [
  {
    termId: '1202',
    term: '2019-2020 Autumn'
  },
  {
    termId: '1204',
    term: '2019-2020 Winter'
  },
  {
    termId: '1206',
    term: '2019-2020 Spring'
  },
]

const makeDate = offset => `2019-01-${13 + offset}`;
const makeTime = seconds => {
  const totalMinutes = seconds / 60;
  const hours = Math.floor(totalMinutes / 60).toFixed();
  const minutes = Math.floor(totalMinutes % 60).toFixed();
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`;
};

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TermView = ({ term, classData, updateSearchState }) => {
  let minTime, maxTime;

  const { classes, courses, indexedCourses } = classData;

  const events = classes.reduce((events, c) => {
    c.schedules.forEach(schedule => {
      if (!schedule.days) return;
      schedule.days.split(' ').forEach(day => {
        const date = makeDate(DAYS.indexOf(day)),
          start = makeTime(schedule.startTimestamp),
          end = makeTime(schedule.endTimestamp);

        if (!minTime || start < minTime) minTime = start.replace(/:\d{2}:/, ':00:');
        if (!maxTime || end > maxTime) maxTime = end.replace(/:\d{2}:/, ':59:');

        events.push({
          title: `${c.number}${indexedCourses[c.number].multiple ? ` (${c.component})` : ''}`,
          start: `${date}T${start}`,
          end: `${date}T${end}`,
          color: colorHash.hex(c.number),
          url: `?query=${c.number}`,
          extendedProps: c
        });
      });
    });
    return events;
  }, []);

  const invisibleCourses = courses.filter(c => !c.schedules.length || c.schedules.every(s => !s.days));

  const totalUnits = courses.reduce((t, c) => t + c.units, 0);

  const unitsSummary = courses.length ?
    `${courses.sort((a, b) => b.units - a.units).map(c => `${c.number}: ${c.units} units`).join('<br>')}`
    : 'No classes yet';

  return (
    <Panel header={<span>{term.term} <span className="term_header__units" data-tip={unitsSummary}>{totalUnits} units</span></span>}>
      <WeekCalendar
        events={events}
        minTime={minTime}
        maxTime={maxTime}
        onClick={course => {
          updateSearchState({ query: course.number });
        }}
      />
      {invisibleCourses.length ?
        <div className="term__invisible">
          Not yet scheduled:
          {' '}{util.intersperse(invisibleCourses.map(c => (
            <a
              href={`?query=${c.number}`}
              onClick={e => {
                if (!e.metaKey) {
                  e.preventDefault();
                  updateSearchState({ query: c.number })
                }
              }}
            >{c.number}</a>
          )), ', ')}
        </div>
      : null}
    </Panel>
  );
}

const RightPanel = ({ updateSearchState, getClassesForTerm, ...rest }) => {
  return (
    <div {...rest}>
      {CURRENT_TERMS.map(t => (
        <TermView
          key={t.termId}
          term={t}
          classData={getClassesForTerm(t.termId)}
          updateSearchState={updateSearchState}
        />
      ))}
      <ReactTooltip effect="solid" multiline={true} />
    </div>
  );
}

export default RightPanel;
