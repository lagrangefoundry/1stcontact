---
uid: acceptance_criterion-e9c4cc0a
id: AC-1767
type: acceptance_criterion
title: Every CLI verb taking --ref <dir> addresses exactly the tree it always did,
  including a bundle directory outside storage/references
created_by: martin-github@westhead.me
created_at: '2026-09-14T04:48:50.622963+00:00'
updated_at: '2026-09-14T05:00:56.142549+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-0cb7f25b
  kind: behavior
  regression_only: false
---

## Criterion
The operator's on-disk layout and the `--ref <dir>` argument are unchanged by the
introduction of the storage contract:

- a capture written through the operator's store lands at
  `storage/references/<host>/<path-slug>/`, with its members as ordinary files an
  operator can list and read directly
- naming that same directory after `--ref` reads back the identical artifact
- a bundle directory **anywhere else** — a scratch copy, a fixture under a
  temporary directory, a bundle checked out beside the repo — is equally
  addressable by `--ref`, and the bundle is identified by that location
- the per-width ladder member keeps its filename `screenshot-<width>.png` inside
  the directory, so a size-aware diff finds the file it always found

## Verification
Write a bundle through the operator's store, assert its members exist as files at
the documented path, then read the same artifact back by naming that directory.
Separately, write a bundle into an arbitrary temporary directory and read it back
by naming that directory. Assert the ladder member's filename for a given width.