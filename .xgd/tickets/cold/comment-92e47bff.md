---
uid: comment-92e47bff
id: COMMENT-558
type: comment
title: Comment on request REQ-104
created_by: xgd
created_at: '2026-07-28T17:38:35.784984+00:00'
updated_at: '2026-07-28T17:54:15.427581+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-d67ea520
  kind: chat_transcript
---

<!-- xgd-turn id="c77e5069-8b5d-4ea5-b637-737dc63acc6b-user" -->

<!-- xgd-chat role="user" ts="2026-07-28T17:38:33.565810+00:00" -->
#### You
Please free code this ticket

<!-- xgd-turn id="c77e5069-8b5d-4ea5-b637-737dc63acc6b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-28T17:54:15.398446+00:00" -->
#### Claude
I'll start by reading the ticket and understanding the current L1 schema and renderer.

Now I'll implement. Starting with the schema:

Now the container node type and schema:

Now the shared resolver and types:

Now the envelope validator:

Now the renderer:

Now the container case and the layout-mode helper:

Now re-add the visibility emission at the end of `emitNode`, and sort media blocks:

Now the analytic evaluator in probes:

Now let me build and run the existing suite to check nothing regressed:

Clean. Now the full test suite:

Now let me write the UAT suite:

Let me screenshot the collapsed page at mobile and desktop to confirm it looks right:Now the ticket. Reading the current body first, then appending the implementation record:

Done. REQ-104 is at `free_coded` with commit `83b9a68`.

## What landed

**`container.responsiveLayout: { keyframes: [{ at, value }] }`** — shape (b), the one that closes the hole. First keyframe is the base, each later one a `min-width` override. `at` is a **free breakpoint, not a captured sample**, so unlike geometry/scalar tracks it is deliberately *not* constrained to `doc.widths` — a layout mode is an authored design decision that snaps at a width the capture may never have visited. That's what lets xgd.dev keep its 520px CTA breakpoint. The envelope requires `layout` to agree with the widest keyframe, so the representative value can't drift.

**`container.wrap: boolean`** — shape (a), the cheap complement. The mode's CSS is restated *whole* at each breakpoint rather than as a delta, so a wrapping row that becomes a stack can't inherit a wrapping column.

Two things the axis forced out:

- **`resolveLayoutMode`** in site-schema — one cascade the renderer and the analytic evaluator both call. Reading the static `layout` in `probes.ts` would have modelled a mobile-stacking container as a row at 375 and reported phantom findings.
- **Media blocks now serialize by ascending `min-width`.** They were ordered by first appearance across the document, so a node emitting 768 before another emitted 520 put 520 *after* 768 — and any node declaring both cascaded backwards at wide widths. Latent while everything keyframed on the same ladder; live the moment two authored breakpoints interleave. Visibility is also emitted last now, so `display: none` outranks a track that would re-show the node.

**xgd.dev**: four duplicated pairs collapsed (the three named plus `contract-panels`, same shape). Three had byte-identical children so the collapse is exact; the CTA pair took the stack twin's centred labels, which are a no-op in row mode. **172 → 122 nodes.** Clean at 375/768/1280 and under perturbation; I rendered and looked at both mobile and desktop.

Two things I deliberately left: the beta-capture form is still authored single-column (AC2 is proven end-to-end through `1c render`, but redesigning the form is a design call, not this ticket), and per-breakpoint grid `columns` is out of scope.

889 tests pass (878 + 11 new), typecheck clean.

<!-- xgd-chat-end -->