---
uid: comment-b38e186a
id: COMMENT-5996
type: comment
title: Claude response for fix_plan report
created_by: xgd
created_at: '2026-11-01T03:31:38.069286+00:00'
updated_at: '2026-11-01T03:31:38.069286+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-fddeb967
  kind: note
---

I filed the iteration-2 fix plan for STORY-141 as **REPORT-7247 (report-fddeb967)**. It has one batch and grants one `code_frozen` override.

**Three of the four failures are already fixed.** The AC1688, AC1689 and AC1699 failures came from old copies of those tests, written before REQ-173, in `tests/reconciliation-material-description.workers.test.ts`. The iteration-1 builder deleted them, and the working tree confirms they're gone. The newer versions in the `-digest` test file pass. The quality report was run on a commit from before that edit, so it still lists them.

**AC2097 is a real bug in production code, so I granted the override the builder asked for.**
- **Cause:** I confirmed the builder's diagnosis. `sessionTextDescriber` (`apps/control-app/src/ai.ts:159-165`) passes the digest instruction to `lib.Role` under `system:` and `source:`, and the Role constructor ignores both. The model is never sent the instruction.
- **Reference state:** at `reconcile-src-BUNDLE-34`, `ai.ts:297-304` already passes it as the single entry `priming: [new lib.Entry({ name: 'digest-system', text: system })]` (the BUG-63 fix). That decides it at rung 2: the test is right and the code is wrong.
- **Override:** `code_frozen`, limited to `apps/control-app/src/ai.ts`. `trust_boundary` is false. The dependency tests are AC1688–AC1699 and the `test_UAT_FC_REQ_173_` suite, the other tests that go through `sessionTextDescriber`.
- **Builder instructions:** swap in the single `priming` entry and fix the outdated "no priming" comment at `ai.ts:123`. Don't port the later describer consolidation from REQ-207, and leave the AC2097 test alone.

**Flags on passing tests (they don't block the batch):**
- `test_UAT_FC_REQ_173_the_describer_is_primed_with_the_digest_prompt_and_nothing_else` checks the instruction with `toContain`, which doesn't prove "nothing else". It should compare for equality, as AC2097 does.
- The older test file still covers AC1690–AC1698, which the digest-era file also covers under the same AC numbers.

The report is saved, but a sandbox rule blocked an outbound connection to `github.com:22`. If that was a sync or push of the ticket store after the report was written, the new report hasn't reached the remote yet.
