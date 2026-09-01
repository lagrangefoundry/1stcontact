---
uid: acceptance_criterion-3bbaf6da
id: AC-1485
type: acceptance_criterion
title: The shared ticket component resolves from any checkout, is named in the build
  report, and a stale install is reported by name with the command that fixes it
created_by: xgd
created_at: '2026-09-01T23:58:33.762527+00:00'
updated_at: '2026-09-01T23:58:33.762527+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-ab1ecd62
  kind: behavior
  regression_only: false
---

## Criterion

The application can be built and typechecked from any checkout of this repository, including a linked
working tree, and an unusable shared install is reported as such rather than as a mystery.

- The asset build emits a generated module that re-exports the shared ticket component **by absolute
  location**, resolved once at build time. A package specifier resolved at bundling time would find the
  shared install from the primary checkout and find nothing from a linked working tree; the generated
  module removes that difference.
- The build reports the emitted module as its own named line in the build report, alongside the other
  generated artifacts, naming the location it resolved to.
- A generated type declaration accompanies it and states an **explicit list** of the names the
  application uses, not a wildcard — so a rename upstream fails the typecheck rather than surfacing as an
  undefined value at first use.
- Generation runs before the typecheck, so a fresh checkout builds without a manual step.
- The shared component being absent is an ordinary state on a fresh clone. A **stale** install — present
  but predating the attachment capability this store requires — must not report as the same state as a
  working one: it is detected by whether the capability is actually there, not by a package version that
  never changes, and it is reported as a named skip whose message states the reason and carries the
  command that installs it.

## Verification

Run the asset build in a linked working tree and observe the generated module and its type declaration are
written, the build report names them, and the application typechecks and bundles. Inspect the generated
declaration and confirm it enumerates names rather than re-exporting everything. Replace the shared install
with a copy lacking the attachment capability and observe checks that depend on it report a skip whose
message names the reason and gives the install command, while checks over this repository's own files still
run.
