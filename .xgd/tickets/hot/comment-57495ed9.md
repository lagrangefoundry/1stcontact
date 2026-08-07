---
uid: comment-57495ed9
id: COMMENT-768
type: comment
title: Claude response for uat_coverage_check report
created_by: xgd
created_at: '2026-08-07T16:52:17.162613+00:00'
updated_at: '2026-08-07T16:52:17.162613+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-25a2e361
  kind: note
---

**PASS** — REPORT-1588 (`report-25a2e361`). 0 violations, 2 warnings, 0 needs_review.

## What I assessed

CAP-83 turned out to be a **pre-merge alias**: it carries `merged_into: capability-b4ac88fc`, stamped at 15:59Z by this run's own overlap resolution, and its single story STORY-97 now records `capability_uid: capability-b4ac88fc`. Two traps here, both of which I had to correct course on:

- `xgd ticket list --filter fields.capability_uid=capability-e382c142` still returns STORY-97 from a **stale index**; the ticket itself does not. Reading the filter as truth would have said "1 story"; reading the ticket said "0".
- `--type ac` returns zero tickets because the type is `acceptance_criterion`. My first pass concluded the capability was empty; it has 9 ACs.

I reached the tree through the merge target, which is what the sibling checks did.

## Verdicts

9 ACs `pass`, STORY-97 `pass`, CAP-83 `pass` — all written and verified as persisted.

Evidence is executed, not inferred: I ran `npx vitest run tests/reconciliation-colour-census-and-retrofit.test.ts` → **9/9 passed in 20.04s**. All 9 UATs drive real entry points — the shipped `1c` binary as a real subprocess for the stdout/exit-status ACs, real `cmdColors`/`cmdColorsAssign`/`cmdRender`/`cmdRepro` handlers for the rest. No internal mocking. I read the two gate tests myself rather than trusting the prior level's summary; AC-944 notably carries a `collectRefs(...).length > 0` guard that defeats a vacuous pass.

## Two warnings

1. **AC-939 negative case is over-determined** (`tests/…census-and-retrofit.test.ts:249-253`). The "no alpha-families section" assertion seeds `harbor-cafe`, which has *zero* colour literals — so absence is equally explained by having no colours at all. The discriminating case (literals present, no multi-opacity RGB) is untested. This duplicates REPORT-1587's finding 1; I re-derived it independently and agree. Fix once, both clear.

2. **CAP-83's retirement is half-applied** — this is the one nothing else will catch. `merged_into` was stamped, but `status` was left `active` with no `superseded_by_uid`, unlike the two siblings retired by the same workflow minutes either side (CAP-81 at 15:41Z, CAP-84 at 16:03Z, both → `superseded`). Consequence: an emptied capability stays in the active set and gets re-iterated by every future structural-validation pass. Suggested fix is in the report.

I kept #2 a warning rather than `needs_review` deliberately: the correct action is mechanically determined by the CAP-81 precedent, so there's no operator judgment to make, and forcing a FAIL would send the fix workflow hunting for UATs to author against a capability that owns nothing — the thrash pattern CLAUDE.md warns about.

The specific risk worth ruling out was whether the merge laundered an uncovered capability out of sight. It didn't — and CAP-89 has no `uat_coverage` verdict yet, so STORY-97 will be re-assessed on its own footing rather than falling through the gap between the two subjects.

One unrelated note: the claude.ai Gmail/Calendar/Drive MCP connectors reported that they need authorization. Nothing in this task touched them, but they'll stay unavailable until you authorize them from your claude.ai connector settings.
