import React, { useState } from 'react';
import ReactGA from 'react-ga';
import qs from 'qs';
import * as util from '../util';

import Histogram from './Histogram';
import Score from './Score';

const Hit = ({ hit, store }) => {
  const { hasClass, addClass, removeClass, getExtendedData } = store;
  const [open, setOpen] = useState(false);
  const [reviewFilter, setReviewFilter] = useState('');

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
        {hit.title}{' '}
        <Score score={hit.currentScore} count={hit.currentScoreCount} latest />
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
          const schedules = section.schedules.some(s => s.days) ? section.schedules.filter(s => s.days) : section.schedules;

          return (
            <div key={sectionId} className="hit__schedule__entry" onClick={onClick}>
              <span className="hit__star">{starred ? '★' : '☆'}</span>{' '}
              <span className="hit__schedule__term">{util.parseTerm(section.term).season}</span>{' '}&middot;{' '}{section.component}{' '}&middot;{' '}
              {schedules.map(schedule => {
                return (
                  <span key={schedule.location}>
                    <span className="hit__schedule_time">{util.formatScheduleDayTime(schedule)}</span>
                    {' '}&middot;{' '}{schedule.location || 'no location'}{' '}&middot;{' '}
                    {!schedule.instructors || schedule.instructors.length === 0 ? 'no instructor' : ''}
                    {util.intersperse((schedule.instructors || []).map(i => {
                      const target = {"refinementList":{"sections.schedules.instructors.name":[i.name]}};
                      return (
                        <a
                          key={i.sunet}
                          className="hit__instructor"
                          rel="noopener noreferrer"
                          target="_blank"
                          onClick={e => e.stopPropagation()}
                          href={`?${qs.stringify(target)}`}
                        >{i.name}</a>
                      );
                    }), '; ')}
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
          <ReactGA.OutboundLink
            eventLabel={`exploreCourses:${hit.number}`}
            className="ais-Menu-link"
            rel="noopener noreferrer"
            target="_blank"
            to={`https://explorecourses.stanford.edu/search?view=catalog&filter-coursestatus-Active=on&page=0&q=${hit.subject}${hit.code}`}
          >
            explorecourses
          </ReactGA.OutboundLink>
          {' '}&middot;{' '}
          <ReactGA.OutboundLink
            eventLabel={`carta:${hit.number}`}
            className="ais-Menu-link"
            rel="noopener noreferrer"
            to={`https://carta.stanford.edu/course/${hit.number}/${hit.sections.length ? hit.sections[0].termId : ''}`}
            target="_blank"
          >
            carta
          </ReactGA.OutboundLink>
        </div>
      </div>

      <div
        className={`hit__reviews ${open ? '' : 'closed'} ${!hit.numReviews ? 'disabled' : ''}`}
        onClick={(open || !hit.numReviews) ? null : () => setOpen(true)}
      >
        {open ?
          (() => {
            const data = getExtendedData(hit.objectID);

            if (data.loading) {
              return (
                <div>Loading course stats & reviews...</div>
              );
            } else if (data.error) {
              return (
                <div>Unable to load: {data.error}</div>
              );
            } else if (!data.reviews || data.reviews.length === 0) {
              return (
                <div>No reviews available :(</div>
              );
            }

            const filteredReviews = data.reviews.filter(reviewFilter ? r => r.review.toLowerCase().indexOf(reviewFilter.toLowerCase()) !== -1 : () => true);

            return (
              <React.Fragment>
                <div className="hit__reviews__close" onClick={() => setOpen(false)}>✕</div>
                <div className="hit__reviews__left">
                  <div className="hit__reviews__input">
                    <input className="ais-SearchBox-input" type="text" placeholder="Filter reviews..." value={reviewFilter} onChange={e => setReviewFilter(e.target.value)} />
                    {' '}<span>{filteredReviews.length} review{filteredReviews.length === 1 ? '' : 's'} shown</span>
                  </div>
                  <div className="hit__reviews__list">
                    {filteredReviews.map(r => {
                      return (
                        <div key={r.id}>{r.review} <small>{r.term}</small></div>
                      );
                    })}
                  </div>
                </div>
                <div className="hit__reviews__right">
                  <div className="hit__reviews__header">Hours spent per week</div>
                  <Histogram className="hit__reviews__histogram" min={0} max={35} bucketSize={5} values={data.hours} height={50} />
                  <div className="hit__reviews__header">Historical ratings</div>
                  {hit.scoreHistory.map(({ term, instructor, score, count }) => (
                    <div key={`${term}${instructor}`} className="hit__reviews__historical">
                      <Score score={score} count={count} />
                      <div className="hit__reviews__historical__detail"><div>{term}</div><div>{instructor}</div></div>
                    </div>
                  ))}
                </div>
              </React.Fragment>
            );
          })()
        : hit.numReviews ?
          <div className="hit__reviews__trigger">Expand for {hit.numReviews} recent student review{hit.numReviews === 1 ? '' : 's'}</div>
        :
          <div className="hit__reviews__trigger">No reviews available</div>
        }
      </div>
    </div>
  );
}

export default Hit;
