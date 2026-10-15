---
uid: request-071115b2
id: REQ-398
type: request
title: 'Plan panel: a one-line progress banner — numbered stages, coloured by state,
  skipped worked out, explained on hover'
created_by: EPIC-19
created_at: '2026-10-15T16:33:54.152507+00:00'
updated_at: '2026-10-15T16:33:54.152507+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  story_points: 3
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-6a4c3dd7
---

## What changes

The plan panel's stage tracker (REQ-390) is redrawn as a **progress banner**. Today it's a row of radio-button-like marks that wraps over several lines and doesn't read as progress. The operator asked for:

> Progress: 1 | 2 | 3. Refining | 4 | 5 | …

It will be a series of numbered stages, coloured by state, with only the current stage expanded to show its name.

## Requirements

1. **One line, full width, at the top of the plan panel, and it does not scroll away.** The questions and comps scroll beneath it. It never wraps. On a narrow panel the numbers tighten up, and only the expanded stage's name may be shortened with an ellipsis.
2. **Layout:** the word `Progress:` and then every stage as its number, e.g. `Progress: 1 | 2 | 3. Refining | 4 | 5 | 6 | 7`. The stage in progress shows its number and its name; every other stage shows only its number.
3. **Colours, one per state:**
   - **grey:** not started
   - **green:** done
   - **blue, expanded:** in progress. It turns green, and shrinks back to its number, when it's done. The existing spinner shows on it while a turn is running.
   - **yellow:** skipped
   
   Colour is never the only signal: done also carries a ✓, and skipped also carries a dash or strike-through.
4. **Skipped is worked out when the banner is drawn, never stored.** The rule is: *if stage N is done or in progress, every stage from 1 to N−1 that is not done is shown as skipped*, using the highest such N. So:
   - The plan schema keeps its three stored states (`not_started`, `in_progress`, `done`).
   - There's no new operation and nothing for the consultant to maintain.
   - Done stages stay green wherever they sit.
   - Stages after the furthest one reached stay grey.
   - When no stage is in progress, nothing expands, and the rule still applies from the furthest stage that's done.
5. **Hover (and keyboard focus, and tap on touch screens)** on a number or on the expanded stage shows:
   - the stage's name;
   - a one-sentence explanation of what that stage is;
   - its state in words: *Not started / In progress / Done / Skipped*.
6. **Stage explanations live in `plan-seed.json`, beside each stage's label**, one sentence each, in the client's language. The banner reads them from there and writes none itself.
7. **The banner is read-only.** Only the consultant moves stages; clicking a stage does nothing.
8. **The collapse toggle and its stored setting (`plan-stages-collapsed`) are removed.** A one-line banner doesn't need one.

## Out of scope

- The rest of the plan panel (questions, answer types, comps). The input area is a separate discussion.
- How and when the consultant moves stages.

## Test plan

UATs `test_UAT_FC_<this ticket>_*`, through the plan panel rendered from a plan:

- The banner renders as a single row, stays visible after the panel's list scrolls, and has no collapse control.
- Only the in-progress stage shows its name; the others show only their numbers.
- The skipped rule:
  - stage 4 in progress with stage 2 done → 1 and 3 skipped, 2 done, 5–7 not started;
  - nothing in progress with stage 5 done → 1–4 skipped except those that are done;
  - nothing done or in progress → all not started.
- Each state gets its colour class and its non-colour marker.
- Hover/focus text for a stage includes its name, its explanation from `plan-seed.json`, and its state in words.
- The stored plan never contains a `skipped` stage state.