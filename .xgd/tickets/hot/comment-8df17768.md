---
uid: comment-8df17768
id: COMMENT-5777
type: comment
title: Claude response for fix_plan report
created_by: xgd
created_at: '2026-10-27T20:05:55.180001+00:00'
updated_at: '2026-10-27T20:05:55.180001+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-3e92e116
  kind: note
---

I created the iteration 2 fix plan for story-58b2cec4 as report-3e92e116 (REPORT-6788). It splits the five failures into two batches, each with its own ruling on the builder's `code_frozen` block. I left the tickets and tests alone; the edits are for the builder to make.

The ticket is saved locally, but a push to github.com was blocked by the sandbox.

**Batch 0: AC2031, AC2034, AC2025 — `code_frozen` override.** The `xgd-working` tip already does what these tests expect, because a later intent (REQ-206) fixed the same bug. The builder ports that behaviour and doesn't change any tests:
- **Image reaches the model:** the tip adds `contentBlocksFrom` in `fidelity-core.ts` (lines 136–198) and applies it in `host-core.ts` (`runTool`, lines 2995–3006). It turns the Toolbox's text output back into the image block. Once the result is an array again, the existing `withoutImageData` strips the image bytes from the operator stream, which should fix AC2034 too.
- **Worker offers the looking surface:** at the tip, `router.ts` (lines 614–630) builds the looking-surface dependencies and passes them to `workerHost` in `ai.ts` (lines 518–524 and 846–848).
- **Dependency tests:** this story's other ACs, plus the tests that already exercise `host-core.ts` and the Worker host: REQ-146, REQ-157, REQ-123, REQ-174, BUG-38, and AC1057, AC1404–1411, AC1651–1653.
- **Trust boundary:** I marked the override as touching the trust boundary, because `contentBlocksFrom` drops the untrusted-content framing around an image result. The tip does the same.

**Batch 1: AC2028, AC2033 — aligned to the tip, no production edits.** The tip doesn't have the other two changes the builder proposed:
- The picture errors carry no code. In `picture.ts` (lines 197–211) they are plain `Error` classes, and nothing at the tip maps them to `PICTURE_INVALID` or `NOT_FOUND`.
- Nothing checks that a revision exists before it is pictured (`picture.ts`, lines 574–580).
- REQ-157 doesn't demand either one. It only says these pictures are refused and that the message names the kind and the missing field.

So AC-2028 and AC-2033 are rewritten in place. They drop the code tokens and the unknown-revision clause, and keep the message wording, the byte counts, the "narrower viewport or compare" advice, and the no-image-bytes checks. The two tests are updated to match.

**Risks for review:**
- I didn't run the tests at the tip. The claim that the tip's refusals carry no code rests on finding no mapping anywhere in the tip's source.
- The prompt rejects a plan that "rules more than one way". These are two rulings on one blocked request, covering different tests, so the validator may refuse it. If it does, the plan comes back once for a retry.

The report also flags two passing tests whose evidence is weak.
