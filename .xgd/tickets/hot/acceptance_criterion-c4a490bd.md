---
uid: acceptance_criterion-c4a490bd
id: AC-1697
type: acceptance_criterion
title: Every material records exactly one of six description outcomes and who produced
  the description, so a re-describe pass is a query
created_by: martin-github@westhead.me
created_at: '2026-09-11T04:23:35.539736+00:00'
updated_at: '2026-09-11T04:35:57.714294+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-4cabde9a
  kind: behavior
  regression_only: false
---

## Criterion

Every described material records **exactly one of six outcomes** and **who produced the
description**, so that material needing another attempt later is selectable by predicate rather
than found by convention.

- The six outcomes are: described; no describer configured; nothing extractable; a type nothing
  here can read; an image past the ceiling for looking at one; and a describer reached that
  failed. Every material carries exactly one of them, including the successful case.
- The describer is recorded alongside on every material: an identity where something described
  it, and an explicit empty value where nothing did — never absent, so a predicate over it never
  has to treat absence as a third state.
- Selecting material by outcome returns exactly the material with that outcome: asking for
  everything that has no real description (no describer configured, or a describer that failed)
  returns those and not the honest accounts (nothing extractable, unreadable type, past the
  looking ceiling).

## Verification

Ingest one material of each of the six outcomes, then query the stored material by outcome:
assert each query returns exactly its own set, that every record carries an outcome and a
describer key, and that the describer is an explicit empty value on every degraded record and a
non-empty identity on every described one.