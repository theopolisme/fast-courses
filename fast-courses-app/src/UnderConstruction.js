import React from 'react';

const UnderConstruction = () => {
  return (
    <div style={{ maxWidth: 600, margin: '10% auto', padding: '10%' }}>
      <style>{'#loader { display: none; }'}</style>
      <h2>Oops!</h2>
      <p>
        Stanford suddenly revoked our login license, so I'm scrambling to
        implement a different authentication system in the next day or two.
        Sorry that this is the worst possible timing ever. The good news is,
        when we come back online, all the 2021-22 courses should be fully
        loaded. <i>(Updated Monday Sept 20, 2021)</i>
      </p>
      <p>
        Fwiw, fast-courses is just a little labor of love (and I'm on leave
        right now). If you care about fast-courses, you should{' '}
        <a href="mailto:tcp@stanford.edu">send me an encouraging email</a>.
      </p>
    </div>
  );
};

export default UnderConstruction;
