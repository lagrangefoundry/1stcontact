---
uid: bug-4c6b111a
id: BUG-331
type: bug
title: 'Story board cards: the Look summary is an unreadable block, and a headline
  the client gives in chat isn''t recorded as theirs'
created_by: EPIC-19
created_at: '2026-11-02T22:07:50.954022+00:00'
updated_at: '2026-11-03T00:12:06.088469+00:00'
completed_at: null
last_field_updated: body
status: parked
fields:
  severity: medium
  priority: high
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
---

## Symptom

Production, 2026-11-02, a test site build (operator):
1. "The Look summary seems to be text only. It has no formatting and is nearly impossible to read."
2. "I gave the consultant my headline — it has not replaced its headline choices and the host is still directing me to choose."

## Root cause

1. **The Look summary is one run-on paragraph, drawn as plain text.** The `visual_concept` decision's value is ~1,200 characters in one paragraph with "DO: …", "Palette: …" and "NEVER: …" inline. `comparisons.js` draws the card's text as a `button` with `textContent`, so no line breaks, bullets or emphasis can show even if the consultant wrote them.
2. **A client's own headline from chat has nowhere to go.** The consultant recorded it with `set_decision` as a separate `headline` decision, state **`proposed`**, value "Beauty and Strength – metalwork done right. (Martin's own wording, given in conversation; replaces the three earlier options.)" — the client's words as a proposal, with a parenthetical aside in the value. The story board's `board.headline` still holds the three offered options (`pick: 0`), no choice, so the host's agenda and the board still ask the client to choose. The board lets the client write their own headline in the UI, but the consultant has no operation to record one the client gave in conversation.

## Fix

1. **A readable Look summary.**
   - The consultant writes it as short parts: a one-line direction, then "Keep" and "Avoid" as a few bullets each, then the palette in a line. The `visual_concept` guidance (and the comparison board stage guide) says so, with a length guide (a short card, not an essay).
   - The card renders a safe subset of markdown (line breaks, `-` bullets, `**bold**`), with text still HTML-escaped; editing shows the same text with its line breaks in the box.
2. **A headline the client gives is recorded as theirs.**
   - A plan operation (e.g. `client_headline`, or a `chosen` form of `offer_headlines`) records a headline the client wrote in conversation as **chosen**, in their exact words, with their message as the quote: `board.headline` shows it as their choice (the card's "yours" state), the offered options are set aside, and the stage's "headline agreed" fact holds. Never a `proposed` decision, and never an aside inside the value.
   - The consultant's priming and the story board guide say: when the client gives their own headline, record it with that operation that turn.
   - The host refuses `set_decision` for a `headline` decision with the client's own wording as `proposed` (name the operation to use instead).
3. **Repair this site:** once deployed, the consultant's next turn sees the stray `headline` decision and records it through the new operation.

## Test plan

- `test_UAT_FC_<id>_look_summary_renders_parts`: a `visual_concept` value with a direction line, "Keep"/"Avoid" bullets and a palette line renders on the card as separate lines and list items, escaped; editing shows the same text with its line breaks.
- `test_UAT_FC_<id>_client_headline_recorded_as_chosen`: the consultant records a headline the client gave in chat; `board.headline` shows it chosen in their words with the quote, the options are set aside, and the host no longer asks the client to choose.
- `test_UAT_FC_<id>_client_headline_not_a_proposal`: `set_decision` writing the client's headline as a `proposed` `headline` decision is refused, naming the operation to use.



## Parked (operator, 2026-11-02)

Parked pending DOC-82 (consultant model: a great site as the goal, the process as a toolkit). Its new host refusal (set_decision for a client's headline as proposed) is the kind of gate DOC-82 reviews. The two fixes themselves (a readable Look summary; recording a client's own headline as chosen) are still wanted and will be re-scoped once DOC-82's inventory is settled.