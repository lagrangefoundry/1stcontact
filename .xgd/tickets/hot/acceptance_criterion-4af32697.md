---
uid: acceptance_criterion-4af32697
id: AC-1661
type: acceptance_criterion
title: The derived index lives in private storage under the account's own location,
  outside every servable and attachment namespace
created_by: martin-github@westhead.me
created_at: '2026-09-11T03:30:37.337135+00:00'
updated_at: '2026-09-11T03:43:39.806512+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-5281f009
  kind: behavior
  regression_only: false
---

## Criterion

The index derived from a client's material is stored in private storage, under a
location derived from the account, and that location lies outside everything the
public internet is served from and outside the namespace attached files are
addressed in. Two accounts cannot collide there and neither can name the other's
location. The index is not carried in the deployed release artefact.

An index over private material is a derivative of it — a vector per brand
guideline, a body snippet per positioning paper — so it must live where nothing
can serve it and where no attachment reference can reach it.

## Verification

Bring an account's index up to date and assert its stored artefacts are present
under that account's private location. Assert the store that serves site bytes to
the public internet holds nothing under the knowledge location. Assert the
location derived for one account differs from that derived for another, and that
it falls outside the prefix attached files are addressed under.