import React, { useEffect } from 'react';
import ReactTooltip from 'react-tooltip'

//  <Histogram min={0} max={35} bucketSize={5} values={data.hours} height={50} />

const LABEL_STYLE = {
  marginTop: '0.25rem',
  fontSize: 9,
  textAlign: 'center'
};

const Histogram = ({ min, max, bucketSize, values, height, ...rest }) => {
  const buckets = {};

  useEffect(() => {
    ReactTooltip.rebuild();
  }, [values]);

  let i = min + bucketSize;
  while (i <= max) {
    buckets[i] = {
      label: i === (min + bucketSize) ? `<${i}` : i === max ? `>${i}` : `${i - bucketSize}-${i}`,
      count: 0
    };
    i += bucketSize;
  }

  for (let v of values) {
    let bucket = v >= max ? max : Math.floor(v / bucketSize) * bucketSize + bucketSize;
    if (!buckets[bucket]) debugger;
    buckets[bucket].count++;
  }

  const numBuckets = Object.keys(buckets).length;
  const bucketWidth = `${((1 / numBuckets) * 100)}%`;
  const total = values.length;

  return (
    <div {...rest}>
      {Object.values(buckets).map(({ label, count }, i) => {
        const computed = count === 0 ? 1 : ((count / total) * height);
        return (
          <div
            key={label}
            style={{
              display: 'inline-block',
              width: bucketWidth,
            }}
            data-tip={`${count} student${count === 1 ? '' : 's'}`}
            data-place="bottom"
          >
            <div
              style={{
                borderTop: '1px solid #ccc',
                borderLeft: i === 0 && '1px solid #ccc',
                borderRight: i === numBuckets -1 && '1px solid #ccc',
                boxSizing: 'border-box'
              }}
            >
              <div
                style={{
                  marginTop: height - computed,
                  height: computed,
                  backgroundColor: '#846aee',
                }}
              />
            </div>
            <div style={LABEL_STYLE}>{label} hours</div>
          </div>
        );
      })}
    </div>
  );
};

export default Histogram;
