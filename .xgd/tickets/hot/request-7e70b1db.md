---
uid: request-7e70b1db
id: REQ-98
type: request
title: 'L1 paint axes are arbitrary across node kinds: make the surface group uniform'
created_by: xgd
created_at: '2026-07-26T01:25:42.552217+00:00'
updated_at: '2026-08-06T04:55:02.523689+00:00'
completed_at: '2026-08-06T04:55:02.523689+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  priority: medium
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: 1ca18d75f44cf4bb217d6ebbf1da15070b6e3733
    reconcile_sha: null
    main_sha: null
  version: 0.0.210
  story_points: 3
  bundled_in: bundle-ee56a66e
  chat_comment: comment-1e21be7b
---

## The gap

Which L1 node kinds can *paint* is arbitrary, and the arbitrariness is about to
get worse.

| node kind | paint axes | layout |
|---|---|---|
| `box` | yes (`l1BoxAxesSchema`) | **no** |
| `container` | **no** | yes (`layout` / `gapPx` / `distribution` / `align`) |
| `image` | yes | — |
| `text` | yes | — |
| `slot` | **no** | — |
| `control` (new, [[request-3a064234]]) | **needs them** | — |

`L1BoxNode` has no `layout` / `gapPx` / `distribution` / `align`;
`L1ContainerNode` has no `axes`. So **any element that is both painted and
internally laid out requires two nested nodes** — a `box` wrapping a
`container`, or the reverse.

Found while authoring the xgd.dev hero ([[request-d41fd017]], REQ-95).
Survivable for a CTA button (a single text child flows fine inside a padded
box), but it is a compounding tax on cards, panels and bordered sections — which
is most of a marketing page below the hero.

## Why this is now a contract hole, not an ergonomics complaint

[[request-3a064234]] (REQ-96) establishes that **L1 owns class, geometry and
every paint axis; the module ships zero CSS**. Whatever L1 cannot express, a
module must paint — the precise outcome REQ-96 exists to make impossible. An
arbitrary map of which node kinds can carry a surface is therefore a hole in
that contract.

REQ-96 also introduces a **sixth node kind** (`control`) which explicitly needs
"L1's class, geometry and paint axes". Adding them to one more kind by hand is
exactly the process that produced the present asymmetry.

## Proposed change

Do **not** simply "add `axes` to `container`". Make the surface/paint capability
**uniform and shared** across every node kind that renders a box — `box`,
`container`, `image`, `text`, `slot`, `control` — as one shared axis group,
rather than re-declared per kind.

This is purely **additive**: capture never populates these fields on a
container, so `fold` and both existing reproductions are unaffected.

## Sequencing — read before starting

This restructures `packages/site-schema/src/l1/schema.ts`, and so does REQ-96
(which adds the `control` node kind and its axes). **They will collide.** Land
this with or immediately after REQ-96, or fold it into REQ-96's scope. Do not
run them in parallel on separate branches.

## Deliberately NOT in scope

Once `container` can paint, `box` becomes a strict subset of `container`
(a container with no layout). By the project's "ruthless refactoring / no
duplicate mechanisms" rule that argues for **merging the two node kinds**.

That is not proposed here: the merge touches `fold`, the renderer, and both
passing reproductions (gigabytealchemy, joyful), and the evidence does not yet
justify the risk. Do the additive change first; if `box` proves redundant after
more authoring, the merge is a clean follow-up with a worked case behind it.

## Acceptance

- A `container` accepts `surfaceFill` / `border` / `borderRadiusPx` /
  `boxShadow` (etc.) and renders them while still laying out its children.
- A painted, internally-laid-out element needs **one** node, not two.
- The paint axis group is declared once and shared, not copy-pasted per kind.
- `fold` output and the gigabytealchemy / joyful reproductions are byte-identical
  or better.

-