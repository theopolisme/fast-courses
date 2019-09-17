import React, { useState } from 'react';
import ReactGA from 'react-ga';
import { Link } from 'react-router-dom';
import qs from 'qs';
import * as util from '../util';
import { authenticate } from '../auth';

import IconButton from './IconButton';
import Histogram from './Histogram';
import Score from './Score';

const Hit = ({ hit, store, showExtended, hideSchedule, hiddenScheduleYear, onViewInPlannerClick, fromOverlay, onClose }) => {
  const { hasClass, addClass, removeClass, getExtendedData } = store;
  const [open, setOpen] = useState(!!showExtended);
  const [reviewFilter, setReviewFilter] = useState('');

  const tooManySections = hit.tooManySections || hit.totalSections > hit.sections.length;
  const filterLectureOnly = hit.filterLectureOnly || (tooManySections && hit.sections.some(s => s.component === 'LEC') && hit.sections.some(s => s.component === 'DIS'));
  let sections = util.sortTerms(hit.sections, s => s.term, s => s.sectionNumber);

  if (filterLectureOnly) {
    sections = sections.filter(s => s.component === 'LEC');
  }

  const isPlanned = store.plannerHasCourse(hit.objectID);

  const data = open ? getExtendedData(hit.objectID) : {};

  const courseLink = `/courses/${hit.number.replace(/[^a-z0-9]/i, '')}/${hit.objectID}`;

  return (
    <div className="hit">
      <div className="hit__header">
        {fromOverlay && <div className="hit__reviews__close" onClick={onClose}>✕</div>}
        <span className="hit__header__text">
          <span className="hit__header__number">{hit.number}</span>{': '}
          {hit.title}{' '}
          <Score score={hit.currentScore} count={hit.currentScoreCount} latest />
        </span>
        {!fromOverlay && <Link to={courseLink} className="hit__header__open"><IconButton icon="open_in_new" /></Link>}
      </div>
      <div className="hit__body">
        {hit.description}
      </div>

      <div className="hit__schedule">
        {hideSchedule ?
          <span>No schedule available for {hiddenScheduleYear || 'this year'}</span>
        : hit.sections.length === 0 ?
          <span>Not scheduled this year</span>
        : sections.map(section => {
          const sectionId = `${hit.number}|${section.classId}`;
          const starred = hasClass(sectionId);
          const onClick = starred ? () => removeClass(sectionId) : () => addClass(sectionId, hit, section);
          const schedules = section.schedules.some(s => s.days) ? section.schedules.filter(s => s.days) : section.schedules;

          return (
            <div key={sectionId} className="hit__schedule__entry" onClick={onClick}>
              <span className="hit__star">{starred ? '★' : '☆'}</span>{' '}
              <span className="hit__schedule__term">{util.parseTerm(section.term).season}</span>{' '}&middot;{' '}{section.component}{' '}&middot;{' '}
              {util.intersperse(schedules.map(schedule => {
                return (
                  <span key={`${schedule.location}${schedule.days}${schedule.startTimestamp}`}>
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
              }), '; ')}
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
        <div className="hit__meta__left">
          <strong>{util.makeUnitsString(hit)}</strong>
          {' '}&middot;{' '}
          {hit.grading}
          {hit.gers && hit.gers.length ?
            <React.Fragment>
              {' '}&middot;{' '}
              {util.intersperse(hit.gers.map(g => <span style={{whiteSpace: 'nowrap'}}>{g}</span>), ', ')}
            </React.Fragment>
          : null}
        </div>

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
          <span className="planner-link-container">
            {' '}&middot;{' '}
            <Link
              className={`ais-Menu-link plan-button${isPlanned ? ' planned' : ''}`}
              to="/planner"
              onClick={!isPlanned ? e => { e.preventDefault(); e.stopPropagation(); store.addPlannerCourse('staging', hit); } : (onViewInPlannerClick || undefined)}
            >{isPlanned ? 'show in planner': 'plan'}</Link>
          </span>
        </div>
      </div>

      <div
        className={`hit__reviews${open ? '' : ' closed'}${!hit.numReviews ? ' disabled' : ''}${data.loading ? ' ui fluid placeholder' : ''}`}
        onClick={(open || !hit.numReviews) ? null : () => setOpen(true)}
      >
        {open ?
          (() => {
            if (data.loading) {
              return (
                <div>&nbsp;</div>
              );
            } else if (data.error) {
              const needsReuath = data.error.message === 'Not authorized';
              return (
                <div>Unable to load: {data.error.message || data.error}{needsReuath ? <React.Fragment> &ndash; <a href="#" onClick={e => { e.preventDefault(); authenticate(); }}>re-authenticate</a></React.Fragment> : null}</div>
              );
            } else if (!data.reviews || data.reviews.length === 0) {
              return (
                <div>No reviews available :(</div>
              );
            }

            const filteredReviews = data.reviews.filter(reviewFilter ? r => r.review.toLowerCase().indexOf(reviewFilter.toLowerCase()) !== -1 : () => true);

            return (
              <React.Fragment>
                {!showExtended && <div className="hit__reviews__close" onClick={() => setOpen(false)}>✕</div>}
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
          <div className="hit__reviews__trigger">Expand for {hit.numReviews} recent student review{hit.numReviews === 1 ? '' : 's'} + detailed stats</div>
        :
          <div className="hit__reviews__trigger disabled">No reviews available</div>
        }
      </div>
    </div>
  );
}

export default Hit;
