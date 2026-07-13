---
uid: report-4ac9df2e
id: REPORT-474
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-5'
created_by: xgd
created_at: '2026-07-13T19:07:21.395304+00:00'
updated_at: '2026-07-13T19:07:21.395304+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-5
---

## Files resolved

- `package.json` — class UU (both modified). Version-string conflict only:
  HEAD (`sync_working_to_main`) at `0.0.105` vs incoming (`REQ-36 [FREE-CODED]`)
  at `0.0.90`. Kept HEAD's higher version `0.0.105` — a reconcile version bump
  must never regress. All other keys were identical on both sides.

The incoming commit's 9 code files (dials.ts, hero/index.astro, hero/meta.ts,
text-block/index.astro, text-block/meta.ts, tokens/css.ts, site-schema/schema.ts,
framework-tokens.test.ts, req36-heading-treatment.test.ts) applied without
conflict and were already staged during the cherry-pick.

## Incoming changes preserved

- Confirmed via `git show HEAD --stat`: commit `d8217c40`
  ("feat(framework): REQ-36 CTA/panel/body-weight/label dials [FREE-CODED]")
  contains all 9 incoming code files with +179/-10 — every incoming change
  present.
- `package.json` in HEAD is at `version: 0.0.105`; the only incoming change to
  this file was a lower version bump, correctly superseded by the higher current
  version. No developer code discarded.

## State note

The tree is clean and CHERRY_PICK_HEAD is absent: the conflict was resolved and
the cherry-pick continued/committed as `d8217c40` in an earlier turn of this
session, before this resolution step was formally invoked. No conflict markers
remain and the incoming commit is fully applied. The subsequent
cherry_pick_finalize_resolution step should find the cherry-pick already
finalized (nothing left to continue).
