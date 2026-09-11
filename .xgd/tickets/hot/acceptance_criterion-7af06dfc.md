---
uid: acceptance_criterion-7af06dfc
id: AC-1723
type: acceptance_criterion
title: A material's file comes back as itself — its own bytes, its own content type,
  marked for display in place under its original name
created_by: martin-github@westhead.me
created_at: '2026-09-11T05:19:14.647393+00:00'
updated_at: '2026-09-11T05:28:52.738615+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-1500b111
  kind: behavior
  regression_only: false
---

## Criterion

Asking for a piece of material's file returns its stored bytes unchanged, declared with the
content type they were stored under, and marked for display in place rather than as a download
prompt, carrying the file's original name — so the detail view can show the thing itself.

Material carrying no attached file is answered with a statement that it has no file, naming the
material, rather than with empty bytes.

## Verification

Add a file of a known type and known content to an account. Ask that account's builder for that
material's file and observe: the stored bytes returned byte-for-byte, the content type matching
the type it was stored under, and the response marked for inline display carrying the original
filename. Ask for the file of a piece of material that has none and observe the explanatory
refusal naming it.