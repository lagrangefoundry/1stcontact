---
uid: request-d67ea520
id: REQ-104
type: request
title: 'L1 rows cannot wrap or reflow: responsive layout track (no workaround exists
  for control nodes)'
created_by: xgd
created_at: '2026-07-27T21:23:58.990576+00:00'
updated_at: '2026-08-06T04:54:58.553405+00:00'
completed_at: '2026-08-06T04:54:58.553405+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  priority: high
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: a55ced89fb63d9b42e3b4bd6d57ef7c75fb2c02a
    reconcile_sha: null
    main_sha: null
  version: 0.0.221
  story_points: 3
  bundled_in: bundle-ee56a66e
  chat_comment: comment-92e47bff
---

## The gap

A `row` container cannot wrap, and `layout` is not responsive.

```ts
// packages/site-schema/src/l1/schema.ts
layout: z.enum(['stack', 'row', 'grid']),
```

One value, all widths. There is no `wrap` axis and no per-width `layout` track,
so a horizontal run of peers has no way to become a vertical one on a narrow
screen — which is the single most common responsive behaviour on the web.

## The workaround, and where it runs out

The only expressible answer is to **author the subtree twice** under paired
`visibility.fromPx` / `visibility.untilPx`. REQ-95 used it three times on
xgd.dev: `cta-row`/`cta-stack` in the hero, `problem-items-row`/`-stack`, and
`how-steps-row`/`-stack`.

It is expensive but survivable for inert content. It costs duplicated tree
structure (every copy edited in lockstep, or they silently diverge), it doubles
the node count against the 2000 cap, and it puts both copies in the DOM so
`staggerMs` counts children the reader never sees — the exact hazard REQ-100's
`reveal.delayMs` docblock was written to describe.

**With `control` nodes the workaround does not exist at all.**

Since REQ-96, a leaf control is an L1 node that the module fills in with an
attribute bundle — `name`, `id`, `type`, `required`, the `for`↔`id` wiring.
Duplicating a `control` duplicates a *form field*: two `<input>`s with the same
`name` and the same `id`. That is not a responsive form, it is a malformed one —
duplicate IDs break the a11y label association the module exists to guarantee,
and the duplicate `name` corrupts the submitted payload regardless of which copy
is visually hidden (`visibility` is CSS, not `disabled`).

So a row of controls that must reflow to a column at mobile — a first/last name
pair, an email-plus-button signup, a postcode-and-country row — has **no
representation in L1 at any cost**. REQ-95's beta-capture form is authored as a
single column at every width for this reason alone, not by design choice.

This is the case REQ-96 makes common: it moved every control's presentation into
L1, and L1 has no way to lay controls out responsively.

## Proposed shape

**(a) `wrap: boolean` on `container`** (when `layout: 'row'`). Compiles to
`flex-wrap: wrap`. Smallest possible change; combined with `sizing.width.minPx`
on the children it produces the standard "cards reflow when they no longer fit"
behaviour with no duplication and no breakpoint authoring. Handles the card-row
cases directly.

**(b) A responsive `layout` track** — `responsiveLayout: { keyframes: [{ at, value }] }`,
matching the shape `responsivePadding` (REQ-88) and `responsive` scalars already
use. Strictly more expressive than (a): it covers row→stack, and it is the only
one of the two that solves the `control` case, since a control row that becomes a
control column is one subtree throughout.

Recommend **(b)**, with (a) as a cheap complement if it falls out. (b) is the one
that closes the hole; (a) alone leaves the form case unsolved, because wrapping a
row of one input and one button is not the same as stacking them.

## Acceptance criteria

1. A `row` container can be authored to lay out as a `stack` below a stated
   width, as ONE subtree.
2. A row of `control` nodes reflows to a column at mobile with exactly one
   `<input>` per field in the DOM, one `id` per control, and an intact
   `for`↔`id` association at every width.
3. `staggerMs` on such a container indexes only the children that exist once —
   no phantom peers.
4. xgd.dev's three duplicated row/stack pairs collapse to single subtrees, and
   the page re-passes REQ-95's AC3 (clean at 375/768/1280) and AC4 (content
   robustness) with node count materially reduced.
5. Every existing L1 page renders unchanged when it declares no responsive
   layout.

## Evidence

REQ-95 passes 1 and 2. Three duplicated subtrees in
`storage/sites/xgd/draft/pages/home.json`; one form authored single-column
because no other option exists.

-