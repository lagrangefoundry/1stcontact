---
uid: acceptance_criterion-ea71e6b8
id: AC-2588
type: acceptance_criterion
title: 1c push refuses a draft whose assets are byte-identical to a capture-mirrored
  subresource, before upload, naming the asset and its source, with no override
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T23:41:29.356353+00:00'
updated_at: '2026-11-09T23:41:29.356353+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-aacb7060
  kind: behavior
  regression_only: false
---

## Criterion

`1c push` of a draft refuses, before anything is sent to the builder, when any of the draft's
assets is byte-for-byte identical (same sha256) to a subresource mirrored into one of the
operator's own capture bundles, meaning any member under a bundle's `assets/` prefix in the local
`storage/references/` tree.

- **Identity is the bytes, not the name.** The same bytes under a different file name are
  refused. Different bytes under the captured file's name are not refused.
- **Every mirrored subresource counts**, not only pictures. A stylesheet or webfont that is
  byte-identical to a mirrored member is refused the same way a photograph is. Bundle members
  outside `assets/` (the retained oracle, screenshots, `rendered.html`) are not matched.
- **The refusal names the file and where it came from.** The error names the offending asset as
  the site would have held it, and the bundle and member key whose bytes it duplicates. It
  states that the bytes are mirrored from a captured page and cannot go on a site.
- **Nothing is uploaded.** No import request reaches the builder for a refused draft, so the site
  on the builder is unchanged.
- **There is no override.** `--force` (BUG-51's answer to replacing builder changes) does not get
  past the refusal.
- **A draft with no matching bytes pushes as before.** That covers a draft with no assets, an
  operator with no capture bundles, and assets that match nothing in any bundle.

## Verification

With a local store holding a capture bundle whose `assets/` prefix contains a known file:

- copy that file into a site's `draft/assets/` under a **different** name and run `1c push`;
  observe a non-zero exit, an error naming the renamed asset together with the bundle and
  member key, and no request made to the import route;
- repeat with `--force`; observe the same refusal;
- repeat with a non-image mirrored member (e.g. a stylesheet); observe the same refusal;
- replace the asset with different bytes under the captured file's original name; observe the
  push succeeds;
- push a draft whose assets match nothing in any bundle, and a draft with no assets; observe
  both land as before.
