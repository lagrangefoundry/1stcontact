---
uid: comment-c99cbf68
id: COMMENT-2628
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-09-10T23:00:16.502182+00:00'
updated_at: '2026-09-10T23:00:16.502182+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-388c3cff
  kind: note
---

Done. Report **REPORT-3812** (`report-388c3cff`) filed: `progress_made: true`, `needs_more_work: false`, `violations_remaining: 0`.

## What changed

Both violations and both warnings were `story-body-edit`, and the assessor's note that neither body had been touched in this cycle was accurate — both now read `last_field_updated: body`, verified by re-fetching from the store after the writes.

**STORY-98** (`story-af36c2cb`) — 2 passages:
- Out-of-scope non-goal rewritten. "It is a local render channel; the published and preview channels remain the only shipped ones" is gone; it now says the edit channel is never published and never reaches a site visitor, and is reachable only through the operator-gated builder origin that renders it per request (REQ-145 + REQ-147).
- "A third channel" now leads with *render mode* — never published, never content-addressed, never in revision history — with the output-location claim **kept** ("where it is materialised it lands in its own output location") because AC-958 rests on it and `1c render --edit` still writes there, and the per-request path added beside it.

**STORY-101** (`story-3bf94bd4`) — 5 passages:
- Out-of-scope narrowed to REQ-136's own *Phase 2 — still open* list: zoom / true source-rect crop, tint or scrim over an `<img>`, background-surface framing, drag-driven crop handles, plus asset upload and image processing. Crop-pan, scale, rotation and shape are no longer denied.
- The three stale field-list passages folded framing in, and "kind-agnosticism proved three times" → **four**, with framing named as the strongest instance.

## Evidence

Verified both code claims before editing rather than taking the report at face value: `apps/control-app/src/router.ts:68` (`PREVIEW_CHANNELS = ['draft', 'edit']`) and `packages/site-schema/src/l1/edit.ts:833-851` (Fill mode, Pan across/down, Shape, Corner rounding, Rotate, Scale).

No AC added, edited or deprecated — the report's editor notes rule that out for both findings, and nothing here changes what an existing AC asserts. `uat_coverage` left alone on both stories; that field belongs to check/fix_uat_coverage. No code edits.

One process note: each replacement was applied by exact string match with a uniqueness assertion (abort unless exactly 1 match), and I inspected a unified diff before each write. That caught an intermediate slip — a command I intended as a no-op silently re-ran the extractor and reverted my first pass of edits — which is why the final edits went through a scripted patch rather than in-place editing.
