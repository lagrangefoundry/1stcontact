---
uid: report-1b3c5555
id: REPORT-2465
type: report
title: 'Fix Site Storage Port: One Async Store Behind Every Edit (ac) — attempt 1'
created_by: xgd
created_at: '2026-08-20T16:00:56.042125+00:00'
updated_at: '2026-08-20T16:00:56.042125+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-c4c7a854
  level: ac
  fixes_applied: 3
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-2485c83c
---

# Fix Summary — Site Storage Port: One Async Store Behind Every Edit (ac)

**Attempt**: 1
**Fixes applied this call**: 3
**Violations remaining**: 0
**Needs more work**: false

Both violations (findings 1 and 2) and the one warning (finding 3) from
`report-8f9bb2e8` are addressed. Findings 4–7 are `info` with an explicit "none"
resolution and were left alone by design. No `story-body-edit` was made: the
report's Notes for the Editor state that STORY-118 already says everything the
AC layer was asked to express, and I confirmed that against the story body
(Description names all four journal-facing questions and names the tool adapter
twice; Out-of-scope retains the totality claim for the journal verbs; Technical
Context already carries the suite-state attribution finding 3 defers to).

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | ac-edit | AC-1321 (`acceptance_criterion-d4cc3712`) | Extended both enumerations from 7 verbs to the full port surface: added "record a change", "read the changes since a given count", "report what the draft has pending" to the held-site list, and their empty answers to the unheld-slug list. Recorded the pending-against-no-base-revision answer for a store with no revisions. Verification section extended to match. |
| 2 | ac-add | AC-1354 (`acceptance_criterion-56798f01`) | New AC covering **both** halves of finding 2 in one criterion — the start-up naming topology (CLI edit options, builder origin per context, assistant's tool adapter; nothing detects or selects downstream) and the tool adapter driving a real edit plus a self-read asset add with the unchanged not-found envelope. `story_uid=story-3f4a5f2b`, `kind=behavior`, `regression_only=false`, `status=active`. |
| 3 | ac-edit | AC-1329 (`acceptance_criterion-ae2c7f77`) | Fourth bullet (the one-time pre-split / pre-port failing-set measurement) replaced with a re-verifiable form: no assertion is conditioned on the runtime it runs in or the store it was given. The historical comparison is retained in the AC as an explicitly one-time reconciliation measurement pointing at the story's suite-state attribution, where it already lives — not deleted, per the report's instruction. Verification section updated to the checkable form. |

Also set AC-1354's `status` from the creation default `pending` to `active`, so
it matches its ten sibling ACs and reads as in-matrix.

### Detail on finding 1

Verb enumeration taken from `origin/main:tools/generate/src/store/site-store.ts`
(`appendChange` :137, `changesSince` :143, `pendingChanges` :146). Contract
details honoured in the AC text rather than paraphrased:

- `appendChange` — "Never fails a write: a store that cannot take the record
  returns the counter unmoved" (:135). The AC states this for both the held site
  and the unheld slug, so a naive "assert it appended" UAT cannot satisfy it.
  Confirmed against `memory-store.ts:148–155`, which returns `0` for a site it
  does not hold.
- `changesSince` — AC names all three parts of the answer (records after the
  count, where the counter stands now, whether the window truncated), matching
  `ChangeSlice` in `journal-model.ts`.
- `pendingChanges` — AC names the added/modified/removed file lists plus the base
  revision or its absence, matching `PendingChanges` and `memory-store.ts:162–176`.

`write` was deliberately **not** added to the enumeration (AC-1323 owns it in
full). AC-1321 now says so in one line so a later reader does not re-flag the
omission, and keeps the asynchrony assertion spanning the whole port.

### Detail on finding 2

Written as one AC, not two, per the report's explicit instruction. The three
naming sites were each verified in the tree before writing:

- `origin/main:tools/generate/src/cli/index.ts:1312` `editOptions()` — "the ONE
  place in the CLI that names the filesystem adapter".
- `origin/main:tools/generate/src/cli/builder.ts:624` `builderStore()` — one
  store per context, and `previewRenderer` (:638) builds on it.
- `origin/main:tools/generate/src/cli/ai/toolbox.ts:505` — "It is named here,
  once — the operations below it never learn which store they got".

The adapter's asset-source half is `readSourceFile` (`toolbox.ts:136–150`),
which raises the same `CommandError` code / path / hint `editAssetAdd` used to;
the AC asserts envelope identity with the CLI's refusal for the same input,
which is the half AC-1326 does not carry.

## Code Edits (if any)

None this call.

## UAT Consequences (next level, not actionable here)

Recorded so the uat cycle is not surprised, and so the assessor can see why no
test was authored alongside the new AC:

- **This worktree cannot carry these tests.** HEAD (`af939ba02`) predates
  BUNDLE-19's merge. `git ls-tree HEAD -- tools/generate/src/store/` shows
  `base/diff/fsutil/history/index/loadSite/paths/snapshot` only — no
  `site-store.ts`, `memory-store.ts`, `journal-model.ts` or `assemble.ts` — and
  `tests/reconciliation-site-storage-port.test.ts` does not exist at HEAD. Every
  citation above was read from `origin/main` via `git show` / `git grep -a`, with
  text mode forced (`builder.ts` and `fidelity.ts` carry deliberate NUL bytes).
  Authoring a UAT here would mean writing against modules absent from the tree.
- AC-1321's UAT (`tests/reconciliation-site-storage-port.test.ts:126`) walks a
  fixed list of seven questions twice; the extended AC extends that list. It is a
  `uat-edit`, not a new test, as the report predicted.
- AC-1354 has no UAT yet, the same position AC-1353 is in (report finding 5,
  classed a uat-level item rather than an AC gap).

## needs_review Items Forwarded

None. Finding 3 was the one item the assessor offered to be overruled on; I took
the classification as written (warning, resolved by narrowing the AC) because
STORY-118's Technical Context does place the failing-set comparison under
"Suite state at the time of reconciliation, and its attribution" rather than in
its In-scope list, which is the reading the assessor gave. If the operator reads
REQ-141 AC-1 / REQ-142 AC-1 as a standing regression claim instead, revert
AC-1329's fourth bullet and move the gap to the UAT level.
