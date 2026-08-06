---
uid: comment-ab28488b
id: COMMENT-686
type: comment
title: Claude response for reconciliation_uat_generation report
created_by: xgd
created_at: '2026-08-06T01:40:25.790835+00:00'
updated_at: '2026-08-06T01:40:25.790835+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-f062f8cf
  kind: note
---

All four new UATs pass. The two failures in `tests/req96-control-composition.test.ts` are pre-existing and unrelated: `storage/references/` does not exist in this worktree at all, so the two FC tests that fold the retained gigabytealchemy capture oracle cannot run here. I made no runtime changes (`git status` shows only the new test file).

**Coverage decision:** nine of this story's thirteen ACs (AC-697…AC-704, AC-722) already carry `uat_coverage: pass` with UATs in `tests/reconciliation-behavior-modules.test.ts`, which I confirmed green (10 tests). The four uncovered ACs — AC-808, AC-809, AC-810, AC-811 — are the ones I wrote, one UAT each.

What each exercises, at the real boundary:

- **AC-808** — `validateBehaviorControls` / `resolveControlNames` from the framework package root, on both survivors: per-item roster follows configured field names, per-subtree roster follows mounted slide count, invariants absent from the roster; then all four cases (fully bound → zero; undeclared name → slot-scoped violation naming the alternatives; required `field` unbound → `controls.field` violation; naming `label`/`honeypot`/`turnstile` → undeclared).
- **AC-809** — every rule the two modules contribute, parsed to selector+body: contact-form selectors are all wrapper chrome or declared invariants, and `padding`/`border` survive *only* as `0`; carousel dot rules carry `opacity` and nothing sizing or colour; `flex-basis`, `gap:`, `border-radius`, `align-self`, `background` absent. Then SSR renders: each invariant element carries `data-fc-invariant`, the current-slide marker is present with no style, and binding an invariant is refused.
- **AC-810** — runs the real pipeline (`cmdNew` + `cmdRender` in a tmpdir) with both survivors mounted, and asserts against the written `theme.css`: chrome present, no `import`/`interface Props`/`Astro.props`/`set:html`/element markup, and carousel's full chrome block intact on both sides of its self-closing per-instance tag.
- **AC-811** — the L2 preset for a mixed visible/placeholder/textarea config: valid L1 inside the envelope, binds one control per field plus submit so `validateBehaviorInstance` is clean, label runs only for visible-labelled fields, textarea taller, flowed not keyframed, all eight design constants overridable, and a rendered form painted entirely from preset axes with no module chrome class.

```
UATs generated for story story-179b8c06 (plan item 2 of 12)

Story: story-179b8c06
Test file(s) created:
  - tests/reconciliation-behavior-l1-composition.test.ts

Tests written: 4
Tests passed: 4
Tests failed: 0

test_files_created:
  - "tests/reconciliation-behavior-l1-composition.test.ts"
```
