---
uid: comment-431315b0
id: COMMENT-526
type: comment
title: Comment on request REQ-97
created_by: xgd
created_at: '2026-07-27T16:47:48.843889+00:00'
updated_at: '2026-07-27T17:08:06.133426+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-6c2b1cf4
  kind: chat_transcript
---

<!-- xgd-turn id="1656ae5e-be81-4538-ba18-f498f345b205-user" -->

<!-- xgd-chat role="user" ts="2026-07-27T16:47:46.446035+00:00" -->
#### You
please fre code this ticket

<!-- xgd-turn id="4db6f1a0-6eb4-4c37-8e2c-8de87bd39400-user" -->

<!-- xgd-chat role="user" ts="2026-07-27T16:59:53.837549+00:00" -->
#### You
please fre code this ticket

<!-- xgd-turn id="4db6f1a0-6eb4-4c37-8e2c-8de87bd39400-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-27T17:08:06.101741+00:00" -->
#### Claude
I'll start by reading the ticket and the relevant code.

Now let me make the changes.

Now the analytic gate — it must mirror the renderer, since a text leaf's height is a function of its width:

Now the UAT file:

Now make the probe's width constraint generic, so a wrapper container and a measured run model identically:

Now update the ticket body to describe the implementation as it stands:

REQ-97 is free-coded and parked at `free_coded` (commit `094bf926`, v0.0.209).

**What changed**

| File | Change |
|---|---|
| `packages/site-schema/src/l1/schema.ts` | `l1TextSchema` gains `sizing: l1AxisSizingSchema.optional()` |
| `packages/framework/src/l1/render.ts:663` | the `text` case calls the existing `axisSizingCss` |
| `tools/generate/src/l1/probes.ts` | new `constrainWidth` narrows a node's frame by its own `sizing.width`, applied for every kind in `layout()` |

Two decisions the ticket left open:

- **`height` is admitted.** Accepting the shared `l1AxisSizingSchema` beats minting a width-only variant — one shape across all five kinds. The doc-comment says height on a run is rarely what an author wants rather than the type forbidding it.
- **The probe clamp is generic, not text-only.** A text-only clamp would have left the wrapper form and the direct form evaluating differently, which breaks the mirror invariant the analytic gate depends on. Generic also closes a pre-existing gap: a wrapper container's `max-width` was previously invisible to the probe.

**Evidence** — `tests/req97-text-measure.test.ts`, 5 UATs, all deterministic. Full suite green: **826 tests / 117 files**. Clean `tsc` across site-schema, framework, tools/generate, and both apps.

**One thing to note:** I collapsed the `sub-measure` wrapper in `storage/sites/xgd/draft/pages/home.json` and re-rendered — the container is gone and `max-width: 620px` now paints from the run. But **that site is still untracked in git**; it's REQ-95's work, so I edited it in the working tree and deliberately did not commit it under this ticket. It's yours to commit when you're ready.

<!-- xgd-chat-end -->