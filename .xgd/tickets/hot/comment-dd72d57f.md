---
uid: comment-dd72d57f
id: COMMENT-1266
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-08-20T06:08:17.202741+00:00'
updated_at: '2026-08-20T06:08:17.202741+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-552e1877
  kind: note
---

Attempt 8 complete — both violations from `report-60445a46` are closed, with the pairings each required.

**Finding 1 (AC-1289, coverage — `--clusters` over `--collapse` precedence unproven)**
The branch was a bare inline ternary inside the `--multi-viewport` block, unreachable without a real render. Extracted it into an exported pure helper `selectMultiViewportPayload(cells, {clusters, collapse, json})` in `tools/generate/src/cli/fidelity.ts`; the dispatcher (`index.ts:794-802`) now just prints `.output`. Added `test_UAT_AC1289_clusters_takes_precedence_over_collapse_in_both_serialisations`, which asserts clusters wins in **both** serialisations and that the losing collapsed view is genuinely different. Red-checked it: flipping the precedence in the helper failed exactly that one test (1 failed | 36 passed), then reverted.

**Finding 2 (AC-1288, consistency — a clause REQ-73 retired)**
Verified the retirement at source before acting: `cli/capture/values-diff.ts:2550-2583` emits `§<n>` rows carrying only `overlay`/`contentAnchor`/`textAlign`, with an in-code REQ-73 comment, so the `§`+`padding` structural rule fired on nothing. Applied as a four-part pairing — AC-1288 body (clause out of the Criterion, case 4 out of Verification, replaced by a `§`-absence assertion), STORY-116 body (item 4, the printed-order step, In-scope, plus two Technical Context bullets), the dead condition deleted at both sites in `fidelity.ts` plus the report heading that advertised it, and the UAT re-baselined with the synthetic `§0` push dropped (`A-structural 3 → 2`).

**W1 needed no action.** AC-1307 already carries the `**Evidence gating.**` paragraph the report suggested adding — the obligation is discharged; only a Chromium-provisioned runner remains, which nothing here can supply.

**Test state, honestly:** the target file is 37 passed / 0 failed. Across a 13-file fidelity batch, 180 passed / 11 skipped / 1 failed — the failure is `test_UAT_FC_REQ-48_engine_driver_factory_and_availability` timing out at 60s on `engineAvailable('webkit')`, alongside the same `EPERM: listen` suite error the last two attempts logged as environmental. Neither touches the edited paths. `tsc` reports one pre-existing error in `builder.ts:337`, untouched by this call and importing nothing from `fidelity.ts`.

Completion report filed as `report-552e1877` (`fixes_applied: 9`, `violations_remaining: 0`, `needs_more_work: false`). Code changes are left uncommitted in the working tree for the outer workflow.
