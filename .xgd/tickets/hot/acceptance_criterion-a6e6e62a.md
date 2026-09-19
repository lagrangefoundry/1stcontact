---
uid: acceptance_criterion-a6e6e62a
id: AC-1791
type: acceptance_criterion
title: The generated asset tree is swapped in whole, so no reader sees a partial build
  and a failed build leaves the previous one serving
created_by: martin-github@westhead.me
created_at: '2026-09-14T05:31:01.665530+00:00'
updated_at: '2026-09-19T14:04:36.757548+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-d5167ced
  kind: behavior
  regression_only: false
---

## Criterion

The build's generated-asset stage **replaces the served asset tree whole**. The new tree is
assembled somewhere other than the path that is served, and takes that path only once every
artifact in it exists — in a single move, not a copy that occupies the path while it runs.

Replacing rather than merging is the requirement underneath it: a component left behind by a rename
would otherwise keep being served for as long as nobody looked. But emptying the served path and
refilling it over the next several seconds is not a way to replace it. Everything reading that path
meanwhile — a local development server on the same checkout, another test in the same run — is
answered not-found for every component, and a build that fails part-way (which is what an incomplete
component store makes it do) leaves that hole permanently rather than for a moment.

So the guarantee is stated about what a reader observes, at every instant of a build:

- A reader of the served path sees the previous build's tree or the new build's tree, each complete,
  and never a partial state of either.
- A build that fails before the new tree is whole leaves the previous tree in place and serving,
  with exactly the contents it had before the build started, and leaves nothing half-built at the
  served path.

## Verification

With a complete asset tree already at the served path, run the build while reading that path
concurrently: every read that is answered sees a complete tree — there is no moment at which a
component present both before and after the build is absent — and exactly two trees answer, the
previous one and then the new one, with no return to the previous once the new one has taken the
path. A directory cannot be moved onto a path an existing tree still occupies, so the previous tree
is moved aside first and the served path is unoccupied for the single operation between the two
moves: confirm the reads answered not-found are bounded to that instant — a handful out of a
thousand, every one of them falling between the last read of the previous tree and the first read of
the new one — rather than the sustained run of unanswered reads that emptying and refilling the
served path would produce. Then run the build
with a shared component hidden so the asset stage fails: the run exits non-zero, and the tree at the
served path is still the previous one, complete and with the same components it had before. Confirm
in both cases that nothing partial is left occupying the served path when the run ends.
