---
uid: report-d2a39995
id: REPORT-11333
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-11-08T07:17:20.325217+00:00'
updated_at: '2026-11-08T07:17:20.325217+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-c0301347
  plan_item_index: '6'
---

```
Story #6 created for reconciliation bundle-c0301347

Story UID: STORY-173 (story-d2bee21c)
Title: The consultant can measure a drawing and solve where to put a node instead of guessing at it from screenshots
Type: feature
Acceptance Criteria: 16 created (AC-2393 – AC-2408)

Progress: 6 of 6 plan items complete
```

The story sits under CAP-94, the capability that owns `write_image`. Every ticket was committed locally, but the sandbox blocked each automatic push to `github.com:22`, so none of these commits are on the remote yet.

**What the 16 criteria cover:**
- **Anchors:** the set of anchor names, the axis each one implies, and the refusals for invalid ones.
- **The measurement:** what `measure_drawing` returns (positions resolved to the drawing's root coordinates, font metrics listed once per font, internal fields hidden). It also covers per-character extents, `<tspan>` runs placing themselves, and nodes without an `id` showing up under a path. Empty nodes are flagged and nothing inside `<defs>` is reported.
- **Distinct lines and fonts:** where the ink ends versus where the text advances to, which are 8.4 units apart on the wordmark's "1". Cap height and the top of the ink also differ. The requested font is reported next to the one that actually rendered.
- **`relate` and `solve`:**
  - `relate` returns a signed delta, and anchors on different axes are refused.
  - `solve` returns the node, attribute and value, and writing that value makes the `relate` delta zero.
  - `solve`'s refusals each say what to do instead.
  - Unknown node references are refused with the list of nodes the drawing does have.
- **Checks on writing:**
  - Relations recorded as SVG comments are reported with their current delta.
  - A `write_image` with `assert` always writes and reports a result for every relation, including ones it couldn't evaluate.
  - A `write_image` without `assert` does no render at all.
- **Deployments and surface:** a deployment with no browser still offers all three operations and refuses them with a sentence giving the reason. The three authoring rules appear in `write_image`'s description, and the new operations are listed as read-only.

**Gaps filled from the code:** five decisions are recorded under the story's `## Reconciliation Decisions` heading:
- **Relation syntax:** the one form a relation can be written in.
- **Pass threshold:** a relation holds when it is within 0.05 units.
- **`solve` limits:** which node kinds it can move and when it refuses.
- **Hidden fields:** the internal fields stripped from what the model sees.
- **Anchor count:** the commit message and a code comment say "fifteen named lines", but REQ-209's table names 17 anchors and the code matches the table. That's a wording slip, not a code bug.

I found no places where the code contradicts the intent.