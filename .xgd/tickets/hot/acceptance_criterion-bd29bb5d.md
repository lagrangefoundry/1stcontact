---
uid: acceptance_criterion-bd29bb5d
id: AC-1491
type: acceptance_criterion
title: The platform records client material as one of three named kinds, and the same
  vocabulary carries conversations and attached files
created_by: xgd
created_at: '2026-09-02T00:30:09.776619+00:00'
updated_at: '2026-09-02T00:42:26.227345+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-e07c589b
  kind: behavior
  regression_only: false
---

## Criterion

The vocabulary the store validates records against names, at minimum, all of the following, and a
record of each can be created through an account-scoped store:

- **material** — a single piece of client material: something uploaded, or background fetched on the
  client's behalf.
- **reference** — a captured bundle, kept a kind of its own because it is many related files with a
  life of their own rather than one file.
- **brief** — the per-site record of what was decided.
- the **conversation** kinds — a session and the comment that carries its transcript — so that one
  store holds both the client's material and the assistant's conversations rather than two stores
  that could disagree about which account either belongs to.
- the **attachment** record, under the name the component that writes and reads it gives it, so that
  bytes attached to any of the above are described by that component's own record rather than a local
  approximation of it.

None of the three material kinds requires a lifecycle status: a material, a reference or a brief is
created without naming one and is accepted.

## Verification

Enumerate the kinds the store validates against and confirm each of the names above is present.
Then create a record of each material kind through an account-scoped store without supplying a
status, and confirm each is accepted.