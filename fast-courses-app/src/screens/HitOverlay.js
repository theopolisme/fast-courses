import React, { useState, useCallback } from 'react';
import Modal from 'react-modal';
import Hit from '../partials/Hit';

import { useLockBodyScroll } from '../util';

export default ({ onClose, ...props }) => {
  useLockBodyScroll();

  if (props.match && props.match.params.courseId) {
    const id = props.match.params.courseId.split('-');
    props.fetchCourseId = id[id.length - 1];
  }

  if (!onClose && props.history) {
    onClose = () => props.history.push('/');
  }

  if (props.fetchCourseId) {
    const hit = props.store.getCourse(props.fetchCourseId);
    if (!hit.loading) {
      props.hit = hit;
    }
  }

  if (!props.hit) { return <div />; }

  return (
    <Modal
      isOpen={true}
      className="modal__basic"
      overlayClassName="modal__overlay modal__basic__overlay"
      onRequestClose={onClose}
    >
      <Hit fromOverlay={true} onViewInPlannerClick={!props.fetchCourseId && onClose} onClose={onClose} {...props} />
    </Modal>
  );
}
