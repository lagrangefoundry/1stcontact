---
uid: report-b31905da
id: REPORT-11603
type: report
title: 'Report: mode_override for story-58b2cec4'
created_by: xgd
created_at: '2026-11-08T22:47:09.680135+00:00'
updated_at: '2026-11-08T22:47:09.680135+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: mode_override
  subject_uid: story-58b2cec4
  anchor_ticket: bundle-7ba3af93
  rule: code_frozen
  batch_index: 1
  parent_report_uid: report-7367338f
  quality_mode: reconcile
  justification: REQ-216 (in scope) states There is no way to name a selector, an
    id or an attribute, and requires a menu to match option words first and value
    only as a fallback; the settled AC-2479 test asserts exactly this, and interact.ts
    at the reference contradicts it in fillNames (197-206) and the option loop (278-286)
    while its own comments at 12-17 and 278-279 state the REQ-216 intent. This is
    batch 1, not batch 0 denied by report-07babd4a, and the grant covers a different
    file with no trust-boundary component.
  files:
  - tools/generate/src/cli/capture/interact.ts
  rung: 1
  tip_evidence:
  - file: tools/generate/src/cli/capture/interact.ts
    lines: 197-206
  - file: tools/generate/src/cli/capture/interact.ts
    lines: 278-286
  external_cause: null
  planner_trust_boundary: false
  granted_head: 32a4153d34bbba0faac730dbb2fe290c4d0ef23d
---

# Mode override granted: code_frozen

REQ-216 (in scope) states There is no way to name a selector, an id or an attribute, and requires a menu to match option words first and value only as a fallback; the settled AC-2479 test asserts exactly this, and interact.ts at the reference contradicts it in fillNames (197-206) and the option loop (278-286) while its own comments at 12-17 and 278-279 state the REQ-216 intent. This is batch 1, not batch 0 denied by report-07babd4a, and the grant covers a different file with no trust-boundary component.

Planner instructions for the batch:

code_frozen is lifted for tools/generate/src/cli/capture/interact.ts only, in this batch. Make exactly the change the previous builder diagnosed (REPORT-11596 / handoff REPORT-11597). (1) In the STEP_BODY fillNames, stop offering the name attribute and the element id as names a field can be matched by, so that fill email_input is refused as no-match with INTERACTION_FAILED and no picture. Labels, aria-label, aria-labelledby and placeholder stay. (2) In the SELECT branch, choose the option in two passes: first the option whose normalised words equal the wanted value; only if none matches, the option whose value does. Then fill Region with United Kingdom selects the option reading United Kingdom (value GB), not an earlier option whose value is United Kingdom. Keep the post-fill landed check consistent with the chosen option. Do NOT edit test_UAT_AC2479, AC-2479 or any other test or AC, and edit no production file other than interact.ts. Keep AC2477/2478/2480/2481/2482, every test_UAT_FC_REQ-216_ test and AC2025/2027/2028 green.
