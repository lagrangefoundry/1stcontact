---
uid: goal-4bfe7535
id: GOAL-38
type: goal
title: Drag and drop upload -- UI and storage
created_by: xgd
created_at: '2026-08-24T22:39:19.208056+00:00'
updated_at: '2026-08-24T22:39:19.208056+00:00'
completed_at: null
last_field_updated: created_at
status: concept
fields:
  provenance: discovered
  workstream: false
---

The mechanical half of asset upload: the drop target in the editor, the upload path, and where the bytes land.

UI: a drop target in the builder, per DOC-8 builder UI principles. Storage: R2 for asset bytes with D1 records pointing at them, per DOC-5.

Must respect the revision model -- DOC-5 states everything is versioned forward-only and a revision is an immutable snapshot of the entire site including assets. An uploaded asset is therefore part of a revision, not a mutable side-channel.

Security note: uploads are untrusted input crossing the safety envelope. DOC-2 (security policy) and DOC-24 (framework purpose as safety envelope, not aesthetic rails) both apply -- content type validation and size limits belong here.