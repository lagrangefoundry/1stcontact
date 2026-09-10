---
uid: report-c47daafa
id: REPORT-3712
type: report
title: 'Fix Builder Workspace: Chrome, Origin & Display Panel (ac) — attempt 5'
created_by: xgd
created_at: '2026-09-10T10:03:20.339899+00:00'
updated_at: '2026-09-10T10:03:20.339899+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-a994b8f3
  level: ac
  fixes_applied: 4
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-e37a6b4a
---

# Fix Summary — Builder Workspace: Chrome, Origin & Display Panel (ac)

**Attempt**: 5
**Fixes applied this call**: 4
**Violations remaining**: 0
**Needs more work**: false

The single violation (finding 1, AC-978) is repaired, both warnings (findings 2
and 3) are taken in the same pass as the report's Notes for the Editor
recommended, and the carry-through the report flagged in finding 5 is applied.
Findings 4, 6, 7 and 8 are `info` with resolution category `—` and required no
action.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | ac-edit | AC-978 (`acceptance_criterion-53c66f17`) | Rewrote the enumeration to the served classes as they now are: **the rendered channels** and **the built-artifact tree**, the latter naming its three prefixes by name — `/builder/*` (browser source), `/webui/*` (installed components), `/framework/*.js` (framework bridges and the edit client). Identical-outcome clause **kept and re-pointed** from "all three trees" to "the channels and every prefix of the artifact tree". Verification now demands a `/framework/` traversal probe (plain and percent-encoded) alongside the existing two. Title retitled off "on every tree" |
| 2 | ac-edit | AC-964 (`acceptance_criterion-46d5804e`) | Added a one-paragraph deferral to AC-1400 in the shape the AC-1036 repair used: the fall-through ordering, the behind-the-gate property and the no-account case are AC-1400's in full; AC-964 exercises the artifact only as one member of its route-class sweep and asserts nothing about ordering. Verification's "Include the build artifact explicitly" clause re-worded to say why the probe belongs to *this* sweep and to point the ordering rationale at AC-1400. AC-1400 left untouched |
| 3 | ac-edit | AC-972 (`acceptance_criterion-285b8c08`) | Narrowed to what it owns — publish is invoked for the *displayed* site, a revision is appended and locked in the same form a command-line publish produces, no publish semantics exist only in the workspace. The "and the published channel is rendered and subsequently served" clause is deferred to AC-1035 by an explicit sentence citing the STORY-99 out-of-scope line. Verification's serving assertion removed and marked not-to-be-restated. Title lost *"and the published result is served"* |
| 4 | ac-edit | AC-1036 (`acceptance_criterion-46e9debf`) | Carry-through of finding 5's closing note: its deferral sentence inherited AC-978's stale *"across all three trees"* phrasing. Now reads "across every tree the origin serves — the rendered channels among them, alongside each prefix of the built-artifact tree". Nothing else in AC-1036 changed; its own repair from the prior attempt is intact |

## Verification Performed

- **Code re-read before editing AC-978, not taken from the report.**
  `apps/control-app/src/router.ts:45-47` names `/builder/*`, `/webui/*` and
  `/framework/*.js` as build artifacts served by the assets binding;
  `tools/generate/src/cli/assets.ts:34-36` emits `dist-assets/builder/**`,
  `dist-assets/webui/<pkg>/**` and `dist-assets/framework/*.js`;
  `tools/generate/src/cli/builder.ts:148-168` resolves all three through a
  single `resolveStaticFile(dir, url.pathname)` over one `assetsDirOf(ctx)`
  root. Confirms both halves of finding 1 — the missing `/framework/` class and
  that the other two are prefixes of one tree, not two trees.
  (`builder.ts` contains NUL bytes; read via `grep -an … | tr -d '\000'`.)
- **`/framework/` reachability confirmed** at
  `tests/reconciliation-builder-workspace-origin.test.ts:416-418`, which drives
  `/framework/edit-client.js`, `/framework/site-schema-edit.js` and
  `/framework/site-schema-shade.js` as a route class of its own.
- **Stale-phrasing sweep**: all 36 ACs on STORY-99 re-read after the edits for
  `all three trees` / `three trees` / the old `the installed components, and
  the …` enumeration. Zero hits — the matrix no longer contradicts itself on
  what is served.
- **The report's "check other 2026-08-16-stamped ACs" note was acted on.**
  Listed all 36 ACs by `updated_at`. AC-978 was one of 24 stamped 2026-08-16;
  the REQ-145 batch is the six stamped 2026-08-31. Of the 2026-08-16 set, the
  ones touching served-route topology are AC-961/962/963 (component
  consumption) and AC-979 — the ledger marks all four aligned and the report
  checked AC-979 explicitly this run. No second element of AC-978's shape was
  found.

## Code Edits (if any)

None this call. No production or test file was modified, so no test run was
warranted — the AC-978 evidence test is byte-unchanged and its result is
unchanged with it. All four mutations are ticket-body edits via
`xgd ticket update --body-file`.

## Carried Forward to the uat Cycle (not ac-level, not fixed here)

Both were flagged by `report-dcfe6d0a` as `uat-edit`s belonging to the uat
cycle, and both are now *more* visible because the ACs moved:

| Element | Evidence | Gap |
|---|---|---|
| AC-978 | `tests/reconciliation-builder-workspace-origin.test.ts:202-235` | The `trees` table probes the channels and `/builder/` unconditionally and `/webui/` gated on `WEBUI_INSTALLED`. It has **no `/framework/` probe group**, which the rewritten criterion and Verification now require. `uat_coverage` left at `pass` — the field is owned by check/fix_uat_coverage and setting it here would be this cycle writing another cycle's field; recorded so the uat pass picks it up rather than silently inheriting a stale pass |
| AC-964 | `tests/reconciliation-builder-workspace-origin.test.ts:688-748` | The unadmitted probe runs against `/preview/...` only, never against a build artifact, while the Verification demands the artifact explicitly. Unchanged by this pass and independent of the AC-964 edit |

## needs_review Items Forwarded

None. Every finding in `report-dcfe6d0a` carried a resolution category or was
`info` requiring no action.

## Standing Operator Item (fifth time raised, not an ac-level fix)

No `intent_uid` on CAP-85 or on any of its 36 ACs, and a scalar `updated_by` on
STORY-99 holding only `bundle-78f4e2fe`. Finding 1 was mechanically "an AC whose
last revision predates the intent that superseded it" and would have been one
query with those fields populated, instead of a fifth reconstruction of the
ledger. This is a backfill decision for the operator.
