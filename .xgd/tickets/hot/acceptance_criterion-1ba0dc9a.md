---
uid: acceptance_criterion-1ba0dc9a
id: AC-1343
type: acceptance_criterion
title: A behavior module may accompany an L1 page only by binding by name to exactly
  one existing seam; every unresolvable binding is a rejection with a path
created_by: xgd
created_at: '2026-08-20T08:04:08.273673+00:00'
updated_at: '2026-08-20T10:09:01.736408+00:00'
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

A behavior module may accompany an L1 page, but only by **binding by name to
exactly one `slot` present in that page's L1 tree**. The rule protects the page
from two competing bodies without stranding the behavioural half of a
reproduction, where a captured page is routinely 100% L1 layout plus one
behaviour.

Binding is validated, never best-effort. Each of these is a **rejection carrying a
machine-readable path to the offending element**, not a silent no-op:

| Rejected | Why |
|---|---|
| a module on an L1 page that names no slot | it has no place on the page body |
| a module naming a seam absent from the tree | the mount point does not exist |
| one seam named by two modules | the mount point is contested |
| two seams in the tree sharing a name | the mount point is ambiguous — neither module can be resolved onto it |
| a module naming a slot when the page has no L1 tree at all | the name resolves against nothing |

Two cases are deliberately **legal** and must not be rejected:

- **A seam no module binds.** That is an unfilled mount point, and it renders as
  the inert labelled placeholder (AC-723 / STORY-83). Requiring every seam to be
  filled would make an L1 tree undeclarable ahead of the behaviour that fills it.
- **A page with neither modules nor an L1 tree** — the empty starter.

The seam inventory this resolution reads is the tree's slot names **in document
order with duplicates preserved**. Deduping the walk would erase the duplicate-name
case entirely, so the ambiguity would render rather than being reported.

This criterion is about *whether* a binding is valid. What the renderer emits once
a binding has been proved — the `mounts` map, and the fragment being emitted inside
the seam's own positioned box — is STORY-83's (AC-723).

## Verification

Validate a page carrying an L1 tree plus a module instance, exercising each row of
the table above and each legal case:

1. A module bound by name to a seam that exists exactly once → **accepted**.
2. A module on an L1 page with no slot named → **rejected**, with the issue path
   pointing at that module's `slot`.
3. A module naming a seam that is not in the tree → **rejected**, path at the
   module's `slot`.
4. Two modules naming the same seam → **rejected**, path at the second module's
   `slot`.
5. A tree containing two seams with the same name → **rejected**, path at the L1
   document.
6. A module naming a slot on a page with no `l1` at all → **rejected**, path at
   that module's `slot`.
7. An L1 tree with a seam no module binds → **accepted**, and the seam renders as
   the empty labelled placeholder.
8. A page with no modules and no L1 tree → **accepted**.

Confirm each rejection surfaces as a validation issue with a path locating the
offending element, rather than a dropped module or a rendered page missing its
behaviour.