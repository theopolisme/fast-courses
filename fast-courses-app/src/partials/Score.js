import React from 'react';
import * as util from '../util';

export default ({ score, count, latest }) => {
  return (
    <span
      className={`score`}
      style={{ backgroundColor: util.getColorForScore(score) }}
      data-tip={score ? `Score based on ${count}${latest ? ' recent' : ''} student${count === 1 ? '' : 's'}` : 'No recent reviews'}
      // onClick={}
    >
      {score ? score.toFixed(2) : 'N/A'}
    </span>
  );
};
