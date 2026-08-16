---
uid: acceptance_criterion-0bc092af
id: AC-1027
type: acceptance_criterion
title: 'Choosing an image or adjusting how it is seen bakes nothing: no asset file
  is touched, the region still points at the same handle, and every other parameter
  survives untouched'
created_by: xgd
created_at: '2026-08-07T04:41:27.360466+00:00'
updated_at: '2026-08-16T06:55:44.472241+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-37a3921b
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

Choosing an image **or adjusting how it is seen** changes structured fields on
the region and nothing else:

- **No file is written, copied, resized, converted or processed.** Every file in
  the site's asset store is byte-for-byte identical after the edit, and no new
  file appears. This holds for every control on the region alike — pointing it at
  a different picture, panning it within its box, cutting it to a shape, turning
  it, scaling it, or adjusting its colour. Framing is a parameter the renderer
  applies, never a newly baked file, so one uploaded picture serves any number of
  framings and no image-decoding step exists to be reached.
- **The region still points at the same handle afterwards.** An adjustment moves
  how the picture is seen and never which picture it is.
- **Every other parameter the region carries survives.** Whatever the region
  holds besides the field being written — including the presentation parameters a
  captured design folds onto an image, and including the framing parameters
  alongside the one that changed — is unchanged by the edit.

## Verification

Fingerprint every file in the site's asset store — contents, size and
modification time — before an edit. Save a new choice of image, then assert every
fingerprint is unchanged and the set of files is identical. Repeat for a framing,
shape and colour adjustment saved together, and assert the same: no file touched,
no file added, and the region's handle unchanged. Assert the edited region is
identical to its previous state apart from the fields named in the change map,
including any presentation and framing parameters it carried.