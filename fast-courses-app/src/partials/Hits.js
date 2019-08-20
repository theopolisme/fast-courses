import React, { useEffect } from 'react';
import { connectHits } from 'react-instantsearch-dom';
import ReactTooltip from 'react-tooltip'

import Hit from './Hit';

const Hits = ({ hits, store }) => {
  useEffect(() => {
    if (hits.length) {
      ReactTooltip.rebuild();
    }
  }, [hits]);

  return (
    <div>
      {hits.map(hit => (
        <Hit key={hit.objectID} hit={hit} store={store} />
      ))}
    </div>
  );
}

const CustomHits = connectHits(Hits);

export default CustomHits;
