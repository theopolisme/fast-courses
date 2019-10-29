import sys
import os
import argparse
import xmltodict
import json
from datetime import datetime
from glob import glob
from concurrent.futures import ThreadPoolExecutor
import re

MAX_WORKERS = 50
FORCE_LIST = ('course', 'section', 'schedule',
              'instructor', 'attribute', 'tag',
              'learningObjective')
MAX_SECTIONS = 20
BASE_TIME = datetime.strptime('', '')
TIME_FORMAT = '%I:%M:%S %p'


def postprocessor(path, key, value):
    if value and key[:-1] in FORCE_LIST:
        return key, value[key[:-1]]
    else:
        return key, value


def parse_time(s):
    if not s:
        return 0

    dt = datetime.strptime(s, TIME_FORMAT)
    return (dt - BASE_TIME).total_seconds()


def parse_courses_xml(doc):
    body = xmltodict.parse(doc, force_list=FORCE_LIST,
                           postprocessor=postprocessor)
    courses = body['xml']['courses']

    if not courses:
        return []

    result = []

    for course in courses:

        PLUCK_KEYS = ('year', 'subject', 'code', 'title', 'description',
                      'repeatable', 'grading', 'unitsMin', 'unitsMax')
        generated = {k: course[k] for k in PLUCK_KEYS}

        generated['sections'] = []
        generated['gers'] = []

        # Metadata
        generated['objectID'] = course['administrativeInformation']['courseId']
        generated['number'] = '{} {}'.format(course['subject'], course['code'])

        # GER list for filtering
        if course['gers']:
            generated['gers'] = [x.strip() for x in course['gers'].split(',')]

        # Generate all possible units counts (for filtering)
        min_units = int(course['unitsMin'])
        max_units = int(course['unitsMax'])
        generated['units'] = list(range(min_units, max_units + 1))

        if course['sections']:

            total_sections = len(course['sections'])
            generated['totalSections'] = total_sections
            course['sections'].sort(key=lambda c: c['sectionNumber'])

            for section in course['sections'][:MAX_SECTIONS]:

                PLUCK_SECTION_KEYS = ('term', 'termId', 'sectionNumber',
                                      'component', 'notes', 'classId',
                                      'currentClassSize', 'maxClassSize')
                gen_section = {k: section[k] for k in PLUCK_SECTION_KEYS}
                gen_section['schedules'] = []

                # Timestamps for sort / filter
                for schedule in section['schedules']:

                    PLUCK_SCHEDULE_KEYS = ('startTime', 'endTime', 'location')
                    gen_schedule = {k: schedule[k]
                                    for k in PLUCK_SCHEDULE_KEYS}

                    if schedule['instructors']:
                        gen_schedule['instructors'] = [({
                            'name': i['name'], 'sunet': i['sunet']
                        }) for i in schedule['instructors']]
                    else:
                        gen_schedule['instructors'] = []

                    gen_schedule['startTimestamp'] = parse_time(
                        schedule['startTime'])
                    gen_schedule['endTimestamp'] = parse_time(
                        schedule['endTime'])

                    # Fix whitespace in days
                    if schedule['days']:
                        gen_schedule['days'] = \
                            re.sub(r'\s+', ' ', schedule['days']).strip()
                    else:
                        gen_schedule['days'] = None

                    gen_section['schedules'].append(gen_schedule)

                generated['sections'].append(gen_section)

        result.append(generated)

    return result


def process_file(name, f, dest):
    print('  Processing', name)
    try:
        courses = parse_courses_xml(f.read())
        with open(dest, 'w+') as f:
            json.dump(courses, f, indent=4)
    except Exception as e:
        print('  Error encountered processing', name, e)
        raise e
    print('  Processed', name)


def main():
    parser = argparse.ArgumentParser(description='fast-courses parser')
    parser.add_argument('--key', '-k', type=str)
    parser.add_argument('--outdir', '-o', type=str, required=True)
    parser.add_argument('--pattern', '-p', type=str)
    parser.add_argument('files', nargs='*', type=argparse.FileType('r'),
                        default=[sys.stdin])
    args = parser.parse_args()

    print('Serializing ExploreCourses XML to JSON...')
    os.makedirs(args.outdir, exist_ok=True)

    if args.pattern:
        names = glob(args.pattern)
        files = [open(n, 'r') for n in names]
    else:
        files = args.files

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        for f in files:
            if args.key:
                base = args.key
            else:
                base = os.path.splitext(os.path.basename(f.name))[0]

            dest = os.path.join(args.outdir, base + '.json')
            # process_file(base, f, dest)
            executor.submit(process_file, base, f, dest)

    print('Finished serializing ExploreCourses XML to JSON!')


if __name__ == '__main__':
    main()
