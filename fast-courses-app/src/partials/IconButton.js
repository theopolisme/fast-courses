import React from 'react';

const ICONS = {
  calendar: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#3a4570"><path d="M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z"/><path fill="none" d="M0 0h24v24H0z"/></svg>,
  filter: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#3a4570"><path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/><path d="M0 0h24v24H0z" fill="none"/></svg>,
  zoom_in: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#3a4570"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/><path fill="none" d="M0 0h24v24H0V0z"/><path d="M12 10h-2v2H9v-2H7V9h2V7h1v2h2v1z"/></svg>,
}

const IconButton = ({ icon, onClick }) => {
  return (
    <span className="icon-button" onClick={onClick}>{ICONS[icon]}</span>
  );
};

export default IconButton;
