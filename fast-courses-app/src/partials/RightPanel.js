import React, { useState } from 'react';
import {
  Panel,
} from 'react-instantsearch-dom';
import ReactTooltip from 'react-tooltip'
import { Link } from 'react-router-dom';

import WeekCalendar from './WeekCalendar';
import IconButton from './IconButton';

import * as util from '../util';
import { CURRENT_TERMS } from '../config';

import ColorHash from 'color-hash';

const colorHash = new ColorHash();

const makeDate = offset => `2019-01-${13 + offset}`;
const makeTime = seconds => {
  const totalMinutes = seconds / 60;
  const hours = Math.floor(totalMinutes / 60).toFixed();
  const minutes = Math.floor(totalMinutes % 60).toFixed();
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`;
};

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TermView = ({ term, classData, history, setOpenTerm }) => {
  const [collapsed, setCollapsed] = useState(term.collapseAfter ? Date.now() > term.collapseAfter : false);

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
          url: util.makeCourseLink(c),
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
    <Panel
      className={collapsed ? 'collapsed' : ''}
      header={
        <span className="term_header" onClick={() => setCollapsed(!collapsed)}>
          {term.term}
          {/* &nbsp;<IconButton icon="edit" onClick={() => setOpenTerm(term.termId)} />&nbsp; */}
          <span className="term_header__units" data-tip={unitsSummary}>{totalUnits} units</span>
        </span>
      }
    >
      <WeekCalendar
        events={events}
        minTime={minTime}
        maxTime={maxTime}
        onClick={course => {
          history.push(util.makeCourseLink(course));
        }}
      />
      {invisibleCourses.length ?
        <div className="term__invisible">
          Not yet scheduled:
          {' '}{util.intersperse(invisibleCourses.map(c => (
            <Link
              to={util.makeCourseLink(c)}
            >{c.number}</Link>
          )), ', ')}
        </div>
      : null}
    </Panel>
  );
}

const RightPanel = ({ history, getClassesForTerm, ...rest }) => {
  const [openTerm, setOpenTerm] = useState(null);

  return (
    <div {...rest}>
      {CURRENT_TERMS.map(t => (
        <TermView
          key={t.termId}
          term={t}
          classData={getClassesForTerm(t.termId)}
          history={history}
          setOpenTerm={setOpenTerm}
        />
      ))}
      <ReactTooltip effect="solid" multiline={true} />
    </div>
  );
}

export default RightPanel;
