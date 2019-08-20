# evaluations [WIP]

Fetch evaluation data from CollegeNet WDYT system.

**NOTE: Currently relies on a lot of manual processes :(**

**TODO: More automation!**

**BEWARE: This data is probably confidential / pretty secure, so no raw data is in this repository. If you're a Stanford affiliate you should get in touch and I can probably share the dumps with you so you don't have to go through the hell and anguish that was scraping CollgeNet.**

## General workflow

For a given term...

1. Fetch all courses in the term (using #Fetch all courses for a term below), store to `raw-courses/x.json`
2. Use the courses to `pipenv run python make_report_request.py raw-courses/x.json -o requests`
3. Merge the templates together `cat requests/template.x.*.js > requests/x-full.js`
4. Paste all the JS from generated `requests/x-full.js` into the JS console while logged into ApplyWeb (lololol)
5. Slowly and painstakingly download the generated files by checking `https://www.applyweb.com/eval/new/reportbrowser/ID/status` and then, once successful, downloading `https://www.applyweb.com/eval/new/reportbrowser/ID`
6. Put all these files in `raw-reports`.
7. Follow steps under #Reviews below
8. Profit????

## Fetch all courses for a term

Spring 1819
https://www.applyweb.com/eval/new/reportbrowser/evaluatedCourses?excludeTA=false&page=1&rpp=10&termId=152269

Winter 1819
https://www.applyweb.com/eval/new/reportbrowser/evaluatedCourses?excludeTA=false&page=1&rpp=10000&termId=152266

Fall 1819
https://www.applyweb.com/eval/new/reportbrowser/evaluatedCourses?excludeTA=false&page=1&rpp=10000&termId=152261

## Reviews

```
pipenv run python process_reports.py --outdir parsed-reports --pattern "raw-reports/**/*"

pipenv run python save_reviews.py --pattern "parsed-reports/*.json" --uri "mongodb://127.0.0.1:27017/fast-courses"
```

## Misc

https://www.applyweb.com/eval/new/reportbrowser/evaluatedCourses?course={objectID}&page=1&rpp=15&termId=152269
https://www.applyweb.com/eval/new/showreport?c=252563&i=55924&t=152269&r=3&embedded=true
