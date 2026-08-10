---
uid: acceptance_criterion-4807267c
id: AC-1098
type: acceptance_criterion
title: The catalog of component kinds is listable and closed, stating each kind's
  required configuration and whether it carries a default look
created_by: xgd
created_at: '2026-08-10T09:34:02.814621+00:00'
updated_at: '2026-08-10T09:45:50.034279+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-b3de4571
  kind: behavior
  regression_only: false
---

## Criterion
The set of component kinds a site can use is readable in full. Each entry states its kind identifier and version, the configuration fields it requires and what each accepts (including permitted values and item shapes where declared), the mount seams it expects, the controls an instance may bind, and whether it arrives with a default presentation. The set is closed: naming a kind that is not in it is refused with a not-found error that names what the catalog does hold and says a new kind is a developer's work, not something configured into existence.

## Verification
List the catalog and assert it reports at least one kind with its required configuration fields and a default-presentation flag. Attempt to add a component of an invented kind: the call fails with a not-found error whose message enumerates the available kinds.