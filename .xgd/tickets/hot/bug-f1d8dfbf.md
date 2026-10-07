---
uid: bug-f1d8dfbf
id: BUG-205
type: bug
title: 'Builder corrections from Charlie 3: looks without a mode, button or selector
  entry; working line names no one'
created_by: EPIC-19
created_at: '2026-10-07T17:10:45.883882+00:00'
updated_at: '2026-10-07T18:43:59.481733+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: medium
  priority: high
  story_points: 4
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-cfa488a3
  commits:
  - working_sha: 61594f382f90c8eef8171d53303fa83f61a006fd
    reconcile_sha: null
    main_sha: null
  - working_sha: 25268eded64b562873d93f7452a7c764bc60cc3e
    reconcile_sha: null
    main_sha: null
  version: 0.2.498
---

## Symptom

Testing REQ-391's "compare looks" on Charlie's Plumbing 3 (`site_2a2833c06700bc0896dbd380398c7f1e`), the operator found:

1. **It brings in a mode of its own.** Opening a set of looks switches the preview pane into a separate looks mode (`LOOKS_MODE` in `apps/control-app/src/builder/looks.js`), with its own controls and a "back to the draft" exit. The operator's direction: *"can't we just put the controls on the existing bar and light them up when there are comparisons available — the current draft should be considered a 'comparison'."*
2. **Looks still appear in the Page selector.**
3. **"Choose this one" is a button that bypasses the conversation.** The operator's direction: *"why do we need a button for that — I see that as part of the conversation with the AI."*

## Root cause

**(2) has two causes.**
- **A leak in REQ-391.** The page picker's `sync` (`apps/control-app/src/builder/toolbar.js`, about line 552) correctly drops rows carrying `alternative`. But if the page in the pane isn't in the filtered list, it puts it back at the top (`options.unshift(new Option(here, here))`). While a look is being viewed, that adds the look back into the selector.
- **Pages from before REQ-391.** That site also has `heavy` and `family`, Alice's earlier hand-made versions. They are ordinary pages with no `alternative` block, so no filter can recognise them.

**(3)** The button duplicates the consultant's existing `choose_look` operation (plan surface, `plan-core.ts`). Her priming already tells her to use it *"when the client tells you which one they want … with their words."* Choices are rarely clean ("B, but with A's header"). The reason behind a choice is design material she needs. And choosing replaces the page and archives the others, an irreversible step that shouldn't happen with no consultant involved.

## Fix

1. **No looks mode.** Remove `LOOKS_MODE` and the mode switching that comes with it: remembering which mode to return to, and hiding or showing controls.
   - The carousel controls live on the existing toolbar. They are **lit (enabled) only when the page in the pane has looks**, and dimmed or absent otherwise.
   - The pane stays in whatever mode it was in.
2. **The current draft is one of the looks.** The carousel steps through the real page plus its looks, for example *‹ Current · 1 of 3 ›*, *‹ Heavy Duty · 2 of 3 ›*. Stepping back to "Current" is just another position, not an exit.
   - The animated swap and preloading from REQ-391 are kept.
   - Edit mode applies to the real page only. Whether a look can be edited by hand is out of scope, so while a look is shown in Edit mode, editing is unavailable with a one-line reason.
3. **Remove the "Choose this one" button.** The carousel is for looking only.
   - Choosing happens in the chat: the client tells the consultant, and she uses `choose_look` with their words. The tool and its plan decision are unchanged.
   - The carousel should prompt the client to tell the consultant which look they prefer and why. This replaces the button's affordance with an invitation to talk.
4. **The Page selector never lists a look.**
   - When a look is shown, the selector shows the **real page the look belongs to** (`alternative.of`), never the look's own slug.
   - The fallback that adds the current page back to the list must not apply to looks.
5. **Data on the operator's dev site.** Delete the hand-made `heavy` and `family` pages on `site_2a2833c06700bc0896dbd380398c7f1e`. They pre-date REQ-391 and are superseded by `home-heavy-duty` and `home-family`.
   - Do this through the normal page-removal path, not with SQL, and do it as a data repair, not shipped code.
   - Check with the operator before deleting.

## Out of scope

- Converting legacy hand-made look pages on other sites automatically.
- Changing `choose_look`'s behaviour.
- The comp viewer (REQ-378). It shares the carousel component, so it must keep working, but its own mode and controls aren't changed here unless the shared component's removal of the mode requires it.

## Test plan

UATs `test_UAT_FC_<this ticket>_*`, at the builder's browser and route level:

- With a page that has looks, the carousel controls on the toolbar are enabled. With a page that has none, they are not, and the pane's mode never changes when stepping.
- Stepping goes Current → each look → Current, and the "Current" position renders the real page's draft.
- No "Choose this one" control is rendered anywhere in the carousel.
- With a look in the pane, the Page selector's options contain no row with an `alternative` block, and the selected value is the look's `alternative.of`.
- Regression scope: REQ-391's and REQ-378's existing UATs, adjusted only where they assert the removed mode or button.



## Added: the working line names no one (DOC-66)

**Symptom.** REQ-390's working line beside the composer reads *"Alice is building your home page · about 5 min · 2:14 so far"*. `host-core.ts` (about line 3574) builds it with `workingText(groupNames().consultant, …)`, so it takes the group chat's display name from `group-chat.json` even in one-to-one mode.

**Rule (DOC-66, decided 2026-10-04).** With one AI in the conversation it has no personal name. On third-person surfaces it's "your consultant", and copy is written so no pronoun is needed. Names return only when more than one AI is visible in the same conversation, which is the group chat.

**Fix.**
- **One-to-one mode:** the working line names no one: *"Your consultant is building your home page · about 5 min · 2:14 so far"*. With no note, it stays *"Working · 0:42 so far"*.
- **Group-chat mode** keeps the display names from `group-chat.json`, unchanged.
- **The "your consultant" label is written once**, beside the other builder copy, not inline.

**Test.** A UAT drives a one-to-one turn that emits a working note and asserts the line contains "Your consultant" and neither of `group-chat.json`'s display names. A second case asserts group-chat mode still shows the configured name.

**Out of scope.** Removing the names from `group-chat.json`, since the group chat is DOC-66's own reopen condition. Rewording internal design docs and frozen tickets.



## Implementation (as landed)

**Looks on the toolbar (`apps/control-app/src/builder/looks.js`).**
- `LOOKS_MODE`, the looks pane mode, "Back to your draft" and the "Compare looks" button are gone. One toolbar action, `looks`, sits directly after `pages` in both View and Edit.
- Its position is derived every time from the page in the pane and the page index: the members are the real page ("Current") followed by its live looks in set order, e.g. ‹ Current · 1 of 3 ›. A page in the pane that is a look is resolved to its real page via `alternative.of`.
- It is always on the bar. With no looks for the page in the pane it is **dimmed and inert** (both arrows disabled) rather than hidden, so the bar does not shift when a set arrives.
- Stepping swaps the document in the current mode's own channel (`panel.swapDocument`, animated, neighbours preloaded). The pane mode never changes. Going back to Current returns to the frame the client left.
- Lit, it shows the look's one-line description and the invitation *"Tell your consultant which look you prefer, and why."*
- **Edit on a look:** the look is shown in the edit channel but the editor is not mounted on it, the page carry does not adopt it, and the bar says *"This look can't be edited — go back to Current to edit the page."*
- **A link in the chat** (`#looks=<set>`) shows that set's first look in the pane, in the current mode (leaving the comp viewer first if it was open).
- **A set chosen from in the conversation:** when the listing next shows the look in the pane as archived, the pane goes back to its real page.

**Choosing is the conversation's.** "Choose this one", its client transport `chooseLook` and the `POST /api/pages/choose` route it alone used are removed. `choose_look` and its plan decision are unchanged. REQ-391's choosing UATs now drive `choose_look` through `/api/ai/prompt`.

**Page selector (`toolbar.js`).** With a look in the pane, the selected value is the real page's slug and the "admit the shown page" fallback can never add the look.

**Working line.** `slow-tools.json` holds `"unnamed": "Your consultant"`, exported as `WORKING_UNNAMED` from `cadence-core.ts`. `host-core.ts`' `siteTurn` takes who the line names: `WORKING_UNNAMED` for a one-to-one turn, or the member's display name for a group-chat round.

**Not done here:** the data repair (Fix 5). It is waiting for the operator's go-ahead.

## UATs

- `tests/test_UAT_FC_BUG-205_looks_on_the_toolbar.test.ts`: lit only with looks, mode unchanged when stepping, Edit note; Current → each look → Current; no "Choose this one" plus the invitation; Page selector names the real page with no look rows; chat link shows the first look, and a chosen-from set returns the pane to its page.
- `tests/test_UAT_FC_BUG-205_working_line_names_no_one.workers.test.ts`: one-to-one says "Your consultant" with neither AI display name; group chat keeps the configured name.
- `test_UAT_FC_BUG-205_there_is_no_choose_route_a_look_is_chosen_only_in_the_conversation` (in REQ-391's choosing suite).
- Adjusted: REQ-391 carousel and choosing suites, REQ-390 wire suite (unnamed line), the toolbar-lifetime declared list.