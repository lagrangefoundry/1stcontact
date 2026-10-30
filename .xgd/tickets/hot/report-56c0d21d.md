---
uid: report-56c0d21d
id: REPORT-6904
type: report
title: 'Fix reconciliation review: bundle-5607a08d'
created_by: xgd
created_at: '2026-10-30T20:14:03.242154+00:00'
updated_at: '2026-10-30T20:14:03.242154+00:00'
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
- story-58b2cec4 (see):
  - The stale "Worker never composes the surface" note is marked resolved by 13aa65737c.
  - Added a note that the untrusted frame is kept on the picture path.
  - New AC-2067 (acceptance_criterion-827e8986) covers the untrusted-content frame on screenshot results reaching the model.
  - AC-2035 now runs all six operations, including check_fidelity, and requires each to succeed.
  - AC-2024 now covers the Worker-without-BROWSER branch, in the .workers test file.
- story-47fb84e6: AC-2036, AC-2039 and AC-2040 verification now drives the real `1c diff --json` / `1c gate --json` CLI on the same bundle, through the composed Toolbox.
- story-31204812 (STORY-159), G1:
  - AC-2046, AC-2048, AC-2049 and AC-2050 titles rewritten to match their bodies and the code. Stale UAT names renamed.
  - Reconciliation Decisions now records the intent–code conflict with REQ-157 AC6.
  - Follow-up BUG-315 (bug-84072362, draft) filed and linked.
  - AC-2051 now asserts a mid-capture refusal: it is in the refusals list, never sent, and leaves one audit record. The code does not journal the refused URL. That is recorded as Known gap 7 and in BUG-315 rather than pinned as correct.
- story-b3de4571:
  - AC-2014 activated; test_UAT_AC2014 added, replacing the FC BUG-44 copy.
  - AC-1104 now asserts site.json is byte-identical and the listing entry has no alt, registered or declared field.
- story-325da65f:
  - AC-2021 activated; test_UAT_AC2021 added (role filter options, detail role, unknown role shown raw).
  - AC-1725 pins the literals and the area order.
- story-c46abfa6:
  - AC-1022 human output asserted: one line per asset, no `(unregistered)`, `(no assets)` for an empty site.
  - AC-1018 asserts no alt or declared field, and that the legacy key is ignored.
- story-aacb7060: AC-2017's refusal half now reaches the rights gate. A site-role, non-republishable material gets NotRepublishableError and no journal entry.
- story-1500b111:
  - AC-2020: `rule()` reads every block, and a DOM order test (icon, title, pills) is added.
  - AC-2019: the kind-pill absence check is strengthened.
  - AC-1717: wording pluralised to "sites".
- story-a58a0974:
  - New AC-2066 (acceptance_criterion-ea5191fe) and UAT for the per-turn reminder wording: says "client", not the old word.
  - AC-2054 asserts "user" is absent from the preamble.
  - AC-2056 re-reads the transcript header after the further turn.
- story-e15a19ef: AC-2064 rejects `serve` as a whole word anywhere in help and asserts no port is bound. The code-issue note is resolved.

## Stories deleted
None.

## ACs superseded
None.

## FC orphans renamed/deleted
No fc_orphan_check report exists. Only one FC test was moved: test_UAT_FC_BUG-44_write_image_forbids_standing_in_for_a_supplied_file was removed in favour of test_UAT_AC2014.

## Code changes
- tools/generate/src/cli/ai/fidelity-core.ts: contentBlocksFrom now carries the Toolbox's text around the block array (the untrusted-content frame) onto the first and last blocks. This fixes the misjudged code_frozen override, item 5 (trust boundary), and is covered by AC-2067.
- tools/generate/src/cli/index.ts: removed the leftover `serve` mentions from the help/USAGE text (REQ-177).

## Confidence
Moderate to high. Every review finding (override item 5, G1–G5) has been acted on. Tests were written without being run, per instructions, so the post-fix suite run is the first execution. Highest risk: the new AC-2036/2039/2040 CLI-equivalence tests and the AC-2035 check_fidelity run, which relies on a fake browser answering value extraction.
