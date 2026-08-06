---
uid: goal-df2619cb
id: GOAL-26
type: goal
title: Launch site
created_by: xgd
created_at: '2026-08-06T00:54:40.316529+00:00'
updated_at: '2026-08-06T00:54:40.316529+00:00'
completed_at: null
last_field_updated: created_at
status: aspiration
fields:
  provenance: planned
---

Publish the XGD site for real: promote the draft to a revision and serve it on the
published channel, with DNS and TLS pointing at it.

Per DOC-12, publish is a deliberate act — snapshot the draft into the next immutable
revision, diff against the previous, append to `history.json`, render the new latest
revision to the published channel. The live site is always the latest revision.

The natural gate for the rest of Phase 1: copy final, white papers in, email capture
working. Left without hard `depends_on` edges because the ordering is editorial
judgement rather than mechanical blocking — say the word and I will make them real.
