import os
import sys
import argparse
import json
from glob import glob
from itertools import takewhile
from algoliasearch.search_client import SearchClient


def get_index():
    client = SearchClient.create(
        os.getenv('ALGOLIA_ACCOUNT'),
        os.getenv('ALGOLIA_TOKEN')
    )

    return client.init_index(os.getenv('ALGOLIA_INDEX'))


def process_file(name, f, index, counts, ratings):
    print('  Uploading', name)
    try:
        courses = json.load(f)
        for c in courses:
            oid = c['objectID']

            # For filtering by suffix/number
            c['numberInt'] = int(''.join(takewhile(str.isdigit,
                                                   c['code'])))
            c['numberSuffix'] = c['code'].replace(str(c['numberInt']), '')

            # Normalize for sorting/filtering purposes
            c['numReviews'] = counts.get(oid, 0)
            if oid in ratings:
                c['currentScore'] = ratings[oid]['current_score']
                c['currentScoreNormalized'] = \
                    ratings[oid]['current_score_normalized']
                c['currentScoreCount'] = ratings[oid]['current_score_count']
                c['scoreHistory'] = ratings[oid]['scores']

            # Reduce size
            for section in c['sections']:
                for schedule in section['schedules']:
                    del schedule['startTime']
                    del schedule['endTime']

        res = index.save_objects(courses)
        print('    Got Algolia res', res)
    except Exception as e:
        print('  Error encountered processing', name, e)
        return
    print('  Uploaded', name)


def main():
    parser = argparse.ArgumentParser(description='fast-courses upload')
    parser.add_argument('--pattern', '-p', type=str)
    parser.add_argument('--counts', '-c', type=argparse.FileType('r'))
    parser.add_argument('--ratings', '-r', type=argparse.FileType('r'))
    parser.add_argument('files', nargs='*', type=argparse.FileType('r'),
                        default=[sys.stdin])
    args = parser.parse_args()

    print('Uploading serialized JSON to Algolia...')

    counts = json.load(args.counts)
    ratings = json.load(args.ratings)

    if args.pattern:
        names = glob(args.pattern)
        files = [open(n, 'r') for n in names]
    else:
        files = args.files

    index = get_index()

    for f in files:
        process_file(f.name, f, index, counts, ratings)

    print('Finished uploading serialized JSON to Algolia...')


if __name__ == '__main__':
    main()
