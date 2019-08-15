import os
import argparse
import xmltodict
import json
import requests
from concurrent.futures import ThreadPoolExecutor


MAX_WORKERS = 10

ENDPOINT = 'https://explorecourses.stanford.edu/'
DEPARMENTS_ENDPOINT = ENDPOINT + '?view=xml-20140630'
COURSE_ENDPOINT = (ENDPOINT + 'search?view=xml-20140630&academicYear='
                   '&q={name}&filter-departmentcode-{name}=on'
                   '&filter-coursestatus-Active=on')


def fetch_departments():
    r = requests.get(DEPARMENTS_ENDPOINT)
    body = xmltodict.parse(r.text, force_list=('school', 'department'))
    result = []
    for school in body['schools']['school']:
        school_name = school['@name']
        for department in school['department']:
            result.append({
                'name': department['@name'],
                'longname': department['@longname'],
                'school': school_name
            })
    return result


def fetch_department_courses(name):
    r = requests.get(COURSE_ENDPOINT.format(name=name))
    return r.content


def process_department(name, destination):
    print('  Processing department', name)
    raw = fetch_department_courses(name)
    with open(destination, 'wb+') as f:
        f.write(raw)
    print('  Finished processing department', name)


def main():
    parser = argparse.ArgumentParser(description='fast-courses fetch')
    parser.add_argument('--department', '-d', type=str)
    parser.add_argument('--inputdepartments', '-i',
                        type=argparse.FileType('r'))
    parser.add_argument('--outdir', '-o', type=str, required=True)
    args = parser.parse_args()

    print('Fetching ExploreCourses course data...')
    os.makedirs(args.outdir, exist_ok=True)

    if args.department:
        department_names = [args.department]
    else:
        if args.inputdepartments:
            print('  Using input departments', args.inputdepartments.name)
            department_data = json.load(args.inputdepartments)
        else:
            print('  Fetching fresh list of departments')
            department_data = fetch_departments()
            dest = os.path.join(args.outdir, 'departments.json')
            with open(dest, 'w+') as f:
                json.dump(department_data, f, indent=4)
            print('  Finished fetching fresh list of departments!')

        department_names = [d['name'] for d in department_data]

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        for name in department_names:
            dest = os.path.join(args.outdir, name + '.xml')
            executor.submit(process_department, name, dest)

    print('Finished fetching ExploreCourses course data!')


if __name__ == '__main__':
    main()
