---
uid: acceptance_criterion-264af10d
id: AC-1523
type: acceptance_criterion
title: One declaration describes both knowledge bases, is the one in force, and is
  scaffolded whole
created_by: xgd
created_at: '2026-09-04T03:19:58.489668+00:00'
updated_at: '2026-09-04T03:32:04.798997+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-bb91191c
  kind: behavior
  regression_only: false
---

## Criterion

Both knowledge bases are described in a single declaration, and that declaration is the one in
force rather than a copy of it. Every property it states — the human description, which record
kinds are corpus members, whether the corpus is read from a shipped source or from the client's
own records, whether the landscape is authored or generated, and the corpus weight — is the
property the running system uses. Changing a stated property changes what the system does.

An installation that has no declaration is given one, and the generated declaration is identical
to the one the repository ships: a fresh checkout gets both knowledge bases complete, not only
the half the local host happens to serve.

## Verification

Read the declaration through the same path the running system reads it: the client corpus's
member kinds, its "reads the client's own records" stance (no shipped source stated), and its
generated-landscape stance all match the file. Alter a declared corpus member kind and observe
the selected corpus change accordingly — a hand-built copy would not. Separately, generate a
declaration into an installation that has none and compare it byte-for-byte with the shipped
file; they agree.