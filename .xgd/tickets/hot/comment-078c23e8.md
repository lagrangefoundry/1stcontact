---
uid: comment-078c23e8
id: COMMENT-8082
type: comment
title: Claude response for fix_plan report
created_by: xgd
created_at: '2026-11-09T07:22:40.642589+00:00'
updated_at: '2026-11-09T07:22:40.642589+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-cbf2609f
  kind: note
---

I filed the revised iteration 4 fix plan as **REPORT-11736 (report-cbf2609f)**. It fixes the validator refusal but won't clear the failure: AC-688 still needs you to install two browsers outside the sandbox.

**Why the last plan was refused:** it declined the builder's request to unfreeze the code, but listed no files the batch would edit. The validator requires that list to be non-empty. The diagnosis and the decision were right; only the format was wrong.

**What the new plan does:**
- **Same decision, valid format:** the request to unfreeze the code is declined again, and the batch may now touch only `tests/reconciliation-l1-substrate.test.ts`. The reference build pins Playwright `^1.61.1` (`tools/generate/package.json:21`), and the builder didn't propose any code change.
- **One batch, scoped to `test_UAT_AC688_`:** the builder checks, without writing anything, whether the webkit and firefox builds Playwright needs are installed. If they are, it runs the test and reports the real result. If not, it reports stuck with the command below. It does not retry the install, which the sandbox already refused.

**Root cause, re-checked this iteration:** the Playwright browser cache has `firefox-1538` and `webkit-2336`, but Playwright 1.61.1 needs `firefox-1532` and `webkit-2311`. 1.61.1 is the only Playwright version installed, so switching to a version that matches the cached browsers isn't possible without network access. Chromium matches, which is why AC-683 passes.

**To clear it**, run this from the repo root outside the sandbox, then re-run the gate for `test_UAT_AC688_`:
```
pnpm --filter @1stcontact/generate exec playwright install webkit firefox
```

The plan also notes, without filing a bug, that AC-688's own wording says the test "skips cleanly" when the engines are missing, yet the coverage gate counts that skip as an orphaned AC. That may be worth a look in XGD itself.

The sandbox blocked a connection to `github.com:22` while the report was being created, so it is saved locally but may not have been pushed.