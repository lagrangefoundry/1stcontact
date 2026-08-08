---
uid: acceptance_criterion-1b27e14b
id: AC-1030
type: acceptance_criterion
title: The components consumed are the repository's own, identically from any of its
  working trees
created_by: xgd
created_at: '2026-08-08T01:07:53.114878+00:00'
updated_at: '2026-08-08T01:47:58.706864+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
---

## Criterion

Which installed copy of the shared UI components this repository consumes is
decided by *which repository the run belongs to*, never by where on disk the run
happens to be executing from. A linked working tree of this repository — the same
repository parked outside the directory the components were installed to sit
beside — consumes the identical installed copy the repository's main checkout
consumes.

Resolution therefore anchors at the repository's main checkout, and does so
identically for every consumer, because there is a single point at which a
component is resolved. Given the checkout shape it is asked from, the location it
anchors to is:

- a main checkout, which owns its repository data directly — the checkout's own
  directory;
- a linked working tree, whose repository data is a pointer to a shared
  repository directory — the main checkout that shared directory belongs to, and
  never the working tree itself;
- a pointer to a repository directory that names no shared repository — the
  directory holding that pointer;
- a location with no repository data anywhere above it, such as an extracted
  archive — the location the search began from. The search terminates there: it
  neither fails nor keeps climbing to the filesystem root and anchoring outside
  the tree it was asked about.

The observable consequence is the one that matters, and it is an equality, not a
preference: for every component the workspace consumes, the component directory
reported from a linked working tree and the directory reported from the main
checkout are the *same* directory. There is one installed copy per repository,
and the two locations can never be silently reading different ones. A build,
a rendering or a run of the acceptance evidence performed in a working tree is
consequently never left evidence-free about the components while reporting
success — the failure this rules out is the green run, not the loud one.

A failure to resolve after anchoring remains an environment precondition — the
deliberate out-of-band install has not been run for this repository — and is read
as such, not as a defect in this behaviour.

## Verification

Reproduce each checkout shape as a temporary fixture directory tree — one owning
its repository data directly; one holding a pointer to a shared repository
directory that names it; one holding a pointer that names no shared repository;
one with no repository data anywhere above it — and exercise component resolution
with its starting location inside each fixture in turn. Distinguish the anchors by
placing a differently-identified installed copy at each candidate location within
the fixture, so which copy is consumed names the location that was anchored to;
assert it is the location listed above for that shape. Building each shape as a
fixture is what makes this evidence independent of which checkout the suite itself
was run from — the property must not be provable only in the layout that happens
to be under the test runner.

Then assert the invariant directly against the real installation: for every
component the workspace consumes, the component directory reported when resolving
from a linked working tree of this repository is identical to the directory
reported when resolving from that repository's main checkout, compared as
locations rather than as contents. This comparison uses the real installed copies
— the fixtures above stand in for checkout *shapes*, never for the components,
whose identity is asserted unsubstituted elsewhere.