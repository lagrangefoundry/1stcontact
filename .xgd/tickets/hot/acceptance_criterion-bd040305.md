---
uid: acceptance_criterion-bd040305
id: AC-810
type: acceptance_criterion
title: The generated site stylesheet carries module chrome and no component source
created_by: xgd
created_at: '2026-08-06T01:33:29.133822+00:00'
updated_at: '2026-08-31T11:05:08.457745+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-179b8c06
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
A behavior module's invariant-element presentation is a **real stylesheet beside
the component** — an ordinary CSS file, not a block embedded in the component's
own source — and the stylesheet generated for a site contains each module's
chrome rules from those files and nothing else from the module.

- The site stylesheet is composed from each catalogued module's stylesheet in
  catalog order, each preceded by a header naming the module it came from. It
  therefore contains no `import` statement, no props/interface declaration and no
  HTML element markup: there is no component source anywhere near the
  composition, so the class of defect where a component's own code is folded in
  as if it were CSS cannot occur rather than merely being guarded against.
- The composition reads its bytes at **build time** into a committed artifact, so
  the site stylesheet can be assembled in a runtime with no filesystem — and a
  site that mounts no behavior module still gets its stylesheet, because the fold
  runs for every site.
- That artifact is **pinned against drift**: re-reading the module stylesheets
  from source and re-composing yields exactly what the committed artifact holds,
  so a stale artifact is a failing check rather than last week's chrome served
  with nothing to signal it.
- The move from an embedded block to a file was **verbatim**: the generated
  stylesheet is byte-equivalent to what the embedded block contributed, modulo
  the dedent from leaving the block. It adds no rule, and it does not reintroduce
  any of the aesthetic declarations the zero-CSS obligation removed — no field
  surface class, and no `flex-basis` declaration (both stylesheets *name*
  `flex-basis` in a comment explaining why they do not set it, so the check
  anchors on a declaration, not on the word).

## Verification
Generate a site's stylesheet with both survivor modules in the catalog and assert
it contains each module's chrome rules, exactly one block per catalogued module,
and no `import ` / `interface ` / `<section` / `<ul` text. Assert each block is
byte-equal to the trimmed contents of that module's own stylesheet file. Assert
no `flex-basis` declaration and no contact-form field class appears. Re-compose
the artifact from the module sources and assert it equals the committed one.
Render a site that mounts no behavior module and assert its stylesheet is still
produced with the module chrome folded in.
