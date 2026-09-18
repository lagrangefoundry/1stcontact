---
uid: comment-8db729d9
id: COMMENT-3149
type: comment
title: Comment on request REQ-277
created_by: xgd
created_at: '2026-09-18T23:42:32.478382+00:00'
updated_at: '2026-09-18T23:58:07.724038+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-9a60c063
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "37ed5572-06e8-4577-acbc-3cc3585db3b8",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="5261a2d2-f26a-47c9-92cc-e1e86545051d-user" -->

<!-- xgd-chat role="user" ts="2026-09-18T23:41:43.421933+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="5261a2d2-f26a-47c9-92cc-e1e86545051d-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-18T23:58:07.665116+00:00" -->
#### Claude
Now writing the unmeasured module.

Now rewriting the reading/view to use the common basis.

Now the prompt block in `buildPrompt`:

Now the rendering and style:

Now wiring in `console.ts` — the previous iteration and the seam:

Only one fixture to update:

Implemented on REQ-277, merged to `xgd-working`, ticket at `free_coded`.

## What landed

**`tools/repro-console/src/unmeasured.ts`** — the console's one definition of the unmeasured set, computed from `gate.json` fields that already existed (nothing about what the gate measures changed):

| part | source | meaning |
|---|---|---|
| axes | `values.unmeasuredAxes` | compared axis only one side of the projection can read (REQ-274) |
| bands | `unpairedSections` + `unpairedActualSections` | section with no counterpart (BUG-111) |
| populations | `unmatched` + `unpairedActual` | element that paired with nothing (BUG-106) |
| probes | `sectionsNotComparable` | a measurement the run declared it could not make (BUG-102) |

**On the page** each iteration now leads with `unmeasured N` + breakdown, directly under the `Iteration N` heading and above the links; the delta count sits beneath it with its own movement, and a plain-English sentence says what the pair means — e.g. *"The instrument sharpened: 2 fewer measurement(s) were skipped this iteration, and the delta count rose because the gate is now comparing what it used to pass over in silence. This is progress, not a regression."*

Two honesty rules I decided on and wrote into the ticket body:
- a part the report doesn't carry reads as `unmeasured ≥ N` with the missing parts named — silence is never counted as zero (old gate reports predate REQ-274);
- iteration-to-iteration movement is differenced only over the parts **both** reports carry, and the page states the basis when it isn't the whole set. Differencing a part one side is silent about would report the *arrival* of a quantity as movement in the thing it measures.

**The seam** (behaviour 4) is read from `recaptured` or a changed `bundleCapturedAt`; at a seam only the *delta* line is marked not comparable — the unmeasured movement still crosses it, since a re-capture is the main way that number falls.

**Same definition leads the digest and the round's prompt**, and the brief gains §3 *"The score is the unmeasured set, not the delta count"*, which tells a round that a gap whose fix raises the delta count is still worth filing.

## Evidence

`tests/test_UAT_FC_REQ-277_unmeasured_is_the_headline.test.ts` — 5 UATs against the real console over HTTP (`1c`/`claude`/`git`/`xgd` substituted at the existing seams). All pass, as do all 16 other repro-console suites; REQ-256's hand-built `GateSummary` fixture gained the new field (only change to an existing test).

Two suites initially failed on a missing `apps/control-app/src/generated` in the fresh worktree — the known worktree artifact, not this change; copying it in made them pass.

Commits `a7d57961e6` + `cfa0119e26` (the second is a re-bump — 0.2.274 was claimed by BUG-120 mid-merge), version `0.2.275`, story points 4. Promotion to `ready_to_reconcile` is yours.

<!-- xgd-chat-end -->