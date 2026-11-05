---
uid: comment-073110e5
id: COMMENT-3956
type: comment
title: Comment on request REQ-330
created_by: xgd
created_at: '2026-09-26T18:59:54.199450+00:00'
updated_at: '2026-09-26T19:53:19.956139+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-c217d41a
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "77557323-855b-4d08-b329-4514b1b730ac",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="ccfa099b-a920-4879-96f2-0f3da6eb8eaa-user" -->

<!-- xgd-chat role="user" ts="2026-09-26T18:59:05.445031+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="ccfa099b-a920-4879-96f2-0f3da6eb8eaa-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-26T19:32:08.282671+00:00" -->
#### Claude
I'll start by reading the ticket to understand what's being asked.

I have the full picture. Let me record the design on the ticket before coding.

Ticket is scoped. Cutting the branch now.

Now the validator rule for set-chrome agreement.

Now the invariant rules.

Now I'll rewrite `zoomHtml` and add the set machinery.

Now let me finalise the block with the auto-name refinement and splice it in.

Now the autoname attribute, the `ZoomGroup` type, state field, and the zoom script.

Now wire the flush and the script into document/fragment assembly.

Now the UAT suite.

⚠️ Chat generation failed: Claude Code CLI streaming timeout (>1800s)

<!-- xgd-turn id="c2308b34-1db9-4f1a-ab68-52e47b0258af-user" -->

<!-- xgd-chat role="user" ts="2026-09-26T19:46:01.830870+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-turn id="c2308b34-1db9-4f1a-ab68-52e47b0258af-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-26T19:53:19.330836+00:00" -->
#### Claude
I'll start by reading the ticket and checking the current state of the work from the prior session.

The branch from the prior session exists. Let me check its state.

Ticket body is fully populated. Let me review the uncommitted implementation work.

Implementation looks substantially complete. Let me check the test file and run it.

Comprehensive suite covering every test-plan bullet. Running it now (foreground).

All 22 pass. Now the adjacent regression scope — the L1 render/validate surfaces this touched.

Clean. Let me widen to the full L1 surface plus typecheck.

All green. Now a typecheck across the two touched packages.

Both typecheck clean. Let me check the two tests whose behaviour I want to confirm is described in the ticket body.

Two behaviours in the tests aren't yet named in the body — the caption head-room and the accessible-name re-derivation, plus the fragment case. Adding that language now.

The section landed as a subsection of Test plan. Let me reorder it to sit before the test plan.

Body updated. Now the version bump and commit.

Now committing — explicit paths only, no `-A` (avoids sweeping untracked caches).

Committed. Now the merge-back under the shared lock.

Lock is held by a concurrent REQ-328 session. Retrying with a bounded wait.

Lock acquired. Merging working into the branch first so the merge back can fast-forward.

REQ-328 landed changes to the same files. Re-running the suites against the merged state.

All pass post-merge. Quick typecheck, then fast-forward.

Fast-forwarded cleanly. Now the gate command — letting it own the version bump to avoid the tip race.

REQ-330 is free-coded and landed on `xgd-working`.

## What was built

The prior session had the implementation substantially written but uncommitted. I reviewed it, verified it, added the missing ticket language, and completed the merge-back.

The ticket's "small version" already existed (REQ-327's `zoom` role). This built the remainder: **the gallery, dismissal by scroll, and an authorable chrome colour**.

No gallery *component* — a set is the overlay that already exists holding more than one picture, so it's expressed on the picture. `l1ZoomSchema` gains five optional fields: `group` (a name; pictures naming it form one set in document order), `caption` (what the *large* picture says, travelling with its own member), `ink`, and `prevLabel`/`nextLabel`.

Three design points worth naming:

- **One shell per set, flushed at document end.** A set's members are scattered through the tree, so its overlay can't be written at any one of them — it's a document-level artifact like the stylesheet and script.
- **The validator refuses a disagreeing set.** The five chrome fields describe the shared overlay, so two members naming one differently is a document saying two things about one shell. Refused, not silently resolved to the first.
- **The wheel dismissal clicks the panel** rather than re-deriving REQ-212's four-part close contract (marker, `aria-expanded`, scroll lock, focus return). Touch is deliberately excluded — a drag is how a visitor pans the plate they just opened.

## Verification

- **22 new UATs pass** in `tests/test_UAT_FC_REQ-330_image_gallery.test.ts` — vocabulary, envelope refusal, emission, jsdom-driven stepping/wrapping/dismissal/focus, script reuse, unenhanced page, edit channel.
- **103 tests pass** across the adjacent scope after merging `xgd-working` in (REQ-328 had landed changes to the same two files) — REQ-327, REQ-212, REQ-328, the authoring envelope, and the edit-render channel.
- **Both packages typecheck clean**, before and after that merge.

## Ticket

I added a section — *"Three things that follow from the set"* — covering behaviour the tests prove that the body hadn't yet named: the caption head-room, the accessible-name re-derivation as the visitor steps, and the fragment case. Without that language, reconciliation would have had to discover those as unattributed behaviour.

Status `free_coded`, version `0.2.375`, commits `8d97f66a` (the work) and `66fe03b0` (the gate's own version bump), 5 story points. Branch merged by fast-forward and cleaned up; the lock is released.

Promotion to `ready_to_reconcile` is yours to make when you're happy with it.

<!-- xgd-chat-end -->