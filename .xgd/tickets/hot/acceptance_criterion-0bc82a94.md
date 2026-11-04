---
uid: acceptance_criterion-0bc82a94
id: AC-2251
type: acceptance_criterion
title: A name is a row per name with optional parts, superseded as corrected or changed
  rather than updated, one current; only changed former names reach the client
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T16:30:36.992985+00:00'
updated_at: '2026-11-04T19:42:50.447261+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-a55c2f35
  kind: behavior
  regression_only: false
---

## Criterion

A person's name is a row per name, and the person record carries no name column.
A name has a displayed name, stored as authored and never assembled from the
other parts, and six optional parts: known as, title, given name, middle names,
family name, suffix. A name with only a displayed name (a mononym) is complete.
A name is never updated in place: changing any part supersedes the current row,
stamping when and why, and inserts a new current row, so a person has at most one
current name and the schema refuses a second. The reason is **corrected** unless
the change is explicitly recorded as **changed**; a missing or unrecognised reason
is a correction. A change that leaves every part as it was writes no row. Only
former names superseded as **changed** reach the client: they are returned with
the person, shown as *formerly …*, and matched by the list's search. Former names
superseded as **corrected** are never returned, shown or searched.

## Verification

In workerd against real D1: give a person a name, then correct its displayed name
without a reason, then record a name change with reason `changed`, then submit an
unchanged value. Assert the person holds three name rows of which exactly one is
current, the first superseded as corrected and the second as changed, and that the
unchanged submission added no row. Assert an attempt to store a second current row
is refused. Read the person through the list and the detail and assert the former
names contain only the changed one. Submit a reason the route does not recognise
and assert the superseded row is recorded as corrected. In the panel, assert the
row shows *formerly <changed name>* and a search for it finds the person, while a
search for the corrected name does not.