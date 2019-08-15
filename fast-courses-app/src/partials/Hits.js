import React from 'react';
import { connectHits } from 'react-instantsearch-dom';

import Hit from './Hit';

const Hits = ({ hits, store }) => (
  <div>
    {hits.map(hit => (
      <Hit key={hit.objectID} hit={hit} store={store} />
    ))}
  </div>
);

const CustomHits = connectHits(Hits);

export default CustomHits;
