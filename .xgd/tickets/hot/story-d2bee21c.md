---
uid: story-d2bee21c
id: STORY-173
type: story
title: The consultant can measure a drawing and solve where to put a node instead
  of guessing at it from screenshots
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T07:15:54.613397+00:00'
updated_at: '2026-11-08T07:26:18.739983+00:00'
completed_at: null
last_field_updated: status
status: completed
fields:
  intent_uid: bundle-c0301347
  capability_uid: capability-2d32662d
  story_kind: feature
  story_points: 3
---

## Story
**As the** site consultant (the AI authoring a business's drawings), **I want** to measure a drawing in numbers, name the features those numbers describe, and turn a stated alignment into the exact value to write, **so that** I can position a mark precisely in one write instead of looping render → screenshot → squint → adjust, and the user sees a confident result rather than fumbling.

## Description
REQ-209 (commit 83d43791). On 2026-09-09 the consultant spent 13 `write_image` and 13 `screenshot` calls in sixteen minutes on the 1st Contact wordmark without landing it, ending by drawing a ruler grid into the drawing. This story gives drawings a geometry channel:

- **A closed anchor vocabulary** `<node>.<anchor>`, four families that are not interchangeable: box (`left right top bottom centre-x centre-y`), ink (`ink-left ink-right ink-top ink-bottom`), font (`baseline cap-top x-top ascender descender`), advance (`advance-start advance-end`). The axis is inferred from the anchor name.
- **`measure_drawing`** renders one of the site's own SVG drawings in the site's font context. It returns primitives: per node the box, the ink box, the baseline and the advance; per document the viewBox and font metrics, reported once per font. Everything is in root user space with transforms resolved. Text nodes also carry per-glyph extents. The response reports the requested and the resolved font, and nodes without an `id` appear under a path reference. Any relations the drawing records in comments come back with their current delta.
- **`relate(a, b)`**: one signed delta and its axis.
- **`solve`**: translation only. It returns node + attribute + value, never a bare number.
- **`write_image` `assert`**: an advisory check. The stated relations are evaluated against the written drawing and the deltas are echoed back. A render happens only when `assert` is present.
- **Authoring guidance in `write_image`'s description**: text runs compose as `<tspan>` children of one `<text>`; a mark names a registered font, not `system-ui`/`-apple-system`/bare `sans-serif`; a node meant to be positioned gets an `id`.

**Out of scope** (per REQ-209 "What this does not do"): automatic layout, any constraint system, page measurement (`measure_page`), equal-distribution solving, scale/rotation solving, text-to-outline conversion, and correcting the 1st Contact wordmark itself (site data, not code).

## Technical Context
- Spec: REQ-209; DOC-52 §3.1–3.4 and §5. The anchor set is a shared site-schema contract so a later `measure_page` imports the same names (one definition site, no drift).
- The operations sit on the L1 control surface in a new read-effect group, declared just before `write_image`. They are not on the fidelity surface, because reading a site drawing needs the site store. The browser they use comes from the same source as the fidelity surface (STORY-157), so a deployment either can both screenshot and measure, or can do neither.
- Architecture items 31/35: measurement is bounded per-drawing work. The browser is acquired only when a measurement or an `assert` asks for it.
- Security policy: the SVG stays structured data validated by the existing `write_image` validator (STORY-107). SVG comments already pass that validator, which is what makes recorded relations possible. Nothing here widens what a drawing may contain.
- `write_image` itself belongs to STORY-107 (CAP-94). This story adds only the `assert` parameter and the description rules, folded in here per the reconciliation plan.

## Reconciliation Decisions
- **Relation syntax** (decided at reconciliation, 2026-11-07): REQ-209's body shows relations only by example. Its "How it landed" section, and the code, fix one string form, `<node>.<anchor> = <node>.<anchor>`, optionally followed by `+`/`-` and a number. The same form is used by `assert` and by recorded SVG comments, and nothing richer is accepted. Formalized in the assert and recorded-relation ACs.
- **Tolerance for "holds"** (decided at reconciliation, 2026-11-07): intent is silent. The landed code treats a residual of magnitude ≤ 0.05 user units as holding and rounds deltas to 3 decimals. Formalized in the assert AC because a test needs a pass boundary.
- **solve's movable kinds and refusals** (decided at reconciliation, 2026-11-07): the body says only "translation only". The landed behaviour moves `<text>`/`<tspan>`/`<rect>` via `x`/`y` and `<circle>`/`<ellipse>` via `cx`/`cy`. It refuses, each with a sentence naming the alternative: other kinds (e.g. `<line>`, `<path>`), nodes under a rotate/skew, a list-valued position attribute, and a `move` that disagrees with the node named in `so`. Formalized as the solve-refusal AC.
- **Internal fields hidden from the model** (decided at reconciliation, 2026-11-07): intent is silent. Current attribute values, local-to-root scale, skew flag and tree path are stripped from the `measure_drawing` response, because a field the model can see is a field it will reason from. Formalized in the measurement-shape AC.
- **Count of anchors**: the commit message and a code comment say "fifteen named lines". REQ-209's table names 17 (6 box + 4 ink + 5 font + 2 advance), and the code's set matches the table. The ACs follow the table; this is prose drift, not a code issue.

## Dependencies
- None within this bundle. It relies on STORY-107 (`write_image`) and STORY-157 (the fidelity-surface browser).

## Story Points
3