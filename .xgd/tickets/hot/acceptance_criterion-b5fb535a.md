---
uid: acceptance_criterion-b5fb535a
id: AC-1641
type: acceptance_criterion
title: The layout reference names every element kind with its closed value sets, and
  the limits every page is held to
created_by: martin-github@westhead.me
created_at: '2026-09-11T02:36:11.107602+00:00'
updated_at: '2026-09-11T02:51:26.658155+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-5836022a
  kind: behavior
  regression_only: false
---

## Criterion

The layout reference names every kind of element a page may contain, each under
its own heading, with the fields that kind accepts, whether each field is
required, and — where a field's values are a closed set — those values written out
rather than a type name alone. It also states the limits every page is held to,
naming each limit and its bound, and that a page outside them is refused whole
rather than silently clamped.

The element kinds and their value sets are read from the schemas the validator
itself enforces, so a reader is never told about a value the validator stopped
accepting.

## Verification

Read the layout reference and check it against the element schemas rather than
against a list in the test: every element kind declared in the schema union
appears under its own heading; a field with a closed value set has those values
written out in the document; the section stating the page-wide limits is present
and names each declared limit. Declaring a new element kind in the schema and
regenerating adds it to the document.