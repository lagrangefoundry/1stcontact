---
uid: bug-b9eb2e3a
id: BUG-6
type: bug
title: foldToL1 silently drops textless/box-less elements — must emit a signalled
  residual, not drop
created_by: xgd
created_at: '2026-07-23T02:01:15.309088+00:00'
updated_at: '2026-07-23T16:39:04.751423+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  severity: medium
  priority: high
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: a4eef9db46f98e4ef3b3ad38ba2fbd30ce9a4f4c
    reconcile_sha: null
    main_sha: null
  version: 0.0.178
---

Scope under [[request-7ff1bacd]] (REQ-88). This is the mechanism that makes
"language before folder" honest — see [[DOC-21]] (growth loop) and [[DOC-27]].

## Behavior (bug)
`foldToL1` (tools/generate/src/l1/fold.ts:130) does `continue` on every element
that is textless or lacks a box — images, form fields, pure-surface panels — and
also skips text runs without geometry. These values never enter `local` and the
gate sees them only as anonymous `unmatched` entries. The **drop is a capability
gap** (folder power); the **bug is that it is silent**.

## Fix direction
Instead of dropping, the folder emits a **structured residual** per element it
cannot yet express: `{ kind, reason, capturedAxes, width(s) }`. Residuals are
returned alongside the folded document and surfaced by the gate as framework-gap
signals (DOC-21). The residual list then *is* the proof of what the language +
folder still lack — the completeness signal for the whole effort.

## Coupling
Design lands with the folder rebuild (folder-power ticket), but tracked
separately because it is a defined behavior change (silent → signalled).

## Acceptance
No element is silently dropped; every unexpressed element appears as a typed
residual; gate report separates residuals from mispairing (see B1). Tests named
`test_UAT_FC_<this-ticket>_*`.


## Free-coding note (2026-07-23)
The signal-not-drop behavior (fold emits typed FoldResiduals; l1-gate keeps them
separate from probe mispairing/fidelity residuals) already shipped, baked into
REQ-92's folder rebuild (commit 9e92a339, owned by REQ-92). Acceptance items 1-3
(no silent drop / typed residual / gate separates residuals from mispairing) are
met in code. The remaining unmet clause is BUG-6's own: **tests named
test_UAT_FC_BUG-6_***. This ticket adds those UATs so BUG-6 has independent matrix
coverage of the contract — notably the gate-separation clause REQ-92's tests do
not exercise (they test foldToL1's collector directly, never cmdL1Gate).