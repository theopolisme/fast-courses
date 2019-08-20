import argparse
import os
import asyncio
from pyppeteer import launch

LOGIN_ENDPOINT = 'https://www.applyweb.com/eval/shibboleth/stanford/17062'
DOWNLOAD_ENDPOINT = 'https://www.applyweb.com/eval/new/reportbrowser/%s'


async def main():
    parser = argparse.ArgumentParser(description='fast-courses downloader')
    parser.add_argument('--outdir', '-p', type=str)
    parser.add_argument('--start', '-s', type=int)
    parser.add_argument('--end', '-e', type=int)
    args = parser.parse_args()

    print('Launching downloader...')
    os.makedirs(args.outdir, exist_ok=True)
    abs_outpath = os.path.abspath(args.outdir)

    browser = await launch({
        'headless': False,
        'autoClose': False,
    })
    login_page = await browser.newPage()
    await login_page.goto(LOGIN_ENDPOINT)

    input("Press Enter after you have logged in...")

    for i in range(args.start, args.end + 1):
        print('Downloading ', i, '...')
        page = await browser.newPage()
        cdp = await page.target.createCDPSession()
        await cdp.send('Page.setDownloadBehavior',
                       {'behavior': 'allow', 'downloadPath': abs_outpath})
        await page.goto(DOWNLOAD_ENDPOINT % i)

    print('Finished download...')

if __name__ == '__main__':
    asyncio.get_event_loop().run_until_complete(main())
