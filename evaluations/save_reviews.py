"""
Saves reviews to database.
"""

import os
import argparse
from glob import glob
import subprocess


COLLECTION = "reviews"


def process_file(label, filename, uri):
    print('  Processing', label)
    try:
        subprocess.run(["mongoimport",
                        "--jsonArray",
                        "--file", filename,
                        "--uri", uri,
                        "--mode", "upsert",
                        "--collection", COLLECTION
                        ])
    except Exception as e:
        print('  Error encountered processing', filename, e)
        raise e
    print('  Processed', label)


def main():
    parser = argparse.ArgumentParser(description='fast-courses save_reviews')
    parser.add_argument('--uri', '-u', type=str, required=True)
    parser.add_argument('--pattern', '-p', type=str, required=True)
    args = parser.parse_args()

    print('Saving reviews...')

    files = glob(args.pattern)

    for filename in files:
        base = os.path.splitext(os.path.basename(filename))[0]
        process_file(base, filename, args.uri)

    print('Finished saving reviews!')


if __name__ == '__main__':
    main()
