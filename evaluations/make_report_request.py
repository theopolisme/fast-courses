import sys
import os
import argparse
import json

CHUNK_SIZE = 250
TEMPLATE = """
// Chunk %s
let body = %s;
fetch("https://www.applyweb.com/eval/new/reportbrowser/excel/response", {"credentials":"include","headers":{"accept":"application/json, text/plain, */*","content-type":"application/json;charset=UTF-8",
      "sec-fetch-mode":"cors"},"referrer":"https://www.applyweb.com/eval/resources/js/reportbrowser/reportbrowser.html","referrerPolicy":"no-referrer-when-downgrade","body":JSON.stringify(body),"method":"POST","mode":"cors"});
"""


def chunks(l, n):
    for i in range(0, len(l), n):
        yield l[i:i + n], int(i / n)


def main():
    parser = argparse.ArgumentParser(description='fast-courses eval make')
    parser.add_argument('files', nargs='*', type=argparse.FileType('r'),
                        default=[sys.stdin])
    parser.add_argument('--outdir', '-o', type=str, required=True)
    args = parser.parse_args()

    print('Writing template...')
    os.makedirs(args.outdir, exist_ok=True)

    for f in args.files:
        raw = json.load(f)

        for chunk, i in chunks(raw['data'], CHUNK_SIZE):
            pathname = os.path.basename(f.name).split('.')[0] + '.' + \
                f'{i:03}'
            dest = os.path.join(args.outdir, pathname + '.json')
            template_dest = os.path.join(args.outdir, 'template.' +
                                         pathname + '.js')

            with open(dest, 'w+') as dest_f:
                courses = []

                for d in chunk:
                    courses.append({
                        "courseId": d['id'],
                        "termId": d['termId'],
                        "instructorId": d['instructorId']
                    })

                gen = {
                    "queuedItems": courses,
                    "reportTypes": ["Quantitative", "Response"],
                    "customReports": []
                }

                json.dump(gen, dest_f)

                with open(template_dest, 'w+') as template_f:
                    template_f.write(TEMPLATE %
                        (template_dest, json.dumps(gen)))

    print('Finished writing template!')


if __name__ == '__main__':
    main()
