---
uid: comment-959ee827
id: COMMENT-1312
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-20T13:29:52.015573+00:00'
updated_at: '2026-08-20T13:29:52.015573+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-420214de
  kind: note
---

**FAIL** — report-420214de (REPORT-2447), 14 violations, 1 warning, 0 needs_review.

## What I found

42 active ACs across STORY-84 and STORY-86. I ran all seven AC-named suites: **7 files / 34 tests, all passing**, all driving real entry points (`foldToL1`, `renderL1Document`, `validateL1`, `cmdGate`, `cli.run`) with mocking only at the browser boundary. Test quality is high — the drift is elsewhere.

**8 ACs have no `test_UAT_AC*` at all** (AC-1345…AC-1352, all created today 12:47–12:53 by the AC cycle that passed at 13:19). Every one describes *already-implemented* code — `yFactor`/`heightFactor`, `columnFit`, `nowrapFromPx`, padding tracks, `cmdRepro` — and every one is already proven by free-coded `test_UAT_FC_*` UATs.

**6 more ACs have tests that under-assert their own criterion** — AC-691, AC-706, AC-707, AC-710, AC-731, AC-736.

## The pattern behind all 14

Free-coded intents (REQ-88, REQ-96, BUG-13/14/17/18/23/24) widened this capability repeatedly. Each widening shipped with real UATs — named `test_UAT_FC_<INTENT>_*`, which carries no AC traceability. The AC bodies caught up; the AC-named reconciliation suites never did. So every behaviour here is implemented and tested, but a growing share isn't traceable to the AC claiming it. No code defect — I filed no `code-issue`.

That makes the repair mostly mechanical: the report names the specific FC UAT to re-home for each finding.

## Two things worth the editor's attention first

- **Findings 10–12 are one mechanism, not three.** The pinned-box content-overflow clip at `tools/generate/src/l1/probes.ts:412` is demanded by AC-706, AC-707 *and* AC-710. `grep -r "exceeds pinned box height" tests` returns nothing — it's the only mechanism in the capability with **zero** coverage of any kind, FC or AC. One fixture satisfies all three.
- **Finding 9 is a latent regression hole.** AC-691's fixture already varies `fontSizePx` (24/32/44) but asserts only the widest value, so dropping the per-width `responsive` track entirely would leave that UAT green.

One note: the ticket store's `git push` failed (sandbox network). The report was created and committed locally; it'll need a push from an unsandboxed context to reach the remote.
