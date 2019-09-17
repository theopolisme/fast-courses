import React, { useState, useCallback } from 'react';
import Modal from 'react-modal';

import { useLockBodyScroll } from '../util';

export default ({ onClose, children, ...props }) => {
  useLockBodyScroll();

  if (!onClose && props.history) {
    onClose = () => props.history.push('/');
  }

  return (
    <Modal
      isOpen={true}
      className="modal__basic"
      overlayClassName="modal__overlay modal__basic__overlay"
      onRequestClose={onClose}
    >
      <div className="hit">
        {React.cloneElement(children, props)}
      </div>
    </Modal>
  );
}
