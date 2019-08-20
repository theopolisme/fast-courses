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

// linear interpolation of hsl at x given (h1, s1%, l1%) at x1 and (h2, s2%, l2%) at x2
export function hsllg(h1,s1,l1, h2,s2,l2, x1,x2,x) {
  var h = h1 + (h2-h1)/(x2-x1)*(x-x1)
  var s = s1 + (s2-s1)/(x2-x1)*(x-x1)
  var l = l1 + (l2-l1)/(x2-x1)*(x-x1)
  return 'hsl(' + h + ', ' + s + '%, ' + l + '%)'
}

export function getColorForScore(score) {
  if (!score) {
    return '#ddd';
  } else if (score > 4.5) {
    // to deeper green #2e7d32 hsl(123, 46%, 34%)
    return hsllg(122,39,49, 123,46,34, 4.5,5, score)
  } else if (score > 4.0) {
    // to brighter green #4caf50 hsl(122, 39%, 49%)
    return hsllg(88,50,53, 122,39,49, 4,4.5, score)
  } else if (score > 3.5) {
    // to lighter green #8bc34a hsl(88, 50%, 53%)
    return hsllg(64,61,51, 88,50,53, 3.5,4, score)
  } else if (score > 3.0) {
    // to olive #c6cf37 hsl(64, 61%, 51%)
    return hsllg(45,100,58, 64,61,51, 3,3.5, score)
  } else if (score > 2.5) {
    // to yellow #ffca28 hsl(45, 100%, 58%)
    return hsllg(36,100,47, 45,100,58, 2.5,3, score)
  } else if (score > 2.0) {
    // to orange #ef9100 hsl(36, 100%, 47%)
    return hsllg(2,64,58, 36,100,47, 2,2.5, score)
  } else if (score > 1.5) {
    // to brighter red #d9534f hsl(2, 64%, 58%)
    return hsllg(14,88,40, 2,64,58, 1.5,2, score)
  } else {
    // deeper red #bf360c hsl(14, 88%, 40%)
    return '#bf360c'
  }
}
