---
uid: comment-eeec92a4
id: COMMENT-2555
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-09-10T16:07:12.017012+00:00'
updated_at: '2026-09-10T16:07:12.017012+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-639897f6
  kind: note
---

**Attempt 5 complete — 5 mutations, 0 violations remaining.** Report filed as REPORT-3756 (`report-639897f6`).

Both findings shared one root cause: STORY-96 was the only CAP-82 story BUNDLE-20's reconciliation skipped, so it still asserted the sha-addressed draft snapshot channel REQ-149 D7 dropped.

**Story body (`story-66115f6b`)** — one edit covering both findings:
- In-scope bullet 1: dropped "for both the preview (snapshot-addressed) and published addressing forms" → now "on the deployed site's published addressing form".
- In-scope bullet 5: "the snapshot root's redirect" → "the published site root's redirect".
- Technical Context bullet 1 + Dependencies: "addressing forms" → "addressing form".
- Added a Technical Context bullet recording the retirement (REQ-149 D7/D6/D5) in the same "recorded rather than absorbed" style the story already uses for the corrected REQ-113 premise.

**Paired AC edits** — the report named AC-916 and AC-921 as the downstream cascade; I swept all nine ACs and found two more carrying the same premise:

| AC | Was | Now |
|---|---|---|
| AC-916 | title + body claimed both addressing forms; verification said "Deploy… as a preview snapshot" — no longer executable, `1c deploy` is deleted | published site only; "Publish a rendered multi-page site" |
| AC-921 | "the snapshot root" (title, criterion, verification) | "the published site root" |
| AC-920 | verification: "on both deployed addressing forms" | "the deployed site's published addressing form" |
| AC-918 | verification: "a deployed snapshot the site's **deploy index** vouches for" — the manifest D5 deleted | "a published site on the deployed side" |

A re-scan for `snapshot` / `addressing forms` / `deploy index` / `1c deploy` returns zero residual hits outside the story's explicit retirement record.

**Verification:** `npm test --` on the three clean-page-URL files → 3 files, 18 tests, all passing. The UATs were already rebuilt for the one-channel world under REQ-149; the matrix text was what lagged. No `uat_coverage` field touched — all nine ACs stay `pass`, and the tests back that. No production code changed. All repairs were subtractive, so REQ-113 AC5–AC9 are untouched.
