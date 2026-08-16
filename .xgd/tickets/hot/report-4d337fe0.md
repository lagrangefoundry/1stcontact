---
uid: report-4d337fe0
id: REPORT-2121
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-18'
created_by: xgd
created_at: '2026-08-16T21:34:09.993006+00:00'
updated_at: '2026-08-16T21:34:09.993006+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-18
---

## Files resolved

- **`package.json`** — class `UU`, config/scalar. Ours (`sync_working_to_main`, 3ddd5a25e, 2026-08-15 18:58) had `"version": "0.1.52"`; incoming (7a026167, 2026-08-13 09:36) bumped `0.1.39 -> 0.1.40`. Timestamp rule (enrichment: "take the more recent commit by timestamp") selects ours. This also preserves monotonicity — `0.1.40` was already consumed and passed on this branch by six later post-watermark sync commits, so accepting incoming would regress the version. Resolved to `0.1.52`.

- **`tests/reconciliation-beyond-l1-authoring.test.ts`** — class `UU`, code/test file, rule 2c.3b (both sides made independent useful changes to the same region — integrate manually to achieve BOTH intents). Single conflicted hunk at the CLI/surface-parity assertions in `test_UAT_AC1109_every_capability_is_reachable_from_the_command_line`. The two sides changed *different facts* in one contiguous block:
  - Incoming changed the **palette fact**: `palette.primary.steps` -> `palette.primary` as `{ value: '#0f3f52' }`, plus a new `palette.ink` assertion (REQ-137: an entry is one colour, named steps deleted).
  - Ours changed the **asset/module facts**: `.toContain('wordmark.svg')` -> `.toEqual(['wordmark.svg'])`, `MARK` -> `REDRAWN` on both `viaCli` and `viaSurface`, and added `modules.map(m => m.id)).toEqual(['signup'])`.

  Kept both. A naive "ours wins by timestamp" was rejected here because it is not merely a lost intent but a **broken file**: ours' surviving lines reference `PALETTE.primary.steps.light`, and the non-conflicted `PALETTE` const at line 111 — which merged cleanly from incoming — no longer has a `steps` key, so those assertions would read `undefined`.

## Incoming changes preserved

`package.json` — incoming's intent (a version bump accompanying the free-coded commit) is present **via a different route**, not discarded: the branch's version line has been advanced past `0.1.40` to `0.1.52` by later post-watermark syncs. Per STEP 3 this is the "redundant, not discarded" case.

`tests/reconciliation-beyond-l1-authoring.test.ts` — every hunk of `git show 7a026167 -- <file>` verified present in the resolved file:

| Incoming hunk | Verified at |
|---|---|
| `PALETTE` loses `steps`; gains `surface-raised` / `surface-sunken` | L111-117 |
| sibling-survival assertions on `surface-raised` / `surface-sunken` | L177 |
| new typography depth-merge assertions (`baseSizePx: 19`) | L181-186 |
| `accent: { value: 'cornflower' }` (steps removed) | L258 |
| CLI `JSON.stringify({ primary: { value: '#0f3f52' } })` | L1051 |
| **conflicted hunk**: `palette.primary` -> `{ value }` + `palette.ink` | L1104-1105 |

No test function was deleted from either side; the file's `it(...)` roster is unchanged.

## Spot-check

`xgd quality run --tests test_UAT_AC1109_every_capability_is_reachable_from_the_command_line` — **1 passed, 0 failed** (1567 deselected), suite `javascript-vitest` exit 0, lint 0 errors / 0 warnings. This is the test that contained the conflict.

## Flagged for post-merge review

Both files carry the enrichment's "intent unknown on one or both sides -> flag for post-merge review" marker.

Additionally, and **not caused by this resolution**: the unfiltered pass of that run shows a broad pre-existing failure baseline on this mid-bundle tree — 74 failing tests across 12 files, 11 of which this resolution never touched (`reconciliation-assistant-control-surface`, `reconciliation-assistant-conversation`, `reconciliation-builder-assistant-pane`, `reconciliation-page-composition-surface`, `test_UAT_FC_REQ-122_*`, `-126`, `-127`, `-129`, `-130`). Within the resolved file, 11 tests fail — `AC1096`-`AC1105`, `AC1107` — all outside the conflicted hunk:

- `AC1098`+ fail with `TypeError: answer.replace is not a function`, the same cross-cutting read-payload shape error hitting the 11 untouched files.
- `AC1097` fails on an **incoming-authored** line (`accent: { value: 'cornflower' }` expects `SCHEMA_INVALID`, got `[]`), i.e. the incoming commit's expectation against a validator state the rest of the bundle has not yet finished landing.

`AC1095` and `AC1109` — the two tests carrying the palette hunks relevant to this conflict — are not among the failures. These baseline failures belong to the regression/story stages, not to conflict resolution.
