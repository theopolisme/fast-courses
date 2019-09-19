import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import Hit from '../partials/Hit';

import { useLockBodyScroll } from '../util';

export default ({ onClose, ...props }) => {
  useLockBodyScroll();

  let fetchCourse;
  if (props.match && props.match.params.courseId) {
    fetchCourse = { id: props.match.params.courseId };
  } else if (props.match && props.match.params.slug) {
    fetchCourse = { slugName: props.match.params.slug };
  }

  if (!onClose && props.history) {
    onClose = () => props.history.push('/');
  }

  if (fetchCourse) {
    const hit = props.store.getCourse(fetchCourse);
    if (!hit.loading) {
      props.hit = hit;
    }
  }

  useEffect(() => {
    if (props.match && !props.match.params.courseId && props.hit && props.hit.objectID) {
      props.history.replace(`/courses/${props.match.params.slug}/${props.hit.objectID}`);
    }
  }, [props.match, props.hit]);

  if (!props.hit) { return <div />; }

  return (
    <Modal
      isOpen={true}
      className="modal__basic"
      overlayClassName="modal__overlay modal__basic__overlay"
      onRequestClose={onClose}
    >
      {props.hit.error ?
        <div className="hit hit__error">
          <div className="hit__reviews__close" onClick={onClose}>✕</div>
          {props.hit.error}
        </div>
      :
        <Hit fromOverlay={true} onViewInPlannerClick={!fetchCourse && onClose} onClose={onClose} {...props} />
      }
    </Modal>
  );
}
