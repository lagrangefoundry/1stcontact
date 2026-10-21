---
uid: request-85bf0f4c
id: REQ-425
type: request
title: 'Story board: a positioning card between the notes and the headline, and readiness
  per area so the consultant proposes first'
created_by: EPIC-19
created_at: '2026-10-21T19:43:28.066371+00:00'
updated_at: '2026-10-21T19:43:28.066371+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  story_points: 8
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-8520a80f
---

## Why (Ariel's AR Welding run, 2026-10-21; operator)

After the client rejected the headline the consultant had chosen ("If you
wouldn't stand under it, don't weld it"), it asked: "If a contractor reads one
line at the top of your page, what do you want it to tell them?" — the right
question asked the hardest way (a blank page, DOC-33 §7.2). The client knew the
answer ("Beauty and Strength — quality custom metalwork"); most owners won't.

Three gaps:
1. **No synthesis step.** The story board collects material; nothing turns it
   into a position, so the consultant goes from notes straight to a headline.
2. **The story, not the sale.** The vivid adage was chosen because it's
   memorable, not because it tells a contractor why to choose this shop. Story is
   proof, not pitch.
3. **One pace for everyone.** Clients range per area (words, look, function) from
   "I don't know where to start" to "I know exactly what I want — just do it".

> If I know the answer to your question, don't force me through a brainstorming
> exercise with you to get there … if I don't know where to start, please help me
> build the concepts I need. (operator)

The priming half landed as `7b5db38f70` ("Propose first, then ask" and "From
story to message"); this ticket is the product half.

## What changes

1. **A positioning card on the story board**, above the headline slot (REQ-408),
   written by the consultant from the client's hearted notes:
   - what I'm hearing (two or three themes);
   - what you're known for;
   - why your customer picks you (per kind of customer, through what they're
     deciding on).
   The client hearts it or edits it (client edits are theirs, as with notes).
2. **Headline options are derived from the positioning card**, and the slot's
   options say which line of the card each one comes from. No headline options
   are offered before a positioning card exists.
3. **"Getting to know you" finishes with a confirmed positioning card** (hearted or
   client-edited), completing REQ-405's missing story criterion — or the honest
   fallback (nothing distinctive: be the most trustworthy and easiest to contact),
   recorded as a decision.
4. **Readiness per area on the plan**: messaging, look and feel, site functions —
   `unknown | has_ideas | knows_exactly`, set by the consultant from what the client
   says and shown in its per-turn notice, so it calibrates (propose and guide vs.
   carry out) without re-asking.
5. **Focus task (REQ-424):** react to notes → confirm the positioning card → pick a
   headline, one step at a time.

## Test plan
- The consultant can write, and the client can heart/edit, a positioning card;
  the board renders it above the headline slot.
- Offering headline options without a positioning card is refused; options carry
  their source line.
- The stage's finish line is met by a confirmed card or a recorded fallback, not
  otherwise.
- Readiness values persist on the plan and appear in the per-turn notice.