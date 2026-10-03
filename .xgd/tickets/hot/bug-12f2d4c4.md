---
uid: bug-12f2d4c4
id: BUG-181
type: bug
title: 'Upload note: says an uploaded image is ''on your site'' when it''s only available
  to use'
created_by: EPIC-19
created_at: '2026-10-03T18:52:23.230996+00:00'
updated_at: '2026-10-03T18:52:23.230996+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  severity: medium
  priority: medium
  epic_parent: epic-95bc3b15
  story_points: 1
  auto_merge_back: true
  needs_review: false
---

## Symptom
Uploading an image with the Site role to the builder chat shows:

> Added, and it's on your site as **IMAGE-3**.

That isn't true. The image isn't on any page, the draft hasn't changed, and nothing has been published. A client reads it as all three, which is alarming: they look for the picture on their site, or worry it went live.

## Cause
`uploadNote` (`apps/control-app/src/builder/app.js`, about line 2133) prints that sentence whenever `result.site_asset` is set. All that field records is that the upload's bytes were copied into the site's asset store, so the image is **available** to place on a page. The wording came from REQ-287 (now frozen at `ready_to_reconcile`), and its UATs pin the old text.

The failure line has the same problem: "I couldn't put it on the site yet: …" talks about a copy failure as if it were a failure to publish.

## Fix (operator-approved wording, 2026-10-03)
- After a successful site-asset copy: **"Added — **IMAGE-3** is ready to use on your site."** The label is bold. Where the material has no label (anything uploaded before REQ-280), the filename in backticks takes its place, as now.
- After a failed site-asset copy: **"It's in your Library, but isn't ready to use on the site yet: <reason>"**.
- Unchanged: the first line naming the uploaded file, the reference-role line ("I'll read it — it won't appear on your site."), and the bare "Added."
- **No upload note says or implies that an item is "on your site".** Uploading never places anything on a page.

## Test plan
Update `tests/test_UAT_FC_REQ-287_the_note_names_the_label.test.ts`'s expectations to the new wording, or add `test_UAT_FC_<this>_*`:
- a labelled site upload says the label "is ready to use on your site";
- an unlabelled one says the same with the filename;
- a failed copy uses the Library wording;
- no upload note contains "on your site as" or "put it on the site".
