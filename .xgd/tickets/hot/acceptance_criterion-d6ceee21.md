---
uid: acceptance_criterion-d6ceee21
id: AC-2148
type: acceptance_criterion
title: No user-facing text in the builder or the public site uses the word 'tenant'
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T10:49:10.364745+00:00'
updated_at: '2026-11-01T10:49:10.364745+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
---

## Criterion

The tenant is called a **Business** everywhere a person can read it. No
user-facing string in the builder client or the public site contains the word
"tenant". Two kinds of string are exempt by rule, not by list: SQL, and
deployment vocabulary naming the configuration variable `TENANT_ID` or
`wrangler.toml`, which is addressed to whoever edits the deployment and appears
only when the app has failed to start. The schema's `tenant_id` column is
unchanged — this is a label rule, not a rename.

## Verification

Scan the string literals of the builder client and the public site and assert
none contains "tenant" outside the two exemptions. Show the guard a synthetic
violation and assert it is caught, and show it each exemption and assert it is
excused. Assert the schema still declares `tenant_id`.
