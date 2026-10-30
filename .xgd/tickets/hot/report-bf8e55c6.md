---
uid: report-bf8e55c6
id: REPORT-6921
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-10-30T21:01:06.864909+00:00'
updated_at: '2026-10-30T21:01:06.864909+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: report-00553335
  parent_report_uid: report-32f5ff75
  batch_index: '0'
---

Both AC2067 tests now pass. Screenshots recovered from the tool output keep their untrusted-content markers on the way to the model, which is what REQ-157 asks for.

**The fix:** before this change, `contentBlocksFrom` in `tools/generate/src/cli/ai/fidelity-core.ts` pulled the content blocks out of the Toolbox's text output and threw away the text around them. That surrounding text is the untrusted-content frame. Now it carries that text onto the recovered blocks, as the planner specified:
- **Leading text** goes onto the front of the first block if that block is text. Otherwise it becomes its own text block at the start.
- **Trailing text** goes onto the end of the last block if that block is text. Otherwise it becomes its own text block at the end.
- **Unchanged:** output with no frame comes back exactly as before, and a refusal still returns `null`. It still finds the content by its square brackets, not by how the markers are spelled.

I updated the function's doc comment, which used to say the frame was dropped. `host-core.ts` needed no change.

**Scope:** the only code file edited is `fidelity-core.ts`, the one file the exception allowed. No tests, acceptance criteria or stories were changed. AC-2067 was listed as orphaned only because its tests were failing, so it needed no ticket edit. The other uncommitted changes are the ticket store's own change log under `.xgd/_changes/`.

**Test results:**
- `tests/reconciliation-assistant-looking-surface.test.ts` (the AC2022–AC2035 and AC2067 scope): 15/15 pass.
- The other suites that exercise screenshots: `test_UAT_FC_REQ-157_fidelity_surface`, `test_reconciliation_capture_site_egress` and `reconciliation-assistant-conversation` pass 50/50, and `reconciliation-assistant-looking-surface-worker.workers` passes 2/2.
- The type check (`tsc --noEmit`) on `tools/generate` is clean.

```yaml
## Assessment
status: fixed
files_changed:
  - tools/generate/src/cli/ai/fidelity-core.ts   # under the authorised code_frozen exception
tests:
  - test_UAT_AC2067_a_screenshot_reaches_the_model_inside_the_untrusted_frame: pass
  - test_UAT_AC2067_content_blocks_recovered_from_a_framed_rendering_keep_the_frame: pass
ac_changes: none
story_changes: none
```
