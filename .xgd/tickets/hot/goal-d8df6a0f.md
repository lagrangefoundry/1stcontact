---
uid: goal-d8df6a0f
id: GOAL-40
type: goal
title: Open design questions
created_by: xgd
created_at: '2026-08-24T22:39:35.714116+00:00'
updated_at: '2026-08-24T22:39:35.714116+00:00'
completed_at: null
last_field_updated: created_at
status: concept
fields:
  provenance: discovered
  workstream: false
---

Design questions that are genuinely unresolved and that block committed work downstream. Tracked on the map deliberately: an unanswered question is real work with a real done state, and leaving it off the map is how it becomes an invisible blocker.

DOC-5 already carries an Open Architecture Questions section covering the exact D1 schema, whether site snapshots live in D1 or R2 or both, build and deploy mechanics, magic-link token lifetime, and Stripe product design. The questions grouped here overlap it and should be reconciled against it rather than answered twice.

These are grouped under one parent because they were raised as a group. If they would be more useful sitting directly on the app root, they can be flattened.

Children: storage and access of reference sites and content, what gets included in the project KB, and what the backend data model really looks like.