---
uid: comment-be559238
id: COMMENT-5851
type: comment
title: Claude response for fix_plan report
created_by: xgd
created_at: '2026-10-30T20:56:47.992405+00:00'
updated_at: '2026-10-30T20:56:47.992405+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-32f5ff75
  kind: note
---

I filed the iteration-3 fix plan as **REPORT-6919 (report-32f5ff75)**. The ticket was written to the local store, but a network call to `github.com:22` was blocked by the sandbox, so it probably hasn't been pushed to the remote.

**Diagnosis:** the two failing AC-2067 tests are right, and the production code is wrong. `contentBlocksFrom` (`tools/generate/src/cli/ai/fidelity-core.ts:142`) turns a rendered tool result back into content blocks. It keeps only the JSON array and throws away the `<<<untrusted>>>` … `<<</untrusted>>>` markers around it. So a screenshot reaches the model without the marking that says it is third-party content. The orphaned AC-2067 entry is the same failure, and it clears once those two tests pass.

**Why iteration 2 didn't work:** that plan re-sent the same tests with empty instructions. The builder (report-1449ee72) then reported it was blocked by the `code_frozen` rule, which stops it editing production code in this mode. Sending the same plan again would get the same result, so this plan rules on the block.

**Ruling: a `code_frozen` override, decided at rung 1 of the ladder.**
- REQ-157 is in scope and says "a captured page's text must never be able to read as an instruction"; `screenshot` is also declared `provenance: untrusted`.
- AC-2067 was rewritten to require the markers. That rewrite followed review report-b5be9c7c F1 and audit report-e1298f76, both of which rejected an earlier version of the tests that asserted the markers were absent.
- The reference state disagrees: at `reconcile-src-BUNDLE-32`, lines 185-198 drop the markers and a comment calls that accepted. Rung 1 outranks the reference state.
- The override covers `fidelity-core.ts` only and is flagged `trust_boundary: true`.

**The single batch:**
- **Builder brief:** keep the text before and after the JSON array on the recovered blocks. Leading text joins the first block if that block is text, otherwise it becomes a block of its own; trailing text is handled the same way at the end. A result without markers must come back unchanged, a refusal must still return null, and the search must stay bracket-based. The function's doc comment, which says the markers are given up, needs updating too.
- **Also required to pass:** the AC2022–AC2035 tests. They cover the same screenshot path through `host-core.ts:525`, which is the only caller of `contentBlocksFrom`.
