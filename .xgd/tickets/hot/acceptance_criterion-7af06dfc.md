---
uid: acceptance_criterion-7af06dfc
id: AC-1723
type: acceptance_criterion
title: A material's file — or, for a multi-member capture, a named member — comes
  back as itself with its own bytes and content type
created_by: martin-github@westhead.me
created_at: '2026-09-11T05:19:14.647393+00:00'
updated_at: '2026-11-01T02:16:49.390965+00:00'
completed_at: null
last_field_updated: title
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

A capture holds many files, so the same request may also name **one member** of it. Asked for a
named member, the answer is that member's own bytes, its own content type and its own name —
never another member's, and without reading the others. Asked with no member named, ordinary
single-file material is answered exactly as before; naming a member is never required of it.

Material carrying no attached file is answered with a statement that it has no file, naming the
material, rather than with empty bytes. A capture asked for a member it does not hold is answered
with a statement naming that member and the material, rather than with empty bytes or with a
different member in its place.

## Verification

Add a file of a known type and known content to an account. Ask that account's builder for that
material's file without naming a member and observe: the stored bytes returned byte-for-byte,
the content type matching the type it was stored under, and the response marked for inline
display carrying the original filename. Ask for the file of a piece of material that has none and
observe the explanatory refusal naming it.

Adopt a capture holding several members, including its full-page screenshot and a JSON member.
Ask for the screenshot by member name and observe the screenshot's bytes byte-for-byte, an image
content type, and the screenshot's own name — and that the same request naming the JSON member
returns the JSON's bytes and type instead. Ask for a member name the capture does not hold and
observe the refusal naming that member, with no bytes returned.
