---
uid: comment-8f2789ce
id: COMMENT-5476
type: comment
title: Comment on request REQ-405
created_by: xgd
created_at: '2026-10-18T00:48:23.049911+00:00'
updated_at: '2026-10-18T12:19:19.286320+00:00'
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

<!-- xgd-turn id="92c5a653-726b-42c5-bfec-6d0681044cc4-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-18T12:17:08.407427+00:00" -->
#### Claude
Yes, agreed. I was treating this as one missing check when it's really a missing idea: the consultant has no picture of what "done" means for each stage.

**What exists today.** Each stage in `plan-seed.json` has a label and a one-sentence `about`, but that sentence is written for the client and shown on the progress banner. The consultant's priming (the `plan-panel` paragraph in `priming.json`) only says to start a stage with `set_stage` and "tick it done when the client agrees it is". Nothing tells her what "done" should contain, so she waits for Bob to ask. Bob can't ask for something he doesn't know exists; he just feels the site is flat.

**Proposed fix: prompt text only.** Add a short paragraph to the consultant priming, after `plan-panel`, giving her the definition of done for each stage and her job of steering the client there:

> Each stage has a finish line, and getting the client to it is your job. They can't ask for what they don't know exists.
> - **Getting to know you**: you can say in two sentences what the business does, who it's for, what the site must do and what "good" means to them, and they agree.
> - **Looking at other sites**: they've reacted to real sites in their trade, likes and dislikes, and you can name the direction they chose.
> - **First draft**: a real first version is in the preview and they've looked at it.
> - **Refining**: they're happy with the pages, the words and the pictures, and nothing still "feels off".
> - **Colours & fonts**: they chose the colours and lettering from options they saw; nothing is left as a default.
> - **Finishing touches**: this is where the site goes from correct to finished, and where we stand out. Bring up what a novice won't think to ask for: motion first (gentle fade-ins as they scroll, a slight lift on buttons; the top banner stays still, nothing slides or spins), then anything else that would lift this particular site, if it suits it. They should see each one and say yes or no. To see motion, tell them to use **"Open in new tab"** beside the preview. **"View on your phone"** shows the scroll fade-ins but not the hover effects. Then check every page, link and form, plus the favicon and share card.
> - **Ready to publish**: they say go.

**What this means for the earlier findings:**
- The `revision_once` trigger is still dead data, so `motion_offer` never falls due. With this guidance in place it doesn't matter much. I'd leave it alone, or delete that one seed line if you'd rather not keep a check that can't fire.
- No code changes and no UAT, because this is prompt text. One edit to `priming.json`, made in both the `priming` and `priming_without_corpus` variants, which duplicate the stage text.
- The stage list and the "done" lines are side by side in `plan-seed.json`, but the "done" text lives in `priming.json`. A comment in each file would say they change together.

Two questions before I touch anything:
1. Is the wording roughly right, especially Finishing touches? Do you want her more or less adventurous on "anything else that would lift this particular site"?
2. Should I update the REQ-405 ticket body to this "each stage has a finish line" scope? Its title is narrower (motion and "Open in a tab"); I'd keep the title unless you want it changed.

<!-- xgd-turn id="e07a4994-396a-4586-bf30-289c672e85ed-user" -->

<!-- xgd-chat role="user" ts="2026-10-18T12:19:18.908637+00:00" -->
#### You
Sure that's a good start, please go ahead.

<!-- xgd-chat-end -->