---
uid: comment-8f2789ce
id: COMMENT-5476
type: comment
title: Comment on request REQ-405
created_by: xgd
created_at: '2026-10-18T00:48:23.049911+00:00'
updated_at: '2026-10-18T12:16:35.188058+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-08503f7a
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "dcc45f8f-a105-40cf-afef-a96eb4d929be",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="610c8754-9452-4033-b156-5a7925503d5f-user" -->

<!-- xgd-chat role="user" ts="2026-10-18T00:46:41.855333+00:00" -->
#### You
Please investigate the root cause or the implementation of this ticket. Report your findings here so that we can discuss them. Do not make any code changes until we are aligned.

<!-- xgd-turn id="610c8754-9452-4033-b156-5a7925503d5f-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-18T00:51:32.584155+00:00" -->
#### Claude
Still investigating: I've found that the `motion_offer` check's trigger is never fired by the host. Now checking the playbook docs and the per-turn reminder.

Nearly done. One last check: whether a decision's `settle` mode ever reaches the consultant's prompt.

I've finished the investigation and haven't changed anything. The ticket is right that the guidance is missing, but there are also two mechanical reasons the consultant never offers motion. Nothing in the system ever prompts it to.

## Findings

**1. The `motion_offer` check can never fall due.**
In `tools/generate/src/cli/ai/plan-seed.json:114`, the check's only trigger is `revision_once`. The host fires just three triggers: `first_pass_complete`, `revision_round_finished` and `before_publish` (`plan-core.ts:499-501`, with `builderSessionCompleted` at around line 518). Nothing ever fires `revision_once`; the name appears nowhere except that one line of the seed. So the "Due: ask the client…" line in the per-turn reminder (`planReminder`, `plan-core.ts:1078`) can never appear for motion. The `layout_happy` and `scroll_feel` checks surface because their triggers are real; `motion_offer`'s isn't.

**2. The `settle: offer` setting on the `animation` decision is never shown to the consultant.**
The value is stored on the decision, but no prompt-building code reads it. The reminder lists decisions by title and state only, so the consultant sees something like "Not yet decided: … Animation approach ("none" is a valid answer) …". That reads as permission to skip motion, not as an instruction to raise it.

**3. The design docs already say motion must be offered, but the consultant's prompt doesn't.**
- DOC-64 §3.6 says "Liveness is an offer… A novice will never ask for them, so they must be **offered**" and adds rules against overdoing it: the hero never animates, and anything that moves respects reduced-motion settings.
- DOC-64 §7 says "revision phase, once", and its pre-launch stage lists "the motion offer".
- DOC-33 mentions motion only in passing.
- The consultant's priming (`priming.json`) has no guidance on liveness or animation at all. The only "motion" mentions are about looking at comparison sites. So the gap is in what the consultant is actually primed with, more than in the design docs.

**4. Nothing tells the consultant how the client should view motion.**
None of the priming mentions it. One correction to the ticket: the button is labelled **"Open in new tab"** (`apps/control-app/src/builder/toolbar.js:230`), not "Open in a tab". The guidance should quote it exactly so a novice can find it. "View on your phone" matches.

## Proposed fix

1. **Seed:** give `motion_offer` a trigger that actually fires. `revision_round_finished` would make it fall due after the first revision round, which matches "revision phase" in DOC-64. Or, if you'd rather do what the ticket suggests, add `first_pass_complete`. The check is answered once, so it won't nag. A new "layout approved" trigger would need code; firing it when `layout_happy` gets a yes answer is possible but more work. I'd use the existing triggers.
2. **Priming:** add a short "Motion is yours to offer" paragraph to the consultant priming and the per-turn guidance:
   - When to raise it: once the layout is approved, or at Colours & fonts / Finishing touches.
   - The default recommendation: gentle scroll fade-ins and a slight lift on buttons; no sliding banners, hero never animates.
   - How to show it: "Open in new tab" beside the preview; on a phone, "View on your phone" shows the scroll fade-ins but not the hover effects.
3. **Reminder (optional):** show decisions whose `settle` is `offer` and are still open as "Yours to offer: …", so the instruction that's already in the data reaches the model.
4. **Docs:** update DOC-64 §3.6/§7 to match, with the "Open in new tab" viewing note.

On process: the seed and priming edits (1, 2, 4) are data/prompt/doc-only and need no free-coding cycle. Item 3 is a code change in `plan-core.ts` and would need the full cycle with a UAT under this ticket.

## Decisions for you

- Which trigger for `motion_offer`: `revision_round_finished`, `first_pass_complete`, or both?
- Do you want item 3 (the code change), or should the priming text carry it alone?

<!-- xgd-turn id="92c5a653-726b-42c5-bfec-6d0681044cc4-user" -->

<!-- xgd-chat role="user" ts="2026-10-18T12:16:34.376901+00:00" -->
#### You
I think you are over complicating this, lets take a step back for a second. I think the fix here is a small prompt change.

Each stage in our flow should have corresponding guidance to the consultant so we are aligned on the expectations for that section...right?

The Finishing Touches section is important. It is a place where our process can differentiate itself. This is where the consultant can get creative - if that is appropriate. Motion is kind of "expected" on a modern site so I don't consider that to be particularly differentiating. But the point is Bob doesn't really know all this. He doesn't know to ask for "motion" he just knows that his site looks flat and unfinished. The consultant needs to prompt him for that.

Another way to say this - the consultant needs to have an idea for each stage what DONE looks like, and work with the client to get to DONE. A discussion of motion and other possible "special effects" should be part of getting to DONE for Finishing Touches

<!-- xgd-chat-end -->