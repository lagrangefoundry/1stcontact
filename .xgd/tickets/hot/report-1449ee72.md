---
uid: report-1449ee72
id: REPORT-6917
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-10-30T20:53:24.300796+00:00'
updated_at: '2026-10-30T20:53:24.300796+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: report-00553335
  parent_report_uid: report-234be966
  batch_index: '0'
---

Both tests fail for the same reason: `contentBlocksFrom` (`tools/generate/src/cli/ai/fidelity-core.ts:142-155`) cuts out only the JSON array between the first `[` and the last `]`. The text on either side — the frame's opening `<<<untrusted>>>\n` and closing `\n<<</untrusted>>>` — is thrown away, so a screenshot reaches the model unframed: 2 blocks instead of 3, and no opening marker on the first text block.

The tests and AC-2067 are not what's wrong. The reconciliation review (report-b5be9c7c, F1) and the override audit (report-e1298f76) both rejected the earlier version of these tests, which asserted the frame was *absent*. They ruled that this is a trust-boundary gap REQ-157 requires closed ("a captured page's text must never be able to read as an instruction"). AC-2067 was rewritten to require the frame. COMMENT-5849 on BUG-316 says the production fix needs a new `code_frozen` grant scoped to `fidelity-core.ts`. This prompt contains no Authorised exception block, so I can't make that edit. Going back to tests that assert the frame is missing would just repeat the fix the review threw out, and would weaken a security assertion. So I've changed nothing.

```yaml
## Assessment
blocked_by:
  rule: code_frozen
  evidence: "Ran `npx vitest run tests/reconciliation-assistant-looking-surface.test.ts -t AC2067`: both UATs fail. The 'on the wire' test gets 2 blocks where it expects >=3; the 'directly' test gets [text without '<<<untrusted>>>\\n' prefix, image] where it expects [framed text, image, '\\n<<</untrusted>>>' text]. The cause is fidelity-core.ts:142-155. contentBlocksFrom does JSON.parse(payload.slice(open, close+1)) and returns `parsed`, discarding payload.slice(0, open) and payload.slice(close+1), which hold the untrusted frame. AC-2067 (acceptance_criterion-827e8986) was deliberately rewritten to require the frame, per review report-b5be9c7c F1 and override audit report-e1298f76 item 5. COMMENT-5849 on BUG-316 states the fix needs a new rung-1 code_frozen grant on that one file. No Authorised exception block is present in this prompt, and reverting the tests to assert the frame's absence has already been rejected by review."
  proposed_change: "tools/generate/src/cli/ai/fidelity-core.ts, contentBlocksFrom only: after the isContentBlocks/has-image checks, let before = payload.slice(0, open) and after = payload.slice(close + 1). If before is non-empty: if parsed[0].type === 'text', set its text to before + text; otherwise unshift {type:'text', text: before}. If after is non-empty: if the last block is text, set its text to text + after; otherwise push {type:'text', text: after}. Return the new array. An unframed payload (empty before and after) still returns exactly its blocks, and a refusal or non-picture still returns null. No test, AC or story changes are needed; both AC2067 UATs already assert this behaviour."
```
