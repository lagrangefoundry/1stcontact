---
uid: capability-36dd68c5
id: CAP-64
type: capability
title: 1c Gradient Fidelity
created_by: xgd
created_at: '2026-07-19T02:27:46.207925+00:00'
updated_at: '2026-07-19T02:27:46.207925+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  name: gradient_fidelity
---

# Capability: 1c Gradient Fidelity

Gradients are a first-class **value** in the `1c` reproduction toolchain — captured
from a reference site, authorable in a module's content, and diffable — spanning
both **text-fill** gradients (a wordmark painted with `background-clip: text`) and
**panel/card surface** gradients (a section or card whose background is a sweep).

A captured gradient records its direction (angle) and its ordered colour stops,
including each stop's *position offset* where one is present. `1c values-diff`
compares gradients as an axis of the fidelity gate — direction, stop colours, and
stop positions — so the animating invariant of [[values_diff_fidelity]] holds for
gradients too: a clean values-diff means the reproduction's gradient genuinely
renders like the reference (no "orange too soon" stop drift, no silently-missing
panel gradient).

On the authoring side a gradient is a standalone content-field value: a module's
panel/card surface can take a gradient fill, with each stop colour an absolute
literal or a palette-role overlay, reproducing a captured surface gradient.

Stories under this capability document the captured gradient shape, the gradient
comparison axes and tolerances, and the gradient authoring value.
