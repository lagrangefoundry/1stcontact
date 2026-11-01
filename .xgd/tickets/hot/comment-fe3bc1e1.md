---
uid: comment-fe3bc1e1
id: COMMENT-5992
type: comment
title: Comment on request REQ-622
created_by: xgd
created_at: '2026-11-01T00:26:29.114525+00:00'
updated_at: '2026-11-01T00:55:57.715392+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-47cb87c6
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "4f35bab1-9b59-4e34-8c09-fe9dd728a20c",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="97c8a083-f6f2-4c05-831b-74b7cf40ba4b-user" -->

<!-- xgd-chat role="user" ts="2026-11-01T00:25:01.636369+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="97c8a083-f6f2-4c05-831b-74b7cf40ba4b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-01T00:55:56.471524+00:00" -->
#### Claude
Reading the ticket and the existing layout-check code to plan the four parts of REQ-622.

Still surveying: the focal point model (REQ-448) and how the video's `objectPosition` relates to it, before deciding scope.

Finding where a builder's `set_l1` write is checked, so the "focal point first" refusal can sit there.

Checking how a button is recognised once the design is resolved, so the renderer can spot a row of buttons.

Starting the free-coding flow: marking the ticket `free_coding` and cutting the branch.

Branch cut. Checking that the Chromium-backed layout suites run in this worktree before I write anything.

Chromium runs in the worktree. Before writing the in-page checks, checking what a builder can set to widen a button (so the finding's fix line is actionable).

Writing the two in-page checks (`covered_subject`, `ragged_buttons`) into the registry, after the `crop` check.

Fixing a shadowed variable in that check before going on.

Now the focal-point map: extending it to clips (keyed by both the clip's file and its poster's).

The renderer's video pause control is a `<button>` laid over the clip; excluding those framework-invariant controls from both checks.

Adding the header paragraph to `layout-check.ts`, then moving to the renderer.

Now the renderer: a wrapping row made only of buttons gets `width: fit-content` and its buttons `flex-grow: 1`, so on one line they keep their own widths and once wrapped each spans the row.

Renderer done. Now the write-side refusal. Checking how an AI write is told apart and what the library hands back, so the check can read material focal points.

I'll factor the library's focal points into one host helper used by both the layout checker and the AI write options. Looking at the error codes to add a dedicated refusal.

Adding a dedicated `NO_FOCAL_POINT` code (exit 9), declared on the same surface operations that already declare `NOT_APPROVED`, since both refusals sit in the same write check.

Fixing the indentation my regex got wrong.

Now the code: the error code, the host capability, and the check in `edit.ts`.

Now wiring the library's focal points into the AI's write options in `host-core.ts`, shared with the layout checker.

Typecheck of `tools/generate` is clean. Checking the framework package too.

Both packages typecheck. Now the builder priming line — finding where the builder is told about compositions and buttons.

Adding the priming lines to both builder priming copies (with and without corpus), spliced textually.

Code is in. Now the UATs — reading the REQ-448 builder-surface test to drive a real `set_l1` the way the builder does.

Writing the UATs. Checking the renderer's entry point for a bare L1 document first.

Writing the UAT file.

Running the new UATs.

All five pass on the first run, so I'm checking the renderer test isn't vacuous: running it against the old renderer.

Eight failures; baselining those same files on the unmodified `xgd-working` checkout before reading them as mine.

Seven are pre-existing; BUG-293's check test is new. Reading it.

My renderer change trips BUG-293's `button_size` check on Dina's page. Looking at which button and at what width.

BUG-293 and REQ-622 both green. Running the second half of the regression scope.

All seven second-half failures are pre-existing. Making sure none of them now also carries one of my new finding kinds.

No new kinds in any failure. Now the workers-side scope: the priming budget, and suites that exercise the host's library focal points.

Workers scope green (35/35). One more slice: renderer suites that render a wrapping row, in case any pins its CSS byte for byte.

Everything in scope is green apart from pre-existing failures. Before committing, updating the ticket body so every UAT traces to its language — re-reading it first in case it changed.

Body unchanged since I read it. Writing the updated body: the original Why/Root cause/What kept, plus what landed, the design decisions, and the final test plan.

Ticket body is stored in full. Committing the code on the branch.

Now the merge-back: lock, merge `xgd-working` into the branch, bump the version at the tip, merge back, then the gate.

Merged cleanly; `host-core.ts` and `priming.json` auto-merged with others' changes. Re-typechecking and re-running my UATs on the merged tree before bumping.

Fast-forwarded onto `xgd-working`. Running the free_coded gate.

REQ-622 is in and parked at `free_coded`. It's merged into `xgd-working` (commits `336448a2` and the version bump `7d305636`, 0.2.724, 8 story points), and the branch is cleaned up. I didn't need to ask you anything first. Part 4, fixing Ariel's hero itself, is not done: it needs a deploy and then the consultant's next look at the page.

**What changed**

1. **Focal point before an overlay.** When the builder lays text, a button or a shaded box over a picture or clip that has no focal point, the write is now refused with a new code, `NO_FOCAL_POINT`. The refusal names the picture and says "give it a focal point first", and nothing is written.
   - "Laid over" means: the picture in an `overlay` composition, a picture next to something marked `stacked`, or a box's own background picture.
   - The focal point is the node's `objectPosition`, or the one its library material carries. For a clip, its poster's material counts too.
   - Only overlays a write adds are refused, like the other write rules. Edits by the client or from the CLI aren't checked.
2. **New `covered_subject` check.** At each width, it finds text, a button or a shaded box drawn over a picture's subject. A scrim across the whole picture doesn't count. The suggested fix is to move the text, re-frame the picture or change the layout, and never to remove the shading.
3. **Stacked buttons line up on both edges.**
   - The renderer now draws a wrapping row of buttons so that on one line each keeps its own width, and once it wraps each button spans the full row.
   - A new `ragged_buttons` check reports stacked buttons whose left and right edges don't both line up.
   - The builder's priming has the new lines for both rules.

**Decisions you should know about**
- **Wrapped buttons take the column's width, not the widest button's width.** CSS alone can't size buttons to the widest one without knowing where the row wraps. The ticket allowed either.
- **I changed BUG-293's `button_size` check.** Without that, the wrapped "Get directions" button on Dina's site would be reported as stretched. Buttons stacked edge to edge are now measured against the widest label among them.
- **Ariel's hero video already has a focal point.** Its `objectPosition` of 60%/35% counts as one, so the new check can judge it as it stands, with nothing new to write first.

**Tests**
- The five new UATs pass, in `tests/test_UAT_FC_REQ-622_overlays_keep_off_the_subject.test.ts`. The renderer one fails on the old code (right edges 67px apart), so it isn't passing vacuously.
- Typecheck is clean.
- Wider regression run, including the workers suites for the priming budget and the library: all green except 14 failures, and each of those fails the same way on clean `xgd-working`. I checked that none of them involve the new finding kinds.

The ticket body now records what landed, the design decisions and the final test plan. Promoting it to `ready_to_reconcile` is your call.

<!-- xgd-chat-end -->