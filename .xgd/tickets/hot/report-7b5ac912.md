---
uid: report-7b5ac912
id: REPORT-7202
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-01T02:02:03.963811+00:00'
updated_at: '2026-11-01T02:02:03.963811+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: STORY-159
  parent_report_uid: report-1b0fd3cd
  batch_index: '0'
---

I didn't fix `test_UAT_AC2080_deployed_capture_site_writes_one_reference_ticket_with_a_record_per_member`, and I made no edits. The test is correct and the bug is in production code, which is frozen in this mode.

- **The failure:** I re-ran it and it still fails at line 415: `reference.adopted` is `false`, with the reason "this deployment keeps no corpus, so the bundle was stored but not indexed". The capture itself works: the bundle `fixture.test/deployed` is stored.
- **The cause:** `sessionFidelity` in `apps/control-app/src/router.ts:169-192` calls `fidelityDeps(...)` without the `adoptCapture` argument. `fidelityDeps` already accepts one (`apps/control-app/src/shot.ts:165-188`). Without it, `fidelity-core.ts:352` takes the "no corpus" branch, so the deployed Worker never writes a reference ticket.
- **The AC agrees:** AC-2080 says it is "expected to FAIL against current code… (STORY-159 Known gap 8)". So the AC and the story both describe the intended behaviour, and the code has the gap.
- **Why I didn't change the test or AC:** rewriting either to expect `adopted: false` would record a known bug as the spec. That's not a valid fix under this mode's rules.

The fix needs `code_frozen` lifted for `router.ts`, or a separate develop or free-coding pass on Known gap 8.

```yaml
## Assessment
blocked_by:
  rule: code_frozen
  evidence: "Ran `npx vitest run tests/test_reconciliation_capture_site_reference_material.workers.test.ts -t test_UAT_AC2080` → AssertionError at line 415: 'this deployment keeps no corpus, so the bundle was stored but not indexed: expected false to be true'. Read apps/control-app/src/router.ts:169-192: sessionFidelity calls fidelityDeps(env, previewRenderer(store), references, origin, site, launchOpts) without the optional adoptCapture argument that shot.ts:165-188 accepts, so fidelity-core.ts:352 takes the 'no corpus' branch. AC-2080 body states 'expected to FAIL against current code. The Worker router does not supply the adoption dependency (STORY-159 Known gap 8)' — the AC and the story describe the intended behaviour; only production code is wrong."
  proposed_change: "apps/control-app/src/router.ts: give sessionFidelity the request's ticket store (the `tickets` already built in the chat-host closure next to line 150) and pass a seventh argument to fidelityDeps: `async (bundle) => { const a = await adoptCapture(tickets, references.bundle(bundle)); return { uid: a.ticket.uid, created: a.created } }`, importing adoptCapture from './capture-material'. Leave the test and AC-2080 unchanged; once this lands, remove the 'expected to FAIL' note from AC-2080 and close Known gap 8 on STORY-159."
```
