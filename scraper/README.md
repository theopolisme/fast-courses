# scraper

Scrapes course data from ExploreCourses using the "hidden" XML API. Dumps this data into JSON files which are then pushed to search store.

ENDPOINT: https://explorecourses.stanford.edu/

- ?view=xml-20140630
- search?view=xml-20140630&academicYear=&q={CODE}&filter-departmentcode-{CODE}=on&filter-coursestatus-Active=on

## Commands

- `pipenv run python fetch.py -o raw`
- `pipenv run python fetch.py -o raw -i raw/departments.json`
- `pipenv run python parse.py -o out/ -p "raw/*.xml"`
- `pipenv run python upload.py -p "out/*.json" -c ../evaluations/derived/counts.json -r ../evaluations/derived/ratings.json`
- `ls out | awk -F'[_.]' '{printf "\"%s\",",$1}'`
