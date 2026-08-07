---
uid: report-378dec0b
id: REPORT-1612
type: report
title: 'UAT Coverage: Site Asset Store: What This Site Can Reference'
created_by: xgd
created_at: '2026-08-07T19:17:07.491212+00:00'
updated_at: '2026-08-07T19:17:07.491212+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-105cfacf
  violations: 0
  warnings: 2
  needs_review_count: 0
  anchor_report_uid: report-17a279f7
---

# UAT Coverage Assessment: Site Asset Store: What This Site Can Reference

**Result**: PASS
**AC verdicts**: 0 pass, 0 fail, 0 deprecated, 0 needs_review — *this capability owns no ACs*
**Story verdicts**: 0 pass, 0 fail, 0 stale, 0 needs_review — *this capability owns no stories*
**Capability verdict**: pass

Anchor report: report-17a279f7. Scope
`xgd/structural_validation/report-17a279f7/cap/capability-105cfacf/3/1`.

## The finding that determines this assessment

**CAP-88 is retired.** `status: superseded`, `superseded_by_uid:
capability-b4ac88fc` (CAP-89 — *Site Materials & Starting Point*), set at
2026-08-07T18:53 by the story-level structural fix (REPORT-1608,
report-84177029), which also copied CAP-88's stranded scope statements — the one
handle vocabulary, the usage kind, reachability without an editing gesture, and
the "lists what exists, never uploads or converts" out-of-scope clause — into
CAP-89's body so the retirement was lossless.

**It owns nothing to assess.** Its sole story, STORY-102 (story-c46abfa6), now
carries `capability_uid = capability-b4ac88fc`, and its six criteria AC-1018…
AC-1023 hang off that story. Zero ACs carry `capability_uid =
capability-105cfacf`.

This was verified from the tickets themselves, not from the index — see warning 1:
`xgd ticket list --filter fields.capability_uid=capability-105cfacf` still
returns STORY-102, and that stale answer is the only reason this capability was
scheduled into the batch at all. All 25 stories were fetched individually with
`xgd ticket get --json` and their own `fields.capability_uid` read off the
ticket; none points at CAP-88.

There is therefore no coverage gap that could be opened here, and nothing for a
fix loop to act on: the elements a fix would touch belong to CAP-89's tree.

## Coverage of the subject matter — independently re-verified, not inherited

A retired capability whose subject moved elsewhere passes only if the subject is
actually evidenced *somewhere*. It is, and this assessment re-derived that from
the code rather than taking REPORT-1606 at its word:

`tests/reconciliation-site-asset-listing.test.ts` — **6 tests, 6 passed**
(`npx vitest run`, 820ms, this session):

| AC | UAT | Entry point exercised |
|---|---|---|
| AC-1018 | `..._a_file_present_in_the_site_assets_is_listed_even_when_undeclared` | `run(['asset','list',slug,'--json'])` over a real temp site tree |
| AC-1019 | `..._a_declared_asset_contributes_its_identity_and_is_listed_with_no_file` | same CLI entry point; merge-by-handle asserted, `ghost` (declared, no file) visible as missing |
| AC-1020 | `..._every_listed_asset_is_named_in_the_site_local_handle_a_page_holds` | CLI + the handle read back off `pages/home.json` on disk, not a restated constant |
| AC-1021 | `..._each_asset_reports_what_it_can_be_used_for` | CLI; kind derived from real files (png/jpg/svg/woff2/css) |
| AC-1022 | `..._the_store_answers_from_the_command_line_with_no_editing_gesture` | CLI, full entry shape + exit code; empty site is a success, not a failure |
| AC-1023 | `..._the_store_answers_from_the_builder_origin_and_refuses_a_missing_site` | `startBuilder` + live `fetch` over HTTP, cross-checked entry-for-entry against the CLI answer, plus the real `fetchAssets` client; missing `slug` → 400 |

Evidence quality is sound by the project's aesthetic: real filesystem, real
`run(argv)`, real HTTP origin, no internal component mocked (the only doubles
are `console.log`/`console.error` spies used to capture the envelope). AC-1023
is the load-bearing one for this capability's central claim — "one listing, many
consumers" — because it asserts the two entry points return the *same* entries
rather than each matching a constant separately. AC-1020's off-site-URL clause
proves the handle normalisation has a deliberate boundary rather than a blanket
prefix.

All six ACs already carry `uat_coverage: pass` from REPORT-1606 (CAP-89, PASS).
They were **not** re-written here: they belong to CAP-89's tree, and writing to
them from a retired capability's assessment would give them two owners.

## Cumulative Intent Considered

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-118 (request-66e4c630) | free_and_reconciled, merged `b2b9208c` | created 2026-07-31, reconciled 2026-08-07 | Image selection: click image segment → asset picker → structured `src` edit. Created STORY-102 — the asset store as a surface of its own, the listing the picker draws from. Explicitly *supersedes in place* the older registry-only `asset list`; no legacy listing left behind. | YES |
| REQ-119 (request-4…) | draft | 2026-07-31 | Request-time draft/edit renders inside control-app | NO (not yet active) |

No later intent of any counting status retires the asset-store behavior.
BUNDLE-16 (REQ-117/115/44, reconciled 2026-08-07) touches the editing surface
and builder shell, not this listing — and REQ-118's own body records that the
editing surface deliberately does *not* call the `/api/assets` route (its choices
travel with the region it reads), which is why no AC asserts that it does.

The retirement of CAP-88 itself was **structural, not intent-driven**: a
consolidation of four thin material-inventory capabilities into CAP-89 under the
overlap survey. No intent asked for the *behavior* to go away, and it has not.

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| *(none — CAP-88 owns no stories)* | — | — | STORY-102 moved to CAP-89 before this round; aligned against REQ-118 there (REPORT-1599 / REPORT-1606, both PASS) |

## Findings — Categorized by Editor Action

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | capability | CAP-88 (capability-105cfacf) | *(none — infrastructure)* | The ticket index still answers `fields.capability_uid=capability-105cfacf` with STORY-102, though the ticket's own field reads `capability-b4ac88fc`. This stale answer is why a retired, empty capability was scheduled for coverage assessment. Already escalated by REPORT-1608; `xgd ticket rebuild-index` refuses to run from a branch worktree by design. | Run `xgd ticket rebuild-index` from `xgd-working`. No ticket edit. |
| 2 | warning | uat | AC-1018…AC-1023 | *(none — infrastructure)* | `.xgd/uat_index.json` was last written 2026-08-07T15:22 and reports all six of STORY-102's UATs as `status: missing`. All six exist and pass. The index is stale, not the tests. | Regenerate the UAT index after the reconciliation UATs landed. |

Both are infrastructure defects outside this capability's tree. Neither is a
coverage gap, neither is fixable by a ticket edit, and neither affects the
verdict.

## Notes for the Editor

**There is nothing to fix in this capability, and a fix loop should not be run
against it.** CAP-88 is a retired shell with zero stories and zero ACs; any edit
a fix workflow could make would land on CAP-89's tree, which is already assessed
PASS (REPORT-1606) and whose six asset-store UATs I re-ran green in this session.

**Two prompt-level hazards worth fixing in the workflow, not the tickets** —
both would silently produce false FAILs on future runs:

1. *The AC→UAT lookup in the `uat_coverage_check` prompt cannot ever hit.* The
   snippet builds its key as `'<AC-human-id>'.replace('-','').upper()` → `AC1018`,
   but `.xgd/uat_index.json` keys are lowercase (`ac1018`). Following the prompt
   literally returns `[]` for **every** AC in the project, which reads as "no
   test exists" — a coverage-gap generator. It should be `.lower()`.
2. *The index is not a safe input for retirement checks.* Independently of
   warning 1, `xgd ticket list --type capability --json` omits
   `superseded_by_uid`/`merged_into` entirely, so an index-based check of "is
   this capability retired?" reads false for every retired capability. Any
   scheduler deciding what to assess should read `xgd ticket get --json`.

**Batch hygiene.** If the overlap consolidation retired other capabilities in
the same cluster (CAP-80, CAP-83, CAP-81, CAP-84 per REPORT-1608), any of them
still in this run's batch will produce this same shaped report. One
`rebuild-index` pass from `xgd-working` clears the cause for all of them at once.
