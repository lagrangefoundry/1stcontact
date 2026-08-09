---
uid: acceptance_criterion-96678ac8
id: AC-814
type: acceptance_criterion
title: A retained bundle can be re-folded offline, rewriting only what the fold derived
created_by: xgd
created_at: '2026-08-06T01:45:30.379113+00:00'
updated_at: '2026-08-09T08:19:47.468870+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-8acc338d
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
A bundle's folded reproduction document and its form definitions can be re-derived
from that bundle's own retained multi-state ladder, offline, without contacting the
captured origin.

A re-fold rewrites **only** what the fold produced. The retained ladder, the
screenshots, the mirrored assets and the advisory hints are left byte-unchanged, so
a fold change is picked up on its own rather than landing inseparably with a fresh
reference — which is what re-capturing would produce, since re-capturing re-rolls
the oracle in the same step. The re-folded document is the same document a fresh
capture of those bytes would fold, and it reports what it rewrote (node count,
forms, residuals).

A bundle carrying no retained ladder has no oracle to re-fold and is rejected with a
message naming re-capture as the remedy, rather than producing a document from
nothing.

## Verification
Re-fold a retained bundle with the network unavailable and assert it succeeds,
rewriting the reproduction document and forms while every other bundle artifact is
byte-identical. Change the fold, re-fold, and assert the change appears in the
document while the ladder is untouched. Re-fold a bundle with no retained ladder and
assert it fails with a re-capture instruction.