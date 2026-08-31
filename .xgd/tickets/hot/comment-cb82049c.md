---
uid: comment-cb82049c
id: COMMENT-1771
type: comment
title: Comment on acceptance_criterion AC-902
created_by: xgd
created_at: '2026-08-31T11:54:11.316501+00:00'
updated_at: '2026-08-31T11:54:11.316501+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: acceptance_criterion-536a6df9
  kind: change
---

Removed during reconciliation of BUNDLE-20 (REQ-149), plan item 8, on
2026-08-31.

This criterion described the preview addressing form: a URL naming a site and a
specific content-addressed snapshot returns that snapshot's entry page, every
asset it references resolves under the same address, and the bytes are that
snapshot's rather than another revision's.

That addressing form no longer exists. It was delivered only by the
operator-side deploy command and indexed only by the per-site index object
beside the bytes, both deleted when publishing moved into the platform; the
source intent drops it deliberately rather than porting it, and records that
sharing a draft returns later as a builder control on the channel the builder
already renders on request.

The completeness property this criterion carried — a page is only served if
every asset it references is served too, and the bytes are the named revision's
and not another's — is not lost. It moved to AC-903, the live-revision
criterion, which now asserts it over the one addressing form that remains,
including that winding the log back returns the earlier revision's own bytes.
