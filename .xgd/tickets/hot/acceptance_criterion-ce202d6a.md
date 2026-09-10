---
uid: acceptance_criterion-ce202d6a
id: AC-1620
type: acceptance_criterion
title: The assistant's tool adapter edits through the store it was given
created_by: martin-github@westhead.me
created_at: '2026-09-10T06:14:35.036839+00:00'
updated_at: '2026-09-10T07:15:37.026643+00:00'
completed_at: null
last_field_updated: uat_coverage
status: pending
fields:
  story_uid: story-3f4a5f2b
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

The assistant's tool adapter is a consumer of the port on the same terms as the command line and
the builder origin: it is *given* a store when it is built, and every site-editing tool it
exposes reads and writes through that store.

The store is a parameter, not a lookup. The filesystem adapter the adapter falls back to when
none is supplied belongs to the `1c` host that builds it for the operator's own machine; a
supplied store displaces that fallback entirely, and no editing tool underneath reaches past it
for a store of its own. A runtime with no filesystem cannot reach the fallback however the call
arrives, which is exactly why it cannot be a lookup.

Built with the filesystem-free store, and with no filesystem site tree present at all, the
adapter's site-editing tools complete: one segment of a page is read and written back through
the segment verbs this adapter exposes — `get_l1` and `set_l1`, where the command line has its
copy verbs; a palette operation applies and its rules are enforced, through the dedicated
palette tools the rules live in rather than through a settings merge; an asset added through a
tool lands as bytes and lists; the change count advances on each accepted write and does not
move on a refusal; and each result reads back through the store that was injected rather than
from anywhere on disk. Refusals carry the same envelope they carry on the command line — a
code, the path the refusal concerns, and a hint.

## Verification

Build the tool adapter through the host entry point the assistant itself goes through, passing
the filesystem-free store, with no site tree on disk. Invoke its site-editing tools and assert
both the results and the state read back out of the injected store. A tool that still reached
for a file fails here rather than quietly succeeding against the operator's own disk. Assert
also that a supplied store is the one used — the fallback is not constructed when a store is
given.

The palette leg must reach the rules, not merely a value: a settings merge can add an entry and
can neither remove one nor move one, and it says nothing about the references removal and rename
are defined in terms of. So drive the palette tools themselves — an unreferenced entry removed,
a referenced one refused, a rename whose reference is asserted to have followed in the page as
the store hands it back.