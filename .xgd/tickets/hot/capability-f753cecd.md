---
uid: capability-f753cecd
id: CAP-86
type: capability
title: 'Structured Copy Editing: One Validated, Atomic Write Path'
created_by: xgd
created_at: '2026-08-07T02:00:22.295360+00:00'
updated_at: '2026-08-07T19:40:57.352575+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  name: Structured Copy Editing
  uat_coverage: pass
---

Changing the words on a page is a **structured, whole-or-nothing, validated
change to the site definition** — never an edit to rendered markup, and never a
second mechanism beside the one the AI uses.

This capability owns the contract that makes an edit addressable and safe:

- the address of an editable region, its strict parse and its single resolution
  rule (a document and a behavior module's slot resolve the same way);
- which fields a region exposes — plain words and nothing else, so no control
  this surface can offer is capable of carrying raw HTML or CSS;
- the application of one change map as one diff, validated over the *whole*
  resulting definition by the same validator every other structured-edit
  command runs, and written only if it validates;
- the structured refusal — code, path, hint, exit status, machine-readable
  envelope — that a caller branches on without parsing prose.

Two producers share this one path: the operator clicking words in the builder
workspace, and the AI acting on the operator's instruction. Neither has a
private route to the draft.

Out of scope: how a click becomes an address in a browser (the editor gesture),
the chrome that hosts it, and the rendering that stamps addresses onto elements.