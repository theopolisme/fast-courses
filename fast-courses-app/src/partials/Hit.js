import React from 'react';
import * as util from '../util';

const Hit = ({ hit, store }) => {
  const { hasClass, addClass, removeClass } = store;

  const tooManySections = hit.totalSections > hit.sections.length;
  const filterLectureOnly = tooManySections && hit.sections.some(s => s.component === 'LEC') && hit.sections.some(s => s.component === 'DIS');
  let sections = util.sortTerms(hit.sections, s => s.term, s => s.sectionNumber);

  if (filterLectureOnly) {
    sections = sections.filter(s => s.component === 'LEC');
  }

  return (
    <div className="hit">
      <div className="hit__header">
        <span className="hit__header__number">{hit.number}</span>{': '}
        {hit.title}
      </div>
      <div className="hit__body">
        {hit.description}
      </div>

      <div className="hit__schedule">
        {hit.sections.length === 0 ?
          <span>Not scheduled this year</span>
        : null}
        {sections.map(section => {
          const sectionId = `${hit.number}|${section.classId}`;
          const starred = hasClass(sectionId);
          const onClick = starred ? () => removeClass(sectionId) : () => addClass(sectionId, hit, section);

          return (
            <div key={`${sectionId}`} className="hit__schedule__entry" onClick={onClick}>
              <span className="hit__star">{starred ? '★' : '☆'}</span>{' '}
              <span className="hit__schedule__term">{util.parseTerm(section.term).season}</span>{' '}&middot;{' '}{section.component}{' '}&middot;{' '}
              {section.schedules.map(schedule => {
                return (
                  <span key={schedule.location}>
                    <span className="hit__schedule_time">{util.formatScheduleDayTime(schedule)}</span>
                    {' '}&middot;{' '}{schedule.location || 'no location'}{' '}&middot;{' '}
                    {!schedule.instructors || schedule.instructors.length === 0 ? 'no instructor' : ''}
                    {util.intersperse((schedule.instructors || []).map(i => <a key={i.sunet} className="hit__instructor" onClick={e => e.stopPropagation()} href={`mailto:${i.sunet}@stanford.edu`}>{i.name}</a>), '; ')}
                  </span>
                );
              })}
            </div>
          );
        })}
        {filterLectureOnly ?
          <i>** There are {hit.totalSections} total sections; only LEC sections are shown here &ndash; check explorecourses **</i>
        : tooManySections ?
          <i>** There are {hit.totalSections} total sections; only {hit.sections.length} are shown **</i>
        : null}
      </div>

      <div className="hit__meta">
        <strong>{hit.unitsMin === hit.unitsMax ? hit.unitsMin : `${hit.unitsMin}-${hit.unitsMax}`} {hit.unitsMax !== '1' ? 'units' : 'unit'}</strong>
        {' '}&middot;{' '}
        {hit.grading}

        <div className="hit__actions">
          <a className="ais-Menu-link" rel="noopener noreferrer" target="_blank" href={`https://explorecourses.stanford.edu/search?view=catalog&filter-coursestatus-Active=on&page=0&q=${hit.subject}${hit.code}`}>explorecourses</a>
          {' '}&middot;{' '}
          <a className="ais-Menu-link" rel="noopener noreferrer" target="_blank" href={`https://carta.stanford.edu/course/${hit.number}/${hit.sections.length ? hit.sections[0].termId : ''}`}>carta</a>
        </div>
      </div>
    </div>
  );
}

export default Hit;
