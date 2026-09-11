---
uid: acceptance_criterion-dc7bf9a3
id: AC-1656
type: acceptance_criterion
title: The corpus spans the whole account rather than one site, so a client's sites
  share what is known about them
created_by: martin-github@westhead.me
created_at: '2026-09-11T03:30:27.812900+00:00'
updated_at: '2026-09-11T03:43:40.529954+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-5281f009
  kind: behavior
  regression_only: false
---

## Criterion

The client's knowledge base spans the whole account and is not narrowed to one
site: its corpus is selected by record kind alone, with no site term. Knowledge
gathered while building one of a client's sites is therefore available while
building another of theirs.

This is a deliberate asymmetry with the account barrier. The account is a hard
wall; the site is not a wall at all. A site term added here would narrow the
corpus with no symptom other than an assistant that had forgotten the last site
it built for the same business.

## Verification

Assert the declared corpus for the client knowledge base is keyed on record kind
only and carries no additional selection term. With two sites under one account
and material recorded while working on the first, search while bound to the
account and assert the material is returned.