---
uid: request-4f7a263e
id: REQ-402
type: request
title: 'Looks: a band at the top of the preview with ‹ name ›, the full description
  and ''Tell the consultant…'' — only when the page has looks'
created_by: EPIC-19
created_at: '2026-10-17T15:17:00.556053+00:00'
updated_at: '2026-10-17T15:55:41.460343+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  story_points: 3
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-703576d6
  commits:
  - working_sha: ea2b181f7f19da61b0cb1ae5854166fdad9080fd
    reconcile_sha: null
    main_sha: null
  - working_sha: 31c13171be849ec2ba62619785bf0127c707baa0
    reconcile_sha: null
    main_sha: null
  version: 0.2.513
---

## What changes

The look selector (REQ-391, reworked by BUG-205 onto the preview toolbar) doesn't have enough room. The operator likes the look descriptions, but squeezed into the toolbar the selector is broken. Decided 2026-10-17, it moves into a **band of its own at the top of the preview area**, shown only when there are looks to compare.

The word stays **"look"**, both in what the client sees and in the code.

## Requirements

1. **There's no band unless the page has looks.** For a page with none, nothing is shown at all: no dimmed controls and no reserved space.
2. **When the page has looks, a band takes the top of the preview area,** full width, above the rendered page. The page moves down to make room; the band isn't overlaid on it. The band appears and disappears as the page in the pane changes.
3. **On the left of the band: `‹ Name ›`**, the look's label between previous/next arrows, with a small "N of M".
   - The current draft is one of the looks, labelled **"Current"** (BUG-205), and stepping wraps around.
   - The cross-fade between looks and the preloading (REQ-391) stay.
4. **To the right, a description area that takes the rest of the band's width,** showing the look's `alternative.description` in full. It wraps to as many lines as it needs and is never cut short. "Current" shows a short line saying it's the page as it stands.
5. **Under the description, the instruction:** **"Tell the consultant which look you prefer, and why."**
   - The wording is exact: "Tell the consultant", not "THE consultant" and not "your consultant".
   - It replaces `LOOKS_TELL_CONSULTANT` in `apps/control-app/src/builder/config.js`, which today reads "Tell your consultant which look you prefer, and why."
   - This is a deliberate exception to DOC-66's "your consultant" for running copy, decided by the operator. Record that next to the string so a later pass doesn't "fix" it back.
6. **The look controls come off the preview toolbar** (BUG-205's carousel action). The band replaces them, and there's one place to change looks.
7. **BUG-205's other behaviour stays:**
   - there's no separate looks mode;
   - there's no "Choose this one" button, because choosing happens in conversation through `choose_look`;
   - the Page selector never lists a look and shows the real page while a look is displayed.

## Out of scope

- How looks are made or chosen.
- The comp viewer (REQ-378), unless it shares the component. If it does, it must keep working.

## Test plan

UATs `test_UAT_FC_<this ticket>_*`, on the builder's preview:

- For a page with no looks, no band element exists and the preview starts at the top of the pane.
- For a page with looks, the band is rendered above the page frame, not overlapping it, and spans the pane's width.
- The band shows `‹ label ›` and "N of M". Stepping goes Current → each look → Current and updates both the label and the description.
- A long description is shown in full, wrapped, with no ellipsis.
- The instruction under it reads exactly "Tell the consultant which look you prefer, and why."
- The preview toolbar contains no look controls.

## What landed

- **The band** is `mountLooksBand` in `apps/control-app/src/builder/looks.js`, a `<section class="looks-band">` mounted in a new preview column (`.builder-preview`, a flex column in `app.js`) that holds the band and then the pane (`panel.element`). The band is **inserted before the pane only while the page in it has looks, and removed otherwise**. It isn't hidden, so a page with no looks has no band element at all. The pane is never re-parented, because moving an iframe reloads it. The band redraws on the listing refresh and on the panel's `src`, `document` and `mode` events. It shows only in View and Edit, never in the comp viewer.
- **Left:** the shared `carouselNav` (`carousel.js`) with a new `wrap` option. In the band the set is a ring: › from the last look is Current, and ‹ from Current is the last look. A wrapped step also passes its direction, so the cross-fade comes from the side the client stepped (`looks.move(to, direction)`). The comp viewer (REQ-378) uses the same component without `wrap`, so its arrows still stop at the ends.
- **Right:** `.looks-band__about` takes the rest of the width (`flex: 1 1 0`). It holds the description (`white-space: normal`, `overflow-wrap: anywhere`, no clamp or ellipsis), then the invitation, then, for a look shown in Edit, BUG-205's "This look can’t be edited…" note. Current's description line is `LOOKS_CURRENT_DESCRIPTION`, "Your page as it stands now."
- **`LOOKS_TELL_CONSULTANT`** now reads "Tell the consultant which look you prefer, and why." A comment beside it records the deliberate exception to DOC-66. `LOOKS_NONE` (the tooltip on the dimmed control) was deleted, because nothing uses it now.
- **The toolbar:** `lookCarouselAction` and the `looks` id are gone from both View and Edit action lists, and the old `.looks-bar*` CSS was deleted.

## Supersedes (intent conflict, declared)

This ticket deliberately changes behaviour pinned by REQ-391's and BUG-205's UATs, and those tests were updated in this ticket's commit:
- the carousel is no longer a toolbar action next to `pages`. It is the band (`tests/test_UAT_FC_BUG-205_looks_on_the_toolbar.test.ts`, `tests/test_UAT_FC_REQ-391_looks_carousel.test.ts`, `tests/reconciliation-builder-toolbar-lifetime.test.ts` DECLARED list);
- on a page with no looks there's no control at all, where there used to be a dimmed, inert one;
- the arrows wrap instead of stopping at the first and last look;
- the invitation reads "Tell the consultant…" instead of "Tell your consultant…".

## Tests

`tests/test_UAT_FC_REQ-402_looks_band.test.ts` runs the real builder in jsdom and has six UATs, matching the test plan above:
- no band for a page with no looks, and the pane is the preview column's only child;
- the band is the pane's preceding sibling, in a `flex-direction: column` container, not positioned, with the description area flexing over the rest of the width;
- stepping goes Current → Heavy Duty → Family → Current, then ‹ goes to Family, and the label, count and description update each time;
- a long description is shown in full, wrapped, with no ellipsis or clamp in the CSS;
- the exact instruction text sits directly under the description;
- the toolbar has no look controls in View or Edit, and the band is the only carousel.

Regression scope: all 82 suites that mount the builder or read `builder.css`. With this change applied in the main checkout, the failures are a strict subset of the clean xgd-working baseline. The 9 pre-existing failures are AC1065/1070, AC961/963/977, BUG-52, BUG-53, REQ-127 and REQ-259. BUG-70's toolbar-typography UAT now passes as well.