import React from 'react'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'

const Calendar = ({ history, events, minTime, maxTime, onClick }) => {
  return (
    <div className="calendar">
      <FullCalendar
        defaultView="timeGridWeek"
        plugins={[ timeGridPlugin ]}
        weekends={false}
        allDaySlot={false}
        header={{
          left: '',
          right: '',
          center: '',
        }}
        minTime={minTime || "10:00:00"}
        maxTime={maxTime || "16:00:00"}
        contentHeight="auto"
        columnHeaderFormat={{ weekday: 'short' }}
        defaultDate="2019-01-14"
        slotDuration="00:30:00"
        slotLabelInterval={{hours: 1}}
        displayEventTime={false}
        events={events}
        eventClick={info => {
          if (!info.jsEvent.metaKey) {
            info.jsEvent.preventDefault();
            onClick(info.event);
          }
        }}
      />
    </div>
  );
}

export default Calendar;
