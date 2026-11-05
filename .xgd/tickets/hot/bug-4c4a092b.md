---
uid: bug-4c4a092b
id: BUG-304
type: bug
title: 'Stage guides: the hero''s signature effect is talked through during the build
  and added before the hand-over'
created_by: EPIC-19
created_at: '2026-10-27T23:08:46.627418+00:00'
updated_at: '2026-10-27T23:34:40.748000+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: high
  priority: high
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-0eeee5b9
  commits:
  - working_sha: c40ecce6c854df844fef7e475dba813133995b11
    reconcile_sha: null
    main_sha: null
  - working_sha: fbf40deaafad06210363aa29232ccf6b7260f08a
    reconcile_sha: null
    main_sha: null
  version: 0.2.685
  story_points: 5
---

## Symptom

On First-Draft-Test Dina's Diner 7 (2026-10-27), REQ-477 delivered the first-draft guide, and the consultant still commissioned the first draft without talking the hero's signature effect through. All times are UTC.
- **22:40:55:** the host's "board finished" cue starts the turn.
- **22:41:11:** the consultant tells the client "That's what I'm building to now".
- **22:41–22:42:** it places the photos, writes the design and records `pages_navigation`.
- **22:42:30:** recording `pages_navigation` triggers the first-draft guide, which arrives in that tool result. It says "talked through with your client before you brief it… Never brief 'keep motion minimal' without asking".
- **22:43:16:** the consultant delegates the build, with a brief that says "Every photo is still… no animation".

A separate REQ-477 defect: the operator's `bc` turn at 22:17 carried three guides at once (focus tasks, comparison board and design), against REQ-477's "one guide per step".

## Root cause

1. **The guide arrives mid-turn, after the consultant has committed to building.** Design, page plan and build happen in one turn, and the first-draft trigger fires inside it. Stopping to ask would contradict what it just told the client.
2. **The client's refusal of one kind of motion was stretched into a refusal of all motion.** The Look summary says "Photos sit still: no sliding carousels or moving slideshows", from the client's dislike of Crepeville's sliding photos. The consultant briefed "no animation", so following the guide looked like overriding a hearted card.
3. **More than one trigger can fire for the same turn**, and all of them are delivered.

## Fix

**1. The effect conversation happens while the first draft builds, not before it.** The operator's decision (2026-10-27): the first draft is commissioned without waiting. The 30–45 minute wait is when the effect is talked through, as part of the material track.
- **When the first-draft build starts,** the plan agenda carries a due item: talk through the hero's signature effect. The talker reads the same agenda (REQ-428), so whichever voice answers the client while the build runs raises it.
- **The offer:** two or three options suited to the hero photo, with a pick, and how to see motion once built ("Open in new tab", or "View on your phone").
- **The client's answer is recorded as a decision on the plan,** for example `signature_effect`: chosen, with the option, or declined. Either one clears the agenda item.

**2. The effect is built as its own small pass on the hero** once the first draft returns and before the hand-over, when the client chose one.
- The hand-over names the effect and how to see it.
- If the client hasn't answered by then, the hand-over says the effect is still to come and asks once.
- A decline means no pass and no further asking.

**3. Text over a moving hero is managed so the photo still shows.** Recent drafts put the headline over the hero photo, which is fine. With signature motion on that photo it can look great, but only if enough of the photo stays exposed for the motion to be seen.
- The hero pass's brief says where the moving part of the photo is (from its description and focal point), and keeps the text and any scrim clear of it.
- No full-photo dark overlay. The text stays readable, using contrast local to where it sits.
- The pass's acceptance checks include that the moving region isn't covered by text or a scrim at computer and phone widths. Headline contrast must still pass.

**4. The first-draft guide (DOC-75) says this:**
- talked through while it builds, then added before the hand-over;
- a client turning down a kind of motion (sliding carousels, say) isn't turning down the signature effect: offer it anyway, and say how it differs;
- the text-over-motion rule from point 3.

The deep reference stays DOC-74.

**5. One guide per turn.** When several triggers are due at once, only the one for the furthest step is delivered, so a step's guide is never superseded within the same turn. The others are marked as passed, not delivered later. Settle the exact rule in this ticket. Re-check the Dina 7 22:17 case against it.

## Implementation (as built)

- **When the item is on the agenda.** "The first-draft build has started" is read from the plan: the design is written, the pages (`pages_navigation`) are recorded and no first pass has landed, which is when the first build is let through (REQ-448/REQ-460). From then until the client answers, `agendaLines` (the consultant's plan entry, which the talker reads too, REQ-428) carries "Due while the first draft builds: talk the hero's signature effect through…". It covers the options with a pick, how to see motion ("Open in new tab" / "View on your phone"), that a no to sliding carousels isn't a no to this, and how to record the answer. `signature_effect` never appears in the generic "Open decisions" list; it has its own line.
- **Recording the answer.** The consultant can't normally settle a decision, but `signature_effect` is answered in conversation, like `choose_look`. So `set_decision` accepts `state: chosen` (with `value`, the option) or `state: parked` (declined) for `signature_effect` only, and requires the client's words in `client_said`. The answer is attached and logged in the decision log. The decision is created on first use: area liveness, tier concept, "The hero's signature effect". Any other decision moved to chosen or parked by the consultant is still refused. Left to the consultant (`delegated`) counts as chosen.
- **The hero pass.** With a chosen effect and the first draft back, the agenda leads with "Due first, before the hand-over: build the hero's signature effect (…) as its own small pass on the hero with Delegate". The hand-over lead and "client has not seen the draft" line wait. The brief instructions are point 3's. It gives the four builder checks in `HERO_PASS_CHECKS`: moving part not covered by the headline, other text or a scrim at computer width, the same at phone width, no dark overlay over the whole photo, and headline contrast at both widths. They are worded so the delegation lets them through to the builder (BUG-225). The pass is done when the consultant records task `hero_pass` as done (or dropped). After the hand-over, a chosen effect without the pass is a plain "Due:" line.
- **The hand-over's sentence.** Once the effect is built, the hand-over lead (`FIRST_DRAFT_LEAD`) gets "Name the signature effect and how to see it…". If the client hasn't answered, it gets "The signature effect is still to come: ask once which they'd like." Once the client has responded to the draft, nothing more is asked. The sentence goes inside the lead, not on a line of its own, because the plan entry is at its 2,000-character cap at the hand-over. The still-to-come sentence applies only to a first draft built from a written design (`milestones.design_at`, every first build since REQ-448). An older draft never had the effect on its agenda and isn't asked at its hand-over.
- **A decline** (parked) removes every effect line. The plan entry still lists it under "Parked" as a record, not an ask.
- **One guide per hand-over (the settled rule).** Each hand-over, whether a turn's start or one tool's result, delivers at most one stage guide: the furthest step's, last in `GUIDE_RULES` order. That includes a guide carried over from a mid-turn result. Every other guide due at that moment is recorded in `guides_sent` as `{ passed: true }` and never delivered, unless its stage is reopened. Successive hand-overs in one turn, each started by a new step, can still each deliver their own guide. Re-checked against Dina 7 22:17 (focus task set, sites on the board, direction proposed): only the design guide is delivered, and focus tasks and the comparison board are passed.
- **DOC-75** (first-draft guide) is rewritten per point 4: commission without waiting, talk the effect through during the build, record it as `signature_effect`, a hero pass before the hand-over, a no to one motion type isn't a no to the effect, and the text-over-motion rule with its checks.

## Test plan

`tests/test_UAT_FC_BUG-304_signature_effect_during_the_build.test.ts`, which runs the real consultant toolbox over the real plan surface, with the plan in memory:
- `test_UAT_FC_BUG-304_effect_is_on_the_agenda_while_the_draft_builds`: the item isn't on the agenda before the build, and is in the plan entry once the build has started. `set_decision` without `client_said` is refused. A choice in the client's words clears the item and is logged. A decline clears it, and nothing about the effect appears again, even after the draft is back. The consultant still can't settle other decisions.
- `test_UAT_FC_BUG-304_chosen_effect_is_built_before_hand_over`: with a chosen effect and the draft back, the hero pass leads and the hand-over lines wait. Once `hero_pass` is done, the hand-over leads again and names the effect. Unanswered at the hand-over, the lead carries "still to come, ask once", inside the plan entry. A draft without a written design isn't asked. Once the client has responded to the draft, nothing more is asked.
- `test_UAT_FC_BUG-304_hero_pass_keeps_the_moving_region_clear`: the hero pass's line carries the brief rules (where the moving part is, text and scrim clear, no full-photo overlay, local contrast) and all four checks. The checks cover computer width, phone width and contrast, and `unsettledChecks` lets them all through.
- `test_UAT_FC_BUG-304_guide_says_during_the_build`: the shipped DOC-75 first-draft guide says the effect is talked through during the build, that a declined motion type isn't a declined effect, and the text-over-motion rule. The old "before you brief it" wording is gone.
- `test_UAT_FC_BUG-304_one_guide_per_turn`: the Dina 7 22:17 state delivers exactly the design guide, with focus tasks and comparison board passed and not delivered later. The same holds mid-turn, with one carried guide at the next turn.

Regression scope run: the 39 node suites that touch the agenda, plan entry, `set_decision`, the plan surface, priming or the stage guides, plus 9 related workers suites. All pass except REQ-361 (box align diff) and three workers timeouts (REQ-426, REQ-428 talker, REQ-458 builder-holding). All four fail identically on clean xgd-working.