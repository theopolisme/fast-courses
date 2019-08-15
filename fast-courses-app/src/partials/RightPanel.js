import React from 'react';
import WeekCalendar from './WeekCalendar';
import {
  Panel,
} from 'react-instantsearch-dom';

import ColorHash from 'color-hash';
import { useStore } from '../store';

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

const TermView = ({ term, classes, updateSearchState }) => {
  let minTime, maxTime;

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
          title: c.number,
          start: `${date}T${start}`,
          end: `${date}T${end}`,
          color: colorHash.hex(c.number),
          url: `?query=${c.number}`
        });
      });
    });
    return events;
  }, []);

  return (
    <Panel header={term.term}>
      <WeekCalendar
        events={events}
        minTime={minTime}
        maxTime={maxTime}
        onClick={event => {
          updateSearchState({ query: event.title });
        }}
      />
    </Panel>
  );
}

const RightPanel = ({ updateSearchState, ...rest }) => {
  const { getClassesForTerm } = useStore();

  return (
    <div {...rest}>
      {CURRENT_TERMS.map(t => (
        <TermView
          key={t.termId}
          term={t}
          classes={getClassesForTerm(t.termId)}
          updateSearchState={updateSearchState}
        />
      ))}
    </div>
  );
}

export default RightPanel;
