---
uid: comment-d296ef9d
id: COMMENT-309
type: comment
title: Comment on bug BUG-6
created_by: xgd
created_at: '2026-07-23T05:22:50.701347+00:00'
updated_at: '2026-07-23T05:24:49.269486+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-b9eb2e3a
  kind: chat_transcript
---

<!-- xgd-turn id="7f1e6dc4-c25f-43e0-8141-648bd65d3774-user" -->

<!-- xgd-chat role="user" ts="2026-07-23T05:22:48.340212+00:00" -->
#### You
Please free code this ticket

<!-- xgd-turn id="7f1e6dc4-c25f-43e0-8141-648bd65d3774-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-23T05:24:49.238728+00:00" -->
#### Claude
I'll start by reviewing the ticket and the relevant code before making changes.

The fold.ts already contains residual-emission code referencing "REQ-92 / BUG-6". Let me check the git history to understand what's already been done and whether it's committed under this ticket.

The BUG-6 work is already implemented and committed in `9e92a339`, but that commit is bundled with REQ-92 (textShadow). Let me check whether that commit is already claimed by REQ-92's ticket.

The BUG-6 work is already implemented and committed — but the commit `9e92a339` is **already claimed by REQ-92** (which is at `free_coded`). Let me check the test coverage to see how the residual behavior is tested and whether it's attributed to BUG-6 or REQ-92.

I now have the full picture. Let me confirm the residual tests actually pass, so my report is grounded.

I've investigated before touching anything, and this ticket is in an unusual state that I should surface rather than blindly "free-code."

## What I found

**BUG-6's work is already implemented, tested, committed — and the commit is claimed by REQ-92.**

- The signal-not-drop behavior is live in `tools/generate/src/l1/fold.ts`: the `FoldResidual` interface, `residualKindOf`/`capturedAxesOf`, and the `signal(...)` calls that replace the old silent `continue` for text-free elements, geometry-less runs, and empty text. This is exactly BUG-6's fix direction.
- It landed in commit **`9e92a339`** — `"feat(l1): fold textShadow + signal fold residuals instead of silent drop [FREE-CODED]"` — which **bundled REQ-92's textShadow work with BUG-6 (B2)**. The commit message explicitly says *"BUG-6 (B2) signal-not-drop … each becomes a typed FoldResidual."*
- That SHA is **already recorded on REQ-92's `fields.commits`**, and REQ-92 is at `free_coded`.
- Tests exist and **all 7 pass** (`tests/req92-fold-full-language.test.ts`), including the four residual tests — but they're named `test_UAT_FC_REQ-92_*` (e.g. `_textless_elements_signalled_not_dropped`, `_geometryless_text_run_signalled`, `_drop_stays_silent_without_the_collector`, `_covered_pixel_mover_not_a_residual`).

This matches REQ-92's own design note: *"[[bug-b9eb2e3a]] (B2) — signal-not-drop, **baked into this rebuild**."* BUG-6 was intentionally absorbed into REQ-92's folder rebuild.

## Why I'm not free-coding it

There is no new code to write — the behavior, tests, and commit all exist. And I **cannot** attach `9e92a339` to BUG-6: the `move-to-free-coded` gate enforces one-SHA-one-ticket, so it would reject a SHA already owned by REQ-92. Duplicating the code into a fresh commit would just re-add what's already in the tree.

## How I'd suggest resolving it (your call — these are status decisions I don't own)

1. **Mark BUG-6 as subsumed by REQ-92** (e.g. `deprecated`/`wont_fix` with a comment pointing at REQ-92 + `9e92a339`). Cleanest — reflects reality: B2 was baked into REQ-92 by design. When REQ-92 reconciles, the residual behavior gets matrix coverage there.
2. **Leave BUG-6 at `draft`** as a tracking placeholder until REQ-92 reconciles, then close it.

I'd recommend **option 1**. Which would you like — and do you want me to add the cross-reference comment to BUG-6?

<!-- xgd-chat-end -->