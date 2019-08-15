export function formatDays(days) {
  return days.replace(/\w+/g, w => {
    if (w === 'Tuesday') return 'Tues';
    if (w === 'Thursday') return 'Thur';
    return w.substring(0, 3);
  });
}

export function formatTime(seconds) {
  const minutes = seconds / 60;
  const h = Math.floor(minutes / 60).toFixed(0);
  const m = Math.floor(minutes % 60).toFixed(0);
  const pm = h >= 12;
  return `${h >= 13 ? h - 12 : h}:${m.padStart(2, '0')} ${pm ? 'pm' : 'am'}`;
}

export function formatTimeRange(start, end) {
  return `${formatTime(start)} - ${formatTime(end)}`
}

export function formatScheduleDayTime(schedule) {
  if (!schedule.days) { return 'times not available'; }
  return `${formatDays(schedule.days)} ${formatTimeRange(schedule.startTimestamp, schedule.endTimestamp)}`
}

const termIndices = {
  'Autumn': 0,
  'Winter': 1,
  'Spring': 2,
  'Summer': 3
}

export function parseTerm(term) {
  const year = term.substring(0, 9);
  const season = term.substring(10);
  return {
    label: term,
    season: season.substring(0, 3),
    sortKey: `${year}-${termIndices[season]}`
  };
}

export function sortTerms(arr, getter, secondary) {
  const getSortKey = v => {
    return `${parseTerm(getter(v)).sortKey}${secondary ? secondary(v) : ''}`
  };

  return arr.sort((a, b) => {
    return getSortKey(a).localeCompare(getSortKey(b));
  });
}

export function intersperse(arr, sep) {
  if (arr.length === 0) {
    return [];
  }

  return arr.slice(1).reduce(function(xs, x, i) {
    return xs.concat([sep, x]);
  }, [arr[0]]);
}
