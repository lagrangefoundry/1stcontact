---
uid: request-22aa8ea3
id: REQ-19
type: request
title: 'Milestone: 1stcontact.io at sycamore.so-level (ceiling proof)'
created_by: xgd
created_at: '2026-07-02T00:20:11.447007+00:00'
updated_at: '2026-08-20T21:38:34.079226+00:00'
completed_at: null
last_field_updated: status
status: abandoned
fields:
  story_points: 8
  priority: medium
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-70b033ef
---

## Scope — milestone / acceptance goal (not a single build)

The corollary of [[DOC-15]] §4 and the public demonstration of [[DOC-4]]: **rebuild 1stcontact.io to sycamore.so-level using only our own modules**, proving the language + eyes reach the expressive ceiling. This is a **milestone**, gated on the flashy primitives — not a discrete feature.

## Dependencies
`layer` module, motion primitive (and later a generative-visual primitive), REQ-14 (background). The framework catalog must be rich enough first.

## Acceptance criteria
- The 1st Contact marketing site is **indistinguishable in polish** from a sycamore-class site (motion, layered composition, art direction) — judged by eyes, not pixels.
- Built **entirely from our own modules** (Tier A + any hardened Tier-B modules) — no raw CSS/HTML, no per-site hacks outside the model.
- Passes our own quality gates and renders through the standard `1c` pipeline.

## Notes
Serves as the **ceiling-proof driver** for the module roadmap, counterbalancing the coverage histogram (which alone would never prioritize wow-factor primitives — [[DOC-15]] §4). Break down into concrete build REQs once the underlying primitives exist.
---

## Abandoned (2026-08-20) — superseded

The ceiling-proof role this milestone was created to serve has been taken over by
the **xgd.dev** site build (`storage/sites/xgd`), which is now the site being driven
to premium/non-template polish and is the forcing function for the flashy primitives
(background, layer, motion, responsive layout track).

Two things changed since this was written:

1. **The framework pivoted** (REQ-79 / REQ-84 / REQ-96). "Built entirely from our own
   modules" no longer describes the architecture — layout is the **L1 substrate**
   ([[DOC-23]]), and a *module* now means a **behavior module** ([[DOC-25]]). The
   acceptance criteria here are phrased in the superseded semantic-layout-module model.
2. **The demonstration site changed.** 1stcontact.io is not currently an authored site
   in the repo; xgd.dev is, and it is where the ceiling proof is actually being earned.

Nothing here is lost — the underlying intent (a real site driven to sycamore-class
polish as the counterweight to coverage-histogram-driven module work, [[DOC-15]] §4,
[[DOC-4]]) is live in the xgd.dev build and the reproduction-driven growth loop
([[DOC-21]]). If a 1stcontact.io marketing-site build is wanted later, it should be a
fresh REQ written against the post-pivot L1 model.
