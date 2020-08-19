export const SUBJECTS = ["AA","ACCT","AFRICAAM","AFRICAST","AMELANG","AMSTUD","ANES","ANTHRO","APPPHYS","ARABLANG","ARCHLGY","ARTHIST","ARTSINST","ARTSTUDI","ASNAMST","ASNLANG","ATHLETIC","BIO","BIOC","BIODS","BIOE","BIOHOPK","BIOMEDIN","BIOPHYS","BIOS","CATLANG","CBIO","CEE","CHEM","CHEMENG","CHILATST","CHINA","CHINLANG","CHPR","CLASSICS","CME","COMM","COMPLIT","COMPMED","CS","CSB","CSRE","CTS","DANCE","DBIO","DERM","DESINST","DLCL","EALC","EARTH","EARTHSYS","EASTASN","ECON","EDUC","EE","EEES","EFSLANG","EMED","ENERGY","ENGLISH","ENGR","ENVRES","ENVRINST","ESF","ESS","ETHICSOC","FAMMED","FEMGEN","FILMPROD","FILMSTUD","FINANCE","FRENCH","FRENLANG","GENE","GEOLSCI","GEOPHYS","GERLANG","GERMAN","GLOBAL","GSBGEN","HISTORY","HPS","HRMGT","HRP","HUMBIO","HUMCORE","HUMRTS","HUMSCI","IIS","ILAC","IMMUNOL","INDE","INTLPOL","INTNLREL","ITALIAN","ITALIC","ITALLANG","JAPAN","JAPANLNG","JEWISHST","KIN","KOREA","KORLANG","LATINAM","LAW","LAWGEN","LEAD","LIFE","LINGUIST","MATH","MATSCI","MCP","MCS","ME","MED","MEDVLST","MGTECON","MI","MKTG","MLA","MS&E","MTL","MUSIC","NATIVEAM","NBIO","NENS","NEPR","NSUR","OB","OBGYN","OIT","OPHT","ORALCOMM","ORTHO","OSPAUSTL","OSPBARCL","OSPBEIJ","OSPBER","OSPCPTWN","OSPFLOR","OSPGEN","OSPHONGK","OSPISTAN","OSPKYOCT","OSPKYOTO","OSPMADRD","OSPOXFRD","OSPPARIS","OSPSANTG","OTOHNS","OUTDOOR","PAS","PATH","PE","PEDS","PHIL","PHYSICS","POLECON","POLISCI","PORTLANG","PSYC","PSYCH","PUBLPOL","PWR","RAD","RADO","REES","RELIGST","RESPROG","ROTCAF","ROTCARMY","ROTCNAVY","SBIO","SCCM","SINY","SIW","SLAVIC","SLAVLANG","SLE","SOC","SOMGEN","SPANLANG","SPECLANG","STATS","STEMREM","STRAMGT","STS","SURG","SUST","SYMSYS","TAPS","THINK","TIBETLNG","UAR","URBANST","UROL","VPTL","WELLNESS"];
export const COURSE_REGEX = new RegExp(`(${SUBJECTS.join('|')})[ ]?(\\d+[a-z]*)`, 'ig');

window.COURSE_REGEX = COURSE_REGEX;

export const CURRENT_YEAR = {
  firstTermId: 1212,
  year: 2020,  
  yearLabel: '2020-2021',
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
        shortLabel: `Autumn ${year}`,
        yearLabel,
        collapseAfter: new Date(year, 11, 1) // Dec 1st
      },
      {
        termId: (firstTermId + 2).toString(),
        term: `${yearLabel} Winter`,
        label: 'Winter',
        shortLabel: `Winter ${year + 1}`,
        yearLabel,
        collapseAfter: new Date(year + 1, 2, 1) // March 1st
      },
      {
        termId: (firstTermId + 4).toString(),
        term: `${yearLabel} Spring`,
        label: 'Spring',
        shortLabel: `Spring ${year + 1}`,
        yearLabel,
        collapseAfter: new Date(year + 1, 6, 1) // July 1st
      },
    ].concat(includeSummer ? [
      {
        termId: (firstTermId + 6).toString(),
        term: `${yearLabel} Summer`,
        label: 'Summer',
        shortLabel: `Summer ${year + 1}`,
        yearLabel,
        summer: true,
        collapseAfter: new Date(year + 1, 7, 1) // Aug 1st
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
