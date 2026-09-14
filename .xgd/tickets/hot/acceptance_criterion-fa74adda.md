---
uid: acceptance_criterion-fa74adda
id: AC-1409
type: acceptance_criterion
title: No request address names a conversation or the assistant's record, and a conversation
  is confined by the store's own account binding rather than by a key convention
created_by: xgd
created_at: '2026-08-31T10:38:49.147303+00:00'
updated_at: '2026-09-14T05:52:45.468510+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-a58a0974
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

Neither a conversation nor the record of what the assistant did is reachable by
any address a visitor or an operator can ask for, and neither is confined to one
account by a naming convention.

A site's own files are addressed within one region of shared object storage, and
a requested address is composed only within that region — nothing derives a
storage root from a request. The conversation is not in that storage at all: it is
held in the account-bound ticket store, which is reached through a handle bound to
one account when it is built, so there is no argument anywhere on that path that
could name another account's conversation even if the caller knew its identifier.
The record of what the assistant did is still one object per record in shared
storage, filed outside the region site files are addressed within.

A transcript is somebody's business in their own words. It is not a site file and
must never be servable as one.

## Verification

Hold a conversation that makes a change, so both a transcript and a record of the
change exist. Enumerate what is stored: the record sits outside the region site
files are addressed within, and no object in that storage holds the conversation
at all. Then ask the origin for addresses constructed to reach either — including
ones using traversal segments to climb out of the site region, and ones naming the
place transcripts were once kept — and assert none of them returns a transcript or
a record: each is refused or not found, and the stored objects are unchanged.
Confirm the probes are not vacuous by showing that an address composed within the
site region does reach a site file.

For the conversation's confinement, hold conversations for two accounts and read
through each account's own handle: neither can reach the other's, and there is no
address or identifier that changes that, because the account is bound into the
handle rather than composed into a key.
