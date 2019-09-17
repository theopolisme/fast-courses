export const CURRENT_YEAR = {
  firstTermId: 1202,
  year: 2019,
  yearLabel: '2019-2020'
};

export const makeTerms = (year, { includeSummer, extended }) => {
  const termIdOffset = year - CURRENT_YEAR.year;
  const firstTermId = CURRENT_YEAR.firstTermId + termIdOffset * 10;
  const yearLabel = `${year}-${year + 1}`;

  const terms = (
    [
      {
        termId: (firstTermId).toString(),
        term: `${yearLabel} Autumn`,
        label: 'Autumn',
        yearLabel,
      },
      {
        termId: (firstTermId + 2).toString(),
        term: `${yearLabel} Winter`,
        label: 'Winter',
        yearLabel,
      },
      {
        termId: (firstTermId + 4).toString(),
        term: `${yearLabel} Spring`,
        label: 'Spring',
        yearLabel,
      },
    ].concat(includeSummer ? [
      {
        termId: (firstTermId + 6).toString(),
        term: `${yearLabel} Summer`,
        label: 'Summer',
        yearLabel,
        summer: true,
      }
    ] : [])
  );

  if (!extended) {
    return terms;
  }

  return {
    terms,
    yearLabel
  };
}

export const CURRENT_TERMS = makeTerms(CURRENT_YEAR.year, { includeSummer: false });
