---
uid: report-f62bcca1
id: REPORT-7588
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-01T12:27:02.930530+00:00'
updated_at: '2026-11-01T12:27:02.930530+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: story-1500b111
  parent_report_uid: report-64693a9f
  batch_index: '0'
---

I made the batch's 16 failing tests pass or deleted them with their ACs still covered, and the 8 orphaned ACs now each have a passing test. I changed only test files: no production code, and no AC or story tickets, since AC-2019 and AC-2086 were already corrected in this iteration and the other affected ACs already describe the current design.

**Workers tests (B, REQ-168): all 8 pass.** These were the AC-1719 to 1724 tests in `reconciliation-library-surface.workers.test.ts`, AC-1723 in `reconciliation-library-capture-file.workers.test.ts`, and AC-1813 in `reconciliation-material-row-content-type.workers.test.ts`.
- I added a `scopeOf(businessId)` helper modelled on `test_UAT_FC_REQ-163_ingestion.workers.test.ts`. Every `route()` call now gets the scope before `deps`, and every `ticketStoreFor()` / `projectKnowledgeFor()` call gets it as the second argument.
- I removed `TENANT_ID` from each `routerEnv`, since nothing reads it any more.
- AC-1722's cross-account list and read now ask as a different business's scope. The AC-1720 `description_status` failure and the AC-1723 500 went away once the calls were right, and no assertion was weakened.

**Node tests (A, REQ-181):**
- **Deleted as superseded duplicates:** AC-1715, 1716 and 1717 in `reconciliation-library-tab.test.ts`, and AC-1715, 1716 and 2018 in `reconciliation-library-placement-and-row.test.ts`. Before deleting each one I checked that its AC's current text is what `reconciliation-library-badges-the-exception.test.ts` asserts.
- **One claim moved, not lost:** the deleted placement-file AC-1715 test also checked that an old row carrying only the retired `site_slug` reads as placed nowhere. That check now sits in the badges file's AC-2161 test: the row is warned and its *Placed on* is empty.
- **AC-2019** now allows only the role pill or the `--unplaced` "Not on the site" warning on a row. It asserts no row has a placement badge and that exactly the four unplaced site-role rows carry the warning.
- **AC-2086** now expects the *Placed on* label and checks *Used on* is absent.
- **Leftovers removed:** `getSite`, the boxed site, the `siteChanged` type, `listCalls`, `badgedKeys`, `usedOn` and `titlesIn` were only used by the deleted tests. I also updated the header comments in both files.

**Test runs:**
- The three workers files: 8 of 8 pass.
- The five Library node files, including the reader file: 18 of 18 pass, none skipped.
- The full `vitest run` still shows failures, all in files I didn't touch and none in this batch's scope. Some hit the sandbox's network block (`sparrow.cloudflare.com` and `api.cloudflare.com` are denied); the rest belong to other stories.
- There's no root `tsconfig.json` covering `tests/`, so I couldn't run a type check on these files.

Nothing is committed; all 7 edited test files are still uncommitted.

```yaml
## Assessment
blocked_by: null
```
