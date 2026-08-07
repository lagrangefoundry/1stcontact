---
uid: comment-503a8bf9
id: COMMENT-818
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-07T22:01:36.717440+00:00'
updated_at: '2026-08-07T22:01:36.717440+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-04ee9e05
  kind: note
---

**REPORT-1638 (report-04ee9e05) — PASS: 0 violations, 0 warnings, 0 needs_review.**

This was attempt 2 at the `ac` level. I re-loaded the matrix from scratch and verified each repair against the current ticket bodies rather than accepting REPORT-1637's account of them.

**The violation is closed.** AC-906 now scopes byte-identity to *within* a channel — pairwise on published (unknown site vs nothing published) and on preview (unknown snapshot id vs missing object) — and names AC-910's no-index directive as the single permitted cross-channel difference, with the reason it is not an existence oracle. Verified satisfiable by construction at `apps/public-site/src/index.ts:151-166`: both 404 paths build identical headers and body, and `x-robots-tag` is added only for the draft channel, so the difference set is exactly one header. The rewrite also brought the AC back in line with STORY-95's own framing ("tell an unknown site from one that has not published" — both published-channel).

**All three warnings are closed too.** AC-905 now cross-references AC-927 for the tree gate instead of restating it and dropped the duplicated verification bullet; AC-892 and AC-896 defer the non-servable case to AC-925. STORY-94 gained an In-scope bullet grounding AC-901, which I checked against `manifest.ts:107-117` — `writeManifest` throws before `putText`, so "writes no index of its own" is literally true rather than aspirational.

Two checks that mattered beyond the findings themselves: the trimming opened no coverage gap (every removed clause is asserted by the AC it now points at — AC-924, AC-925, AC-926, AC-927), and the repair was surgical: exactly the five claimed elements carry a new `updated_at`, the other 32 ACs and two story bodies are unchanged, and the AC count is still 13/14/9.

`npx vitest run tests/req111-public-site-serving.test.ts` — 10 passed. No production code changed, and none should have: the violation was a contradiction between two ACs, not a defect.

One item remains open upstream, recorded as info rather than re-counted here: AC-913's apex grounding sits only in a parenthetical inside STORY-95's Out-of-scope paragraph. That is REPORT-1635 finding 2, a story-level warning, alongside that cycle's other two — and none of them blocks this level.
