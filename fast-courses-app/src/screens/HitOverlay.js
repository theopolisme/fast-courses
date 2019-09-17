import React, { useState, useCallback } from 'react';
import Modal from 'react-modal';
import Hit from '../partials/Hit';

export default ({ onClose, ...rest }) => {
  return (
    <Modal
      isOpen={true}
      className="modal__basic"
      overlayClassName="modal__overlay modal__basic__overlay"
      onRequestClose={onClose}
    >
      <Hit onViewInPlannerClick={onClose} {...rest} />
    </Modal>
  );
}
