---
uid: acceptance_criterion-95697465
id: AC-1273
type: acceptance_criterion
title: Every field marked unavailable carries a plain-English reason, and no field
  is marked unavailable without one, on every region of every stored site
created_by: xgd
created_at: '2026-08-20T02:57:20.815550+00:00'
updated_at: '2026-08-20T03:25:23.278425+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-37a3921b
  kind: behavior
  regression_only: false
---

## Criterion

Wherever this surface marks a field **unavailable**, it also says **why**. The
two are one answer, not two: no region, on any page of any site in the store,
ever reports a field marked unavailable without a reason accompanying it, and no
reason is reported for a field that is not unavailable.

The sentence is **plain English** and names what the element is doing and how to
get it changed — never the internal name of a parameter — because the reader it
is written for is the person editing the site, and "ask me in chat" is the only
route they have.

It is carried on the field itself, so every reader of the derivation gets the
same sentence: the browser that draws the row, the command line that lists the
region's fields, and the AI's own tool surface. None of them can offer a control
it will then be refused for, and none of them can offer a different explanation.

## Verification

Walk every region of every page of every site in the store, request its fields,
and assert of each returned field that it is marked unavailable if and only if it
carries a reason, and that no reason is an empty string. Assert the same answer
through the command line and through the builder origin, so the pairing is a
property of the derivation rather than of one reader. Include in the walk a run
whose family declares no faces at all, and assert its italic control is neither
unavailable nor carrying a reason — the sweep must be able to fail.