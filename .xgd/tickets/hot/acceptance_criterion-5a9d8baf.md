---
uid: acceptance_criterion-5a9d8baf
id: AC-1413
type: acceptance_criterion
title: The edit channel switches the behaviour off for a module-mounting page in both
  hosts
created_by: xgd
created_at: '2026-08-31T11:06:00.059273+00:00'
updated_at: '2026-08-31T11:12:57.207222+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-179b8c06
  kind: behavior
  regression_only: false
---

## Criterion
The edit channel still switches a behaviour **off** for a page that mounts a
behavior module, in the edge runtime as it did on the filesystem host.

Requesting the edit channel of a module-mounting site returns the module's markup
— its root and its content are present, so every editable region is reachable in
the channel built for editing it — with the behaviour's functional attributes
removed rather than blanked: no submission endpoint and no submission verb, so a
submit cannot leave the page the editor is working on. The draft channel of the
same site, served by the same runtime, carries both.

This is the pre-existing non-functional-edit-channel guarantee holding across the
relocation: the module contributes the same markup through the same function in
both hosts, so a channel rule that survived only on one of them would be a
regression the relocation introduced silently.

## Verification
Seed a module-mounting site, request its edit channel from the edge runtime, and
assert the response carries the module root while carrying neither the configured
endpoint nor the submission verb. Request the draft channel of the same site from
the same runtime and assert both are present, so the difference is shown to be the
channel and not the seed.