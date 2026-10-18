---
uid: comment-8f2789ce
id: COMMENT-5476
type: comment
title: Comment on request REQ-405
created_by: xgd
created_at: '2026-10-18T00:48:23.049911+00:00'
updated_at: '2026-10-18T13:23:19.523779+00:00'
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

<!-- xgd-turn id="e07a4994-396a-4586-bf30-289c672e85ed-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-18T12:20:24.578346+00:00" -->
#### Claude
Prompt-only change, so it goes straight onto xgd-working without a code cycle. Applying the identical text splice to both priming variants:

Text renders cleanly. Now the plan-seed note pairing stages with their finish lines, then the priming-related tests.

Tests pass. Committing just my two files, leaving the other uncommitted changes in the tree alone:

Now recording the outcome on the ticket. I'm appending, so the original body stays as it is:

I've given each build stage a "finish line" in the consultant's instructions, so she now brings up motion and other finishing touches herself instead of waiting for the client to ask. It's committed on xgd-working as `533cdd9fe8`. The 11 test files covering the instructions and the plan panel pass (75 tests).

**What changed**
- **`priming.json`**: the consultant's plan-panel instructions now give a finish line for each of the seven stages, and say it's her job to get the client there, because they can't ask for what they don't know exists. The text is the draft you approved, with small tidy-ups. Finishing touches has her bring up motion first: gentle fade-ins as you scroll, a slight lift on buttons, the top banner stays still, nothing slides or spins. Then she suggests anything else that would lift this particular site, and the client says yes or no to each. She tells them to use **"Open in new tab"** to see motion, and that **"View on your phone"** shows the scroll fade-ins but not the hover effects. The same text went into both versions of the instructions, with and without the knowledge base, since they repeat each other.
- **`plan-seed.json`**: a note that each stage's finish line lives in `priming.json`, so changing a stage here means changing it there too.

**Ticket**: I added a "Resolution" section to REQ-405 recording the reframed scope and the commit. The original text and title are unchanged, and the status is still `draft`. Because this is instruction text only, there's no free-coded step to go through.

**Not changed**: the `motion_offer` check can still never come up, because nothing fires its `revision_once` trigger. The new Finishing touches guidance covers what it was meant to do, so I left it; if you'd rather not keep a check that can never fire, it's a one-line deletion from the seed.

The live builder will only pick this up after the next `bin/deploy --env dev`.

<!-- xgd-turn id="73f44f3d-7fb2-4b91-a812-46323839c49a-user" -->

<!-- xgd-chat role="user" ts="2026-10-18T12:42:05.763518+00:00" -->
#### You
the `motion_offer` check can still never come up, because nothing fires its `revision_once` trigger. <-- I don't really understand what this means?

<!-- xgd-turn id="73f44f3d-7fb2-4b91-a812-46323839c49a-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-18T12:42:16.017016+00:00" -->
#### Claude
The site plan has a list of "checks", which are questions the consultant should ask the client at the right moment. Examples are "Are we all happy with the layout?", "Have we looked at it on a phone?" and "Would some motion help here?". That last one is `motion_offer`.

A check stays quiet until a particular event happens. When it does, the check becomes "due", and the consultant's per-turn reminder gets a line like *"Due: ask the client 'Would some motion help here?'"*.

The system watches for only three events:
- the first draft finishes building
- a later round of changes finishes building
- the client opens Publish

Each check names the events that make it due. "Are we all happy with the layout?" names the first two, so it comes up as intended. "Would some motion help here?" names an event called `revision_once`, which the system never watches for. Nothing ever sets it off, so that motion reminder never reaches the consultant. Someone wrote down a name for the moment it should happen but never connected it to anything. That's part of why the consultant didn't bring up motion in your session.

You don't need to do anything about it now. The new Finishing touches guidance tells her to raise motion herself, so she no longer depends on that reminder. The broken check is just a dead entry. I can either:
- **delete it**, so nobody is misled into thinking motion is covered by a reminder; or
- **connect it** to "a round of changes has finished", so the reminder also appears after the first round of changes. This is a one-word data change, no code.

I'd delete it, since the stage guidance now does that job. Which would you like?

<!-- xgd-turn id="0bf11133-d61c-40d3-9885-51c0b584aee0-user" -->

<!-- xgd-chat role="user" ts="2026-10-18T12:47:32.705238+00:00" -->
#### You
I think it should be connected to the finishing touches stage - your suggestion works for me

<!-- xgd-turn id="0bf11133-d61c-40d3-9885-51c0b584aee0-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-18T12:47:52.316001+00:00" -->
#### Claude
Tying it to Finishing touches is the right moment, but it isn't quite what my suggestion would do, so I want to check before I build anything.

**My suggestion** ("a round of changes has finished") fires after the first round of changes, which is usually during **Refining**, two stages early. That would put the motion question in front of Bob before the layout and colours are settled.

**Tying it to Finishing touches** needs a small code change. At the moment, starting a stage doesn't make any check due. I'd add one rule: when the consultant starts a stage, any check that names that stage becomes due. Then `motion_offer` names `finishing_touches`. When she starts Finishing touches, her reminder says *"Due: ask the client 'Would some motion help here?' — the Finishing touches stage has started."* That would back up the new stage guidance at the right moment.

The rule works for any stage, so other checks could later be tied to stages the same way with a data edit. That's about 10 lines in `plan-core.ts`, the seed edit, and one test. Because it's code, it goes through the full free-coded cycle on this ticket: a separate branch, a test, the version bump, then `free_coded`.

Shall I go ahead with the Finishing touches version?

<!-- xgd-turn id="ee7679dc-88d1-4f19-a299-956ad38f0060-user" -->

<!-- xgd-chat role="user" ts="2026-10-18T13:04:54.372961+00:00" -->
#### You
Lets go with your suggestion and see how it falls out in practice

<!-- xgd-turn id="ee7679dc-88d1-4f19-a299-956ad38f0060-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-18T13:05:19.506789+00:00" -->
#### Claude
That's the data-only change: `motion_offer` becomes due when a round of changes finishes.

The motion reminder now comes up after the first round of changes finishes. It's committed on xgd-working as `7763c25e1c`, and the three plan test files I ran pass (13 tests).

- **What changed:** one word in `plan-seed.json`. The `motion_offer` check now waits for the "round of changes finished" event, which actually happens, instead of `revision_once`, which nothing ever triggers.
- **When it will show:** after the second build finishes, the consultant's reminder will tell her to ask "Would some motion help here?". That's usually during Refining, earlier than Finishing touches. The new Finishing touches guidance still covers motion later on.
- **Existing sites won't see it.** A site's plan copies the seed once, when the site is created, so only sites started after this change get the new trigger. Existing sites keep the old, never-firing one. Bob's site is affected only if it's started fresh.
- **Ticket:** I added a note to REQ-405 recording this change and that it's the version you chose to try in practice.

If it turns out to come up too early, the alternative is tying checks to a stage starting, as discussed. That needs a small code change and isn't done.

As before, the live builder picks this up only after the next `bin/deploy --env dev`.

<!-- xgd-turn id="8c1b84d0-3c36-4b94-a679-e461be81f9ef-user" -->

<!-- xgd-chat role="user" ts="2026-10-18T13:23:18.345793+00:00" -->
#### You
Can you complete the ticket? If there is no code changes you should move it to legacy_done if its finished

<!-- xgd-chat-end -->