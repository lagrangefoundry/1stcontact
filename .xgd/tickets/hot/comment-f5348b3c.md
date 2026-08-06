---
uid: comment-f5348b3c
id: COMMENT-688
type: comment
title: Claude response for reconciliation_uat_generation report
created_by: xgd
created_at: '2026-08-06T02:31:52.558705+00:00'
updated_at: '2026-08-06T02:31:52.558705+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-f379333d
  kind: note
---

All six UATs pass, the file adds zero `tsc` errors, and no runtime or existing test files were touched.

## Scope note

The story has 23 ACs. Fourteen already have UATs in three sibling files (`reconciliation-l1-substrate.test.ts` → AC-682/683/684/685/686/687/688/723; `reconciliation-l1-language.test.ts` → AC-725/726/727/728; `reconciliation-l1-shared-axis-groups.test.ts` → AC-685/801/802/803/804/805). Since the prompt forbids modifying existing test files and mandates one test per AC, I wrote UATs for exactly the **six uncovered ACs** — the REQ-96 control-leaf inversion and the REQ-103 texture/radial-gradient upgrade.

## What each UAT pins

- **AC-806** — `renderL1Fragment` through the real `contactFormControls` roster: the module's `<input>`/`<textarea>`/`<button>` emit with `type`/`name`/`required`/`id`/`placeholder` intact while class, geometry, fill, border, radius and text axes come from L1; the appearance reset is asserted **positionally ahead of** the authored declarations (so authoring wins); the `::placeholder` rule points at the control's own colour; empty and partial rosters emit no element and no rule, with the sibling run unaffected.
- **AC-807** — `class`/`style`/`on*`/malformed attribute names refused; payload values pinned as their **exact escaped form** (`placeholder="&quot;&gt;&lt;img …&gt;"`), so they cannot close an attribute or open an element; control nodes reject unknown keys and an off-allowlist `backgroundImageUrl`; `assertSafeUrl` still throws `ContentSafetyError` on an unsafe endpoint; the label↔control `id` association is unmoved.
- **AC-829** — dots/grid/lines each drawn from typed fields (disc radius = half the declared diameter, two axis layers for a grid on one period, a self-periodic tilted `lines` layer), no `url(`, defaults 2px/1px, tilt inert on non-`lines`, period follows the author, document clears the envelope.
- **AC-830** — radial emits both keywords from closed enums; omitted origin/extent fall through to browser defaults; a freeform origin and a radial-with-angle are both schema-rejected; linear stays the implicit default with or without the discriminator; a linear may not borrow radial-only axes.
- **AC-831** — five axes paint as `scrim → texture → wash → image` over the fill, with the sizing triple emitted positionally; untextured backdrop keeps the single-valued `cover`; a sizing-indifferent surface emits none; every shipped untextured page still renders single-valued `background-size` (guarded by a `checked > 0` assertion so it can't pass vacuously).
- **AC-832** — sub-pixel and oversize periods, oversize width and out-of-range tilt each rejected **with the offending path**; closed-set/hex/unknown-key/missing-period all refused; an interaction-state `pattern` delta rejected by the identical shared rule; the renderer saturates a rule wider than its own period.

## Pre-existing failures (not caused by this work)

The full suite has **8 failures across 7 files**, all present before my change (my only diff is one untracked file):

- `req96-control-composition` (×2) and `bug17-fold-padding` — `storage/references/gigabytealchemy.ai/` fixture is absent in this worktree (`ENOENT`).
- `reconciliation-1c-astro-free-render` — `InvalidDefinitionError`: module `gallery` names no L1 slot.
- `reconciliation-l1-interaction-and-motion` (AC-820, story-d2b5cb1c) — the validator reports `/root` instead of the nested `/root/interaction/hover` path for unknown keys, so that story's path-precision assertions fail.
- `reconciliation-3probe-gate`, `reconciliation-3probe-gate-evaluator`, `req101-font-registry` — reference-bundle/asset dependent.

```
UATs generated for story story-d0a8cfad (plan item 5 of 12)

Story: story-d0a8cfad
Test file(s) created:
  - tests/reconciliation-l1-control-and-texture.test.ts

Tests written: 6
Tests passed: 6
Tests failed: 0

test_files_created:
  - "tests/reconciliation-l1-control-and-texture.test.ts"
```
