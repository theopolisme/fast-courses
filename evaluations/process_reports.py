import os
import argparse
from glob import glob
import json
import pandas as pd
from concurrent.futures import ThreadPoolExecutor

MAX_WORKERS = 1
KEY_COLUMNS = ['Number', 'Section', 'Instructor ID', 'Course ID']


def parse_report(filename):
    sheets = pd.read_excel(filename, sheet_name=None)
    df = pd.DataFrame()
    for sheet in sheets.values():
        sheet[KEY_COLUMNS] = sheet[KEY_COLUMNS].astype(str)
        sheet.columns = sheet.columns.str.strip()
        sheet = sheet.loc[:, ~sheet.columns.duplicated()]
        df = df.append(sheet, sort=True, ignore_index=True)
    return df


def format_record(record):
    record['_id'] = '%s_%s_%s_%s' % (record['Course ID'],
                                     record['Term'].replace(' ', ''),
                                     record['Section'],
                                     record['RESPONSE #'].split(' #')[1])
    record['Instructor'] = [
        '%s, %s' % (record['Last Name'],
                    record['First Name'])
    ]

    del record['Last Name']
    del record['First Name']
    return record


def process_file(label, filename, dest):
    print('  Processing', label)
    try:
        df = parse_report(filename)
        with open(dest, 'w+') as f:
            records = {}

            for index, row in df.iterrows():
                record = format_record(row.dropna().to_dict())
                if record['_id'] in records:
                    # One section taught by multiple instructors, but
                    # ensure they're not a TA. If they're a TA, the new
                    # record will not include "how much did you learn",
                    # which means...we skip it!
                    if 'How much did you learn from this course?' \
                            not in record:
                        continue

                    if record['Instructor'][0] not in \
                            records[record['_id']]['Instructor']:
                        records[record['_id']]['Instructor'] += \
                            record['Instructor']
                        records[record['_id']]['Instructor'].sort()
                else:
                    records[record['_id']] = record

            for v in records.values():
                v['Instructor'] = '; '.join(v['Instructor'])

            json.dump(list(records.values()), f, indent=4)
    except Exception as e:
        print('  Error encountered processing', filename, e)
        raise e
    print('  Processed', label)


def main():
    parser = argparse.ArgumentParser(description='fast-courses process')
    parser.add_argument('--outdir', '-o', type=str, required=True)
    parser.add_argument('--pattern', '-p', type=str)
    args = parser.parse_args()

    print('Processing raw reports...')
    os.makedirs(args.outdir, exist_ok=True)

    files = glob(args.pattern)

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        for filename in files:
            base = os.path.splitext(os.path.basename(filename))[0]
            dest = os.path.join(args.outdir, base + '.json')
            # process_file(base, filename, dest)
            executor.submit(process_file, base, filename, dest)

    print('Finished processing raw reports...')


if __name__ == '__main__':
    main()
