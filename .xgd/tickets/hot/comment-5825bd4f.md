---
uid: comment-5825bd4f
id: COMMENT-1770
type: comment
title: Comment on acceptance_criterion AC-910
created_by: xgd
created_at: '2026-08-31T11:54:05.827378+00:00'
updated_at: '2026-08-31T11:54:05.827378+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: acceptance_criterion-923670bf
  kind: change
---

Removed during reconciliation of BUNDLE-20 (REQ-149), plan item 8, on
2026-08-31.

This criterion required every response on the preview channel — page, asset,
redirect and not-found alike — to carry a directive asking crawlers not to index
it, and required the published channel to carry no such directive.

The preview channel it governs was removed: the snapshot-addressed shareable
draft links were produced only by the deleted operator-side deploy command and
were vouched for only by the per-site index object that went with it. There is
one channel now, so the criterion's subject is gone.

Its surviving half — that a published response carries no crawler directive at
all — is not dropped. It moved into AC-909 (the freshness criterion) and is
asserted positively there rather than left implicit, because a directive
surviving the channel it belonged to would silently deindex every published
customer site.
