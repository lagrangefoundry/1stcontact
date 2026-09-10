---
uid: acceptance_criterion-5334b71f
id: AC-1623
type: acceptance_criterion
title: 'Page-level slot binding: every mounted module names a live, unique seam, and
  each failure carries a path'
created_by: martin-github@westhead.me
created_at: '2026-09-10T12:01:30.944176+00:00'
updated_at: '2026-09-10T13:22:06.881255+00:00'
completed_at: null
last_field_updated: uat_coverage
status: pending
fields:
  story_uid: story-179b8c06
  kind: behavior
  regression_only: false
  uat_coverage: fail
---

## Criterion

Beyond validating a module instance in isolation, validating a **page** that
carries both `modules` and `l1` checks that every mount actually resolves. The
rule is one-directional on an L1 page: **every module mounted there must name a
live, unique seam; a seam need not attract a module.** A module on a page with
no L1 document names no seam at all.

Five shapes are rejected, each with a machine-readable path an AI caller can
self-correct from — never a silent no-op:

1. **Unbound module beside an L1 body** — a module that names no slot, reported
   at that module's `slot` path, with the available seam names in the message.
2. **Dangling slot name** — the module names a seam absent from the tree,
   reported at that module's `slot` path.
3. **Double-bound seam** — two modules naming the same seam, reported at the
   second module's `slot` path.
4. **A `slot` named on a page with no `l1`** — there is no page body to mount
   into, reported at that module's `slot` path.
5. **Duplicate slot names in the tree** — a mount point must be unambiguous;
   reported at the page's `l1` path rather than at any module.

Two states are legal and must validate:

- **Both empty** — the starter page, no modules and no L1 document.
- **An orphan seam** — a `slot` in the tree that no module binds. It is not an
  error; it renders as the inert placeholder STORY-83 emits.

## Verification

Validate a page carrying an L1 document with a seam plus a module bound to it and
confirm it is accepted. Then validate one page per rejected shape above and
confirm each fails with a message identifying the specific defect and an error
path pointing at the offending module's `slot` (or, for the duplicate-name case,
at the page's `l1`). Finally validate the two legal states — a page with neither
modules nor L1, and a page whose L1 tree carries a seam that no module binds —
and confirm both are accepted.