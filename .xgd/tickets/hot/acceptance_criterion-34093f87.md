---
uid: acceptance_criterion-34093f87
id: AC-1564
type: acceptance_criterion
title: A corrected description is what search answers with afterwards, not only what
  the screen shows
created_by: xgd
created_at: '2026-09-04T04:27:14.571473+00:00'
updated_at: '2026-09-04T04:27:14.571473+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-f775289b
  kind: behavior
  regression_only: false
---

## Criterion

Correcting a material's description makes that material findable by the client's own words. A search
of the account's knowledge phrased in terms that appear only in the correction returns that
material; a search phrased in terms that appeared only in the description it replaced no longer
returns it on the strength of those terms.

The correction takes effect for the search that follows it — there is no later pass the client must
wait for.

## Verification

Ingest a material whose system-written description contains a distinctive phrase. Search the
account's knowledge for that phrase and assert the material is returned. Correct the description to
text containing a different distinctive phrase and no occurrence of the first. Immediately search
for the new phrase and assert the material is returned; search for the original phrase and assert it
is no longer matched by it.
