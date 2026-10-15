---
uid: request-071115b2
id: REQ-398
type: request
title: 'Plan panel: a one-line progress banner — numbered stages, coloured by state,
  skipped worked out, explained on hover'
created_by: EPIC-19
created_at: '2026-10-15T16:33:54.152507+00:00'
updated_at: '2026-10-15T16:43:03.614681+00:00'
completed_at: null
last_field_updated: body
status: free_coding
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

## Design decisions made during implementation

- **An in-progress stage is never drawn skipped.** If the consultant leaves stage 3 in progress and marks stage 5 done, stage 3 stays blue and named; only stages that are *not started* before the furthest stage reached turn yellow. ("Not done" in requirement 4 is read as "not started" for this reason.)
- **The explanation is a small tip under the banner**, not the browser's `title`, because `title` doesn't appear on keyboard focus or on a tap. Hover or focus opens it and leaving closes it; a tap opens it and a second tap on the same stage closes it. The tip stays inside the banner at its right-hand end, and it stays open on the same stage across a redraw.
- **Every stage is focusable** (`tabindex=0`), and its accessible name reads `N. Name — State`, so a screen reader gets the state without relying on colour.
- **States in words** are capitalised everywhere they're shown: *Not started / In progress / Done / Skipped*.
- **The explanations are carried to the client's panel only.** `panelView` adds `about` to each stage. The consultant's `read_plan` view is unchanged.
- **On a narrow panel** (a container query at 360px), the stage padding and separators tighten. Only the stage in progress can shrink, and its name ends in an ellipsis.
- **Skipped carries a dash and a strike-through** on its number. Done carries a ✓.
- REQ-390's tracker UAT is updated to the banner's drawing. Its collapse assertions are removed, because this ticket removes the toggle.

## Implementation

- `apps/control-app/src/builder/plan-panel.js` — `shownStates()` holds the skipped rule; `drawStages()` draws the banner and its tip; the collapse toggle and its storage key are deleted.
- `apps/control-app/src/builder/builder.css` — the sticky one-line banner, one colour per state, and the tip.
- `apps/control-app/src/builder/config.js` — `PLAN_STAGES_TITLE` (`Progress:`) and the states in words, including Skipped. The collapse/expand strings are removed.
- `tools/generate/src/cli/ai/plan-seed.json` — an `about` sentence beside each stage's label.
- `tools/generate/src/cli/ai/plan-core.ts` — the `PanelStage` view carries `about`.
- UATs: `tests/test_UAT_FC_REQ-398_progress_banner.test.ts` (six tests: pinned single line with no toggle; only the current stage named; the skipped rule, including the in-progress-before-done case; colour per state plus mark; hover/focus/tap text, read-only; seed explanations and no stored `skipped`, which `checkPlan` refuses).
