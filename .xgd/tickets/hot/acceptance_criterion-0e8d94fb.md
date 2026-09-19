---
uid: acceptance_criterion-0e8d94fb
id: AC-1828
type: acceptance_criterion
title: Re-folding a bundle with no retained oracle is refused, naming the bundle and
  the remedy
created_by: martin-github@westhead.me
created_at: '2026-09-19T13:37:27.270449+00:00'
updated_at: '2026-09-19T13:37:27.270449+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-177897a0
  kind: behavior
  regression_only: false
---

## Criterion

Re-folding a bundle that holds no retained multi-viewport oracle — the ordinary
state of a bundle captured before the oracle existed — is **refused**, and the
refusal names both the bundle and the remedy (re-capture) rather than surfacing
as a parse failure on an absent artifact.

## Verification

Take a handle on a bundle with nothing written into it, run the re-fold, and
assert it rejects with a message containing the bundle's own name and containing
the word that names the remedy.
