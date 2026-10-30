---
uid: report-cf8f63c0
id: REPORT-6918
type: report
title: 'Report: blocked_by_handoff for report-00553335'
created_by: xgd
created_at: '2026-10-30T20:53:33.213913+00:00'
updated_at: '2026-10-30T20:59:36.942969+00:00'
completed_at: null
last_field_updated: ruling
fields:
  report_kind: blocked_by_handoff
  subject_uid: report-00553335
  rule: code_frozen
  evidence: 'Ran `npx vitest run tests/reconciliation-assistant-looking-surface.test.ts
    -t AC2067`: both UATs fail. The ''on the wire'' test gets 2 blocks where it expects
    >=3; the ''directly'' test gets [text without ''<<<untrusted>>>\n'' prefix, image]
    where it expects [framed text, image, ''\n<<</untrusted>>>'' text]. The cause
    is fidelity-core.ts:142-155. contentBlocksFrom does JSON.parse(payload.slice(open,
    close+1)) and returns `parsed`, discarding payload.slice(0, open) and payload.slice(close+1),
    which hold the untrusted frame. AC-2067 (acceptance_criterion-827e8986) was deliberately
    rewritten to require the frame, per review report-b5be9c7c F1 and override audit
    report-e1298f76 item 5. COMMENT-5849 on BUG-316 states the fix needs a new rung-1
    code_frozen grant on that one file. No Authorised exception block is present in
    this prompt, and reverting the tests to assert the frame''s absence has already
    been rejected by review.'
  proposed_change: 'tools/generate/src/cli/ai/fidelity-core.ts, contentBlocksFrom
    only: after the isContentBlocks/has-image checks, let before = payload.slice(0,
    open) and after = payload.slice(close + 1). If before is non-empty: if parsed[0].type
    === ''text'', set its text to before + text; otherwise unshift {type:''text'',
    text: before}. If after is non-empty: if the last block is text, set its text
    to text + after; otherwise push {type:''text'', text: after}. Return the new array.
    An unframed payload (empty before and after) still returns exactly its blocks,
    and a refusal or non-picture still returns null. No test, AC or story changes
    are needed; both AC2067 UATs already assert this behaviour.'
  batch_index: 0
  parent_report_uid: report-234be966
  anchor_ticket: bundle-5607a08d
  ruling: granted
  ruling_reason: the planner granted an override in its plan
---

# Builder blocked by `code_frozen`

**Evidence**: Ran `npx vitest run tests/reconciliation-assistant-looking-surface.test.ts -t AC2067`: both UATs fail. The 'on the wire' test gets 2 blocks where it expects >=3; the 'directly' test gets [text without '<<<untrusted>>>\n' prefix, image] where it expects [framed text, image, '\n<<</untrusted>>>' text]. The cause is fidelity-core.ts:142-155. contentBlocksFrom does JSON.parse(payload.slice(open, close+1)) and returns `parsed`, discarding payload.slice(0, open) and payload.slice(close+1), which hold the untrusted frame. AC-2067 (acceptance_criterion-827e8986) was deliberately rewritten to require the frame, per review report-b5be9c7c F1 and override audit report-e1298f76 item 5. COMMENT-5849 on BUG-316 states the fix needs a new rung-1 code_frozen grant on that one file. No Authorised exception block is present in this prompt, and reverting the tests to assert the frame's absence has already been rejected by review.

**Proposed change**: tools/generate/src/cli/ai/fidelity-core.ts, contentBlocksFrom only: after the isContentBlocks/has-image checks, let before = payload.slice(0, open) and after = payload.slice(close + 1). If before is non-empty: if parsed[0].type === 'text', set its text to before + text; otherwise unshift {type:'text', text: before}. If after is non-empty: if the last block is text, set its text to text + after; otherwise push {type:'text', text: after}. Return the new array. An unframed payload (empty before and after) still returns exactly its blocks, and a refusal or non-picture still returns null. No test, AC or story changes are needed; both AC2067 UATs already assert this behaviour.

## Ruling: granted

the planner granted an override in its plan
