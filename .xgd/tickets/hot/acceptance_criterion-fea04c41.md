---
uid: acceptance_criterion-fea04c41
id: AC-1759
type: acceptance_criterion
title: Each admission refusal is logged once, as a structured line at the point admission
  decides, carrying the reason, the attempted address and whether the platform-admin
  seed applied
created_by: martin-github@westhead.me
created_at: '2026-09-11T06:29:36.162904+00:00'
updated_at: '2026-11-07T08:09:38.231239+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

The distinction the caller is not told is still available to the operator. Every
admission refusal writes exactly one structured operational log line at the point
admission decides it, however many callers render the refusal and whichever one does.
The line has this shape:

    {"event": "admission_denied", "reason": <reason>, "email": <attempted address or null>, "platformAdminSeed": <boolean>}

- **The reasons can be told apart.** No address at all, an unknown person, an inactive
  person, and no live membership are four different recorded answers. The address is
  casefolded, and is null for the caller with no address.
- **`platformAdminSeed` makes a misconfiguration diagnosable from the log alone.** It
  says whether this deployment's break-glass operator list names the attempted
  address. An operator who is refused because the list names a different address shows
  as `no_user` with `platformAdminSeed: false`.
- **Some requests write no denial line:** an admitted request, and the request of an
  address the operator list does name (it is seeded and admitted).
- **No eligible grant is not an admission refusal** (membership admits). It is
  recorded separately, as a structured line, when an admitted person with nothing
  selectable makes a request that needs a business.

## Verification

Drive each of the four admission refusal causes in turn. For each, assert the log holds
exactly one `admission_denied` line carrying that reason and the attempted address
(null for the caller with no address). Admit a person and assert no such line is
written. Configure the operator list with a different address than the one signing in.
Assert the refusal is logged as `no_user` with `platformAdminSeed: false`. Configure
the list with the correct address. Assert that address is admitted and writes no denial
line. Request a business-scoped route as an admitted person (terms accepted) whose only
grant has lapsed. Assert the request is refused and that a structured line records the
missing business.
