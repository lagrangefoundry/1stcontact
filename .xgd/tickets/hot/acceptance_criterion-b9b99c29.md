---
uid: acceptance_criterion-b9b99c29
id: AC-1407
type: acceptance_criterion
title: The assistant library is bundled at build time, and a build that cannot find
  it fails loudly rather than shipping a host with no conversation
created_by: xgd
created_at: '2026-08-31T10:38:22.588556+00:00'
updated_at: '2026-08-31T10:38:22.588556+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a58a0974
  kind: behavior
  regression_only: false
---

## Criterion

The assistant library is resolved once, at build time, and travels inside the
deployed artifact. Nothing on the deployed path resolves a module path, builds a
file address, or imports a module chosen at run time — the assistant is either in
the artifact or the artifact was never produced.

When the library is not present to be built in, the build **fails and says so,
naming what is missing and how to install it**. It does not emit an artifact whose
conversation route is quietly absent, because that failure surfaces only as an
operator asking the assistant a question and getting nothing.

## Verification

Build the deployable artifact and inspect it: the assistant library's own symbols
are present in it, and it contains no module-path resolution, no file address
construction and no run-time import of a computed address. Then remove the library
from where the build resolves it and build again: the build exits non-zero with a
message naming the missing component and the command that installs it, and no
artifact is produced.
