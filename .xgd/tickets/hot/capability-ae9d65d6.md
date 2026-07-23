---
uid: capability-ae9d65d6
id: CAP-70
type: capability
title: L1 Layout Substrate + Safety Envelope
created_by: xgd
created_at: '2026-07-22T19:31:01.511990+00:00'
updated_at: '2026-07-23T07:56:24.336606+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  name: l1-layout-substrate
  uat_coverage: pass
---

# Capability: L1 Layout Substrate + Safety Envelope

The single low-level, CSS-faithful **L1 layout substrate** that replaces the
former semantic layout modules (post framework-pivot, REQ-79). A site's layout
is a typed element tree — box / text / image / slot leaves and stack/row/grid
containers — where every value is a typed literal or a closed enum, never a
freeform CSS/HTML/JS string.

Its value is a **safety envelope by construction**: security, robustness, and
cross-browser fidelity — not aesthetic rails. Two layers enforce the invariant
"a site definition is edited, stored, and rendered as structured data only":

- an **envelope validator** that admits only in-range, in-shape documents; and
- a **single safe renderer** that is the only path from an L1 tree to markup,
  re-checking and neutralising every value at emit time.

Per-viewport geometry keyframes (interpolate | snap) express responsive layout,
and a round-trip identity gate wired to the capture/values-diff spine measures
`capture(render(L1)) ≈ L1` on the authored axes.

Stories under this capability document the typed shape, the validation envelope,
the safe emitter, geometry compilation, and the round-trip / cross-browser
fidelity guarantees.