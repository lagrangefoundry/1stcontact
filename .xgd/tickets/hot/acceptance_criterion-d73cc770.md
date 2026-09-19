---
uid: acceptance_criterion-d73cc770
id: AC-1832
type: acceptance_criterion
title: Every verb taking a bundle directory addresses exactly the tree it always did,
  including bundles outside the reference tree
created_by: martin-github@westhead.me
created_at: '2026-09-19T13:37:44.450902+00:00'
updated_at: '2026-09-19T13:37:44.450902+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-177897a0
  kind: behavior
  regression_only: false
---

## Criterion

Every command-line verb that takes a bundle directory addresses exactly the tree
it always did, so nothing an operator already types changes:

- bytes written through the operator's backing land at the documented location —
  the reference tree, then the captured host, then the path-derived segment — and
  a directory handle on that location reads the same artifact back;
- a bundle **outside** the reference tree is addressable: a scratch copy, a
  fixture under a temporary directory or a bundle checked out beside the repo can
  all be opened by directory, and such a handle reports that location as its name;
- a per-width ladder screenshot keeps its filename inside the directory, so the
  size-aware diff still finds it;
- enumerating the operator's reference tree lists only things shaped like a
  bundle — host and path segment — so a loose file at the root of that tree and a
  bare host directory with no capture under it are not offered as bundles, and a
  tree with nothing captured yet lists nothing.

## Verification

Write a member through the operator's backing and assert the file is present at
the documented directory, then read the same artifact back through a handle
constructed from that directory alone. Open a bundle at an unrelated temporary
directory, write and read a member, and assert its reported name is that
directory. Assert the ladder screenshot's filename inside a directory. Build a
reference tree containing two bundles, a stray file at its root and a bare host
directory, and assert the enumeration is exactly the two bundle names; assert an
untouched tree enumerates as empty.
