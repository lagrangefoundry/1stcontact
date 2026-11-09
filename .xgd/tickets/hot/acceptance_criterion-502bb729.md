---
uid: acceptance_criterion-502bb729
id: AC-2589
type: acceptance_criterion
title: POST /api/import refuses capture-mirrored asset bytes with 403 naming them,
  before any draft is created, per business, distinct from BUG-51's 409
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T23:41:30.903140+00:00'
updated_at: '2026-11-09T23:41:30.903140+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-aacb7060
  kind: behavior
  regression_only: false
---

## Criterion

`POST /api/import` refuses a site payload when any of its assets is byte-for-byte identical
(same sha256) to a subresource mirrored into one of **the requesting business's own** capture
bundles in cloud storage, meaning any member under a bundle's `assets/` prefix. The rule is the
same one `1c push` applies locally. The Worker enforces it independently, so a request posted
by hand is refused just as the CLI's would be.

- **Answered 403**, not 400 and not 409. The JSON body carries an `error` message saying the
  bytes are mirrored from a captured page and cannot be republished. It also carries the `slug`,
  the offending `asset` name, and the `bundle` and `member` it duplicates. The error text is
  scrubbed of platform secrets like every other error from this route.
- **A refused import leaves nothing behind.** No draft is created for a slug that has never been
  imported, and an existing site's pages, `site.json` and assets are unchanged.
- **No override.** `"force": true` does not get past the refusal.
- **Distinct from BUG-51's conflict.** An import that would replace builder changes, without
  `force`, still answers 409 naming the change count and the `--force` remedy. That check is
  made first. Once `force` answers it, a payload carrying mirrored bytes is still refused with
  403.
- **One business's captures never gate another's import.** Only the requesting business's
  bundles are consulted. Bytes mirrored into a different business's bundle do not cause a
  refusal.
- **Unaffected cases proceed as before**: a payload with no assets, a business holding no capture
  bundles, assets matching nothing, and a deployment with no blob storage binding, which can hold
  no captures. In these cases the import does not fail.

## Verification

Against the import route with a business whose cloud reference store holds a bundle with a
known `assets/` member:

- post a payload for a never-imported slug carrying that member's bytes under another name;
  observe 403 with `slug`, `asset`, `bundle`, `member`, and that the slug has no draft afterwards;
- post the same payload with `"force": true`; observe 403;
- post to a slug with builder changes and no `force`; observe 409 with the `--force` remedy;
- post the same bytes as a different business that holds no such bundle; observe the import
  lands;
- post with no blob storage binding configured, and with assets matching nothing; observe 200.
