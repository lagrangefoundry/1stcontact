---
uid: request-b94426f4
id: REQ-66
type: request
title: 'adopt-values: mechanically copy reference Type-A flat values into the draft'
created_by: xgd
created_at: '2026-07-18T00:43:03.830908+00:00'
updated_at: '2026-07-18T00:54:37.931894+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  commits:
  - working_sha: 98ea504482736fdd60cc05bd46007a61ae9c52a5
    reconcile_sha: null
    main_sha: null
  version: 0.0.141
---

## Goal

`1c adopt-values <slug> --ref <bundle>` — mechanically COPY the reference's **flat
Type-A** values into the matching **styled content objects** of the draft. The
"copy" half of the [[REQ-64]] repair order (A-flat → A-structural → B): where a
Type-A value is a clean per-node paste, snap it exact instead of eyeballing it.

## Why

Type-A flat values (colour, weight, line-height, letter-spacing, single-width font
size, font-style on a styled text object) are author-set and constant across the
viewport ladder — a difference to COPY, not tolerate. Doing this by hand is tedious
eyedropper work. Automating it lets the operator spend attention on structure and
the Type-A *structural* / dial / markup decisions that are NOT mechanical.

Dual of `values-diff`: the gate REPORTS `[A]` deltas; this REPAIRS the mechanically-
fixable subset. What it cannot adopt (dial/theme-derived, prose per-run) is left for
the diff to keep flagging — a focused authoring list.

## Interface

```
1c adopt-values <slug> --ref <captureBundleDir> [--dry-run | --apply]
                       [--axes color,fontWeight,…] [--scope styled-objects|+prose]
                       [--json] [--sandbox]
```

- `--dry-run` is the DEFAULT (it mutates the draft; writing is opt-in via `--apply`).
- `--axes` restricts the adopted axes; default = the safe flat set.
- `--scope styled-objects` (default) touches styled text objects only; `+prose` also
  adopts single-run body blocks (riskier — sibling runs can disagree).

## Guards (always on — from the REQ-64 prototype's misfires)

1. **flat-only** — never adopt an axis whose reference value VARIES across the ladder
   (that is structural — a responsive ramp; pasting the desktop scalar breaks mobile).
2. **skip `color` on gradient / `colorInferred` nodes** — the solid colour is the
   transparent base, not the paint (this turned the gold wordmark black in the proto).
3. **only touch axes the target style already authors** — never introduce a new axis.

## Scope (v1)

- Match draft styled objects (heading/title/eyebrow/subhead/label; `subhead`+`subheadStyle`)
  to reference nodes **by normalized text** against the persisted ladder.
- Adopt flat axes: `color`, `fontSizePx`, `fontWeight`, `lineHeightPx`, `letterSpacingPx`,
  `fontStyle`.
- Out of scope v1: dial/theme-derived values (surfaceFill, border, radius, opacity —
  no per-node slot), prose per-run markup, and authoring the A-structural ladder.

## How it fits the workflow

capture → author structure → **adopt-values --apply** → values-diff --multi-viewport
(residual = A-structural + dial-A-flat + B) → author ladders/dials → re-diff → read B.

On a fresh repro it does real work; on a hand-faithful one (gigabytealchemy) it copies
0 — a clean bill of health for the styled objects. See runbook [[DOC-19]] pass 4 and
[[typea-typeb-repair-order]].