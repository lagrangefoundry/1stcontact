---
uid: comment-b30cc437
id: COMMENT-859
type: comment
title: Claude response for overlap_resolution report
created_by: xgd
created_at: '2026-08-09T01:21:38.373573+00:00'
updated_at: '2026-08-09T01:21:38.373573+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-5e5402aa
  kind: note
---

Cluster 4 resolved. **Both stories confirmed in place — no reassignment, merge, or archive.**

## What the cluster was

The survey flagged STORY-76 (gradients: *captured, authored, and diffed*) in CAP-63 against STORY-80 (absolute values in L1) in CAP-70, and named the missing rule exactly: *does a new value axis follow the driver that demanded it, or the layer that renders it?*

## Decision and why

The rule is **the layer that renders it** — and once stated, the matrix already conforms. The survey's premise turned out to be factually wrong against the code:

- It reads STORY-76's authorable half as "a typed value axis reaching the browser through the L1 renderer." It isn't. `resolveSurfaceGradient` is defined in `packages/framework/src/modules/text-style.ts` and appears **nowhere** under `packages/framework/src/l1/` — the L1 renderer never calls it. AC-638's counterpart validates a *module content payload*, not an L1 document.
- The live L1 gradient axis does exist (`l1LinearGradientSchema`/`l1RadialGradientSchema`, `surfaceGradient`/`gradientFill` in `packages/framework/src/l1/render.ts`) — and is **already filed in CAP-70**, on STORY-83, not on either cluster story.
- The two stories actually paired are the cleanest part: STORY-76 owns what a gradient *is* (direction, ordered stops, offsets); STORY-80 owns what a colour *may be* (literal or palette reference) at every sink, gradient stops included per AC-928. One intersection point, two different axes of it, no duplicated AC.

Reassigning STORY-76 would have moved three capture-and-compare ACs out of the capture-and-diff capability to buy a better home for two ACs pointing at a module seam CAP-70's post-pivot scope doesn't want either.

## Ticket change

One additive amendment to **CAP-63** (4629 → 6425 chars), following the precedent cluster 3 set on this same capability: the gradient scope bullet no longer claims unqualified "authorable", and a new *"a value axis follows the layer that renders it"* ownership rule states the mechanical test (reaches the browser via `packages/framework/src/l1` → CAP-70's). Without it the confirm would leave the matrix byte-identical to what the survey flagged, and the next survey would re-raise the cluster.

## Flagged, not actioned

AC-637/638 are **stale, not misfiled** — their subject (module content-field gradient, `text-block` panel, `var(--color-<role>)` stops) was superseded by REQ-84/96/114, and two of the three test functions under them still carry unreconciled `test_UAT_FC_REQ-62_*` names. That's a content-currency question for reconciliation; overlap resolution may not modify story content outside a merge.

Verified: both stories carry one unchanged `capability_uid`; AC counts re-queried post-amendment at 5 and 6, unchanged; no AC moved, so no test renaming is required. Report **REPORT-1713** (`report-5e5402aa`) created with `cluster_id: "4"`, `report_kind: overlap_resolution`, result `pass`.
