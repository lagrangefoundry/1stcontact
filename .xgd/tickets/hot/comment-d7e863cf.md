---
uid: comment-d7e863cf
id: COMMENT-2452
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-09-10T03:49:05.756996+00:00'
updated_at: '2026-09-10T03:49:05.756996+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-d5369a72
  kind: note
---

**REPORT-3653 (`report-d5369a72`) — FAIL: 2 violations, 1 warning, 0 needs_review.**

## What I found

Both violations have one cause. The `ac`-level fix loop sharpened **AC-1428** and **AC-1433** earlier today (`updated_at` 03:37:57 / 03:38:01), each time adding a *permissive complement* to the criterion. The UAT file was authored 2026-08-31 (`b70bafc8b6`) and never touched since. The other eight ACs still carry `updated_at` 2026-08-31T12:33 — the same batch that produced the tests — and all eight are aligned sentence-for-sentence.

1. **`test_UAT_AC1428_…` (violation, `uat-edit`)** — AC-1428 now requires observing "the whole resolution, **not just its language**" (country `US`, currency `USD`, timezone `America/New_York` alongside region-free `en`) and asserting the locale is *not* `en-US`. The test asserts only `resolveSiteLocale({}).locale` — precisely the shape the AC names as insufficient. An undeclared site regressing to `en-US` would not fail it.

2. **`test_UAT_AC1433_…` (violation, `uat-edit`)** — AC-1433 now makes the permissive side part of the criterion: a well-formed BCP 47 tag with an unrecognised language subtag must validate and round-trip unchanged, explicitly "so a later tightening to registry membership fails this criterion". No such case exists in the test. That exact tightening would pass today.

3. **`test_UAT_AC1432_…` (warning)** — the criterion sentence "An unrecognised locale is left-to-right" has no assertion. Its own Verification section doesn't ask for one, hence warning, not violation.

## Repair is a copy, not an authoring job

Both missing assertions already exist, passing, in `tests/test_UAT_FC_REQ-151_site_locale.test.ts:143-156` and `:283-296`. Nothing here is a `code-issue` — the implementation does everything the edited ACs demand; the defect is in the evidence.

I ran the suite rather than inferring: `npm test -- tests/reconciliation-site-locale-identity.test.ts` → **10 passed / 10** (591ms), real components throughout, no internal mocking.

One cross-cutting note I put in the report: no mechanism re-runs UAT generation when the `ac`-level fix loop edits an AC body, so this shape — `ac` passes on attempt 2, `uat` then fails on exactly the ACs attempt 2 touched — should be expected whenever that loop fires, and is diagnosable from `updated_at` alone.
