---
uid: comment-0bef042d
id: COMMENT-363
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-07-23T09:41:48.679697+00:00'
updated_at: '2026-07-23T09:41:48.679697+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-73343321
  kind: note
---

Assessment complete. Report **REPORT-823** created.

## Verdict: FAIL — Framework Absolute-or-Overlay Value System (level=story)

**1 violation, 1 warning, 0 needs_review**

### The finding
The capability's only story (**STORY-80**) is correctly aligned to cumulative intent — it re-homes the absolute-literal base to the L1 substrate and correctly scopes the named-overlay out of L1. I verified its substrate claim against code (`schema.ts`: `l1Color` hex-only, `finite` numbers, `borderRadiusPx` nonnegative; the only union is the node-`kind` discriminant, not a value `absolute OR role` union).

The drift is in the **capability container body (CAP-67)** itself:

> **Violation (consistency, capability-body-edit):** CAP-67 still frames the capability as "value-typed dial on a site-definition **module**" and lists concrete examples — card accent, per-card check tick, footer text/link, submit fill, surface/panel/submit/scrim treatments, logo size. These are **module dials that REQ-84 deleted** (reconciled, merged `edeb1c2c`), and the named-overlay is the **L2 design library that REQ-79 #4 parked** ("possibly never needed"). The body asserts delivery that reconciled intent retired.

Plus a **warning**: STORY-80's title still says "…or a named overlay," over-promising relative to its body (delivers the literal base only).

### The ambiguity I resolved rather than escalated
The "named overlay" half initially looked like either a coverage gap or a `needs_review`. Reading REQ-79's full body settled it decisively: principle #1 ("aesthetics… **not enums/palettes/presets**") and #4 ("**L2 = PARKED, possibly never needed**") make the overlay a deliberately-parked affordance — not unexpressed active intent. So no coverage gap, no guess. Had I stopped at the story body I'd have wrongly flagged `needs_review`; the intent history was the deciding source.

The fix is a capability-body rewrite (re-home onto the L1 leaf axes actually shipped; drop the deleted-module examples; mark the palette/overlay as parked L2), with an optional STORY-80 title tweak. **No AC/UAT/code changes are implied — the code is correct.**
