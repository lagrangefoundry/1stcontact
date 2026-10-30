---
uid: report-4dc964af
id: REPORT-6910
type: report
title: 'Fix reconciliation review: bundle-5607a08d'
created_by: xgd
created_at: '2026-10-30T20:31:51.573188+00:00'
updated_at: '2026-10-30T20:31:51.573188+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_reconciliation_review
  subject_uid: bundle-5607a08d
  needs_more_work: false
  progress_made: true
---

## Stories created
None.

## Stories modified
- **story-58b2cec4 (STORY-157)**
  - Technical Context: the claim that "the untrusted-content frame is kept on the picture path" is replaced. It now says the frame is NOT kept (`contentBlocksFrom` returns the inner array bare), gives the provenance (grant report-be7d1be4, ungranted edit 0a0f97f216 reverted per report-84f2f9bc F1), and links BUG-316.
  - Reconciliation Decisions: added an **intent–code conflict** entry. REQ-157 says captured text "must never be able to read as an instruction", but screenshots reach the model unframed; the follow-up is BUG-316.
- **story-e15a19ef (STORY-79)**
  - Guarantee 7 no longer claims the help names no `serve` anywhere. It now says there is no `1c serve` line, `1c builder` is offered, and two prose mentions remain.
  - The "Help-text straggler resolved" bullet is replaced with a "Code issue — help-text stragglers (do NOT encode as an AC)" note. The note records the two remaining `serve` mentions in `cli/index.ts` USAGE and explains why they are still there (the removal was ungranted and was reverted per F1).

## ACs modified
- **AC-2067 (acceptance_criterion-827e8986)**
  - Retitled and rewritten to the running code, as F1 remediation (b) directs: the model receives exactly the recovered inner block array (text, then image) with no frame markers.
  - Marked as a known gap against REQ-157 and tracked by BUG-316.
  - UATs rewritten to match: `test_UAT_AC2067_a_screenshot_reaches_the_model_as_the_bare_blocks_without_the_frame` (on the wire, through the real Node host) and `test_UAT_AC2067_content_blocks_recovered_from_a_framed_rendering_are_the_inner_array` (Toolbox rendering is framed, `contentBlocksFrom` returns exactly the inner array, image-first case, unframed passthrough, refusal → null).
- **AC-2064 (acceptance_criterion-d60382f0)**
  - Body aligned to the code, as F1 remediation (c) directs: help has no `1c serve` line and offers `1c builder` / `wrangler dev`. The two leftover prose mentions are noted as outside the criterion.
  - UAT: removed the `\bserve\b` whole-word assertion that 0a0f97f216 had added, because the help-text change it pinned was reverted. The `^\s*1c serve` line check and the `net.Server#listen` no-bind check are kept.

## Bugs filed
- **BUG-316 (bug-d9778adf)**: Fidelity surface: screenshot reaches the model without the untrusted-content frame. Severity high. It carries the reverted framing as a reference implementation.

## Stories deleted
None.

## ACs superseded
None.

## FC orphans renamed/deleted
None. No fc_orphan_check failure applies to this call.

## Code changes
The production hunks of 0a0f97f216 are reverted, because no mode_override grant covered them (review F1):
- `tools/generate/src/cli/ai/fidelity-core.ts`: removed the `framed()` helper and its doc paragraph. `contentBlocksFrom` again returns the parsed array bare, matching the reference state.
- `tools/generate/src/cli/index.ts`: restored "render/serve/shot/…" and "render, serve, builder, …" in USAGE. This matches the code as it stood before the ungranted edit.

Neither file is now changed relative to its state before the fixer, so no production code in this branch remains without an audited grant.

## Confidence
Moderate to high.
- F1 is resolved by revert, which is remediation (a), plus alignment as (b) and (c) direct: AC-2067 and story-58b2cec4 now describe the running code, the REQ-157 conflict is recorded under Reconciliation Decisions, follow-up BUG-316 is filed, and story-e15a19ef records the help leftovers with AC-2064 aligned.
- report-be7d1be4 item 5 is now a recorded, tracked gap rather than an unaudited preservation.
- Tests were not run, as instructed. The rewritten AC-2067 UATs assume the screenshot result is exactly [text, image], which matches `blocksOf` in the same suite and the reference-state code.
- The operator may prefer to grant the framing through the test_fix planner at rung 1. BUG-316 holds that path open.
