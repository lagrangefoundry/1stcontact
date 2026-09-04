---
uid: acceptance_criterion-11553160
id: AC-1569
type: acceptance_criterion
title: The bytes come back as themselves — original type and name, presented for display
  — from the account's private store and never the public site host
created_by: xgd
created_at: '2026-09-04T04:27:54.333812+00:00'
updated_at: '2026-09-04T04:27:54.333812+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-f775289b
  kind: behavior
  regression_only: false
---

## Criterion

Asking for a piece of material's file returns the stored bytes unaltered, declared under the content
type recorded when it arrived, and presented for display in place rather than forced to download,
carrying the name the file arrived under.

The bytes are reached only through the account's own handle on the private material store: they are
not served from the host that serves published sites to the public, and the account's material
cannot be reached through that host at all.

## Verification

Ingest a file of known bytes and content type. Request it through the builder surface and assert the
returned bytes are identical, the declared content type is the recorded one, the presentation is
inline rather than an attachment, and the original filename is stated. Assert the same material is
not retrievable from the public site host. Assert a request made under one account cannot retrieve
another account's material.
