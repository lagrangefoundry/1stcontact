---
uid: acceptance_criterion-50925e49
id: AC-1421
type: acceptance_criterion
title: Revision history is readable, and a checkout re-parents the draft while staying
  forward-only
created_by: xgd
created_at: '2026-08-31T11:34:11.933349+00:00'
updated_at: '2026-08-31T11:46:20.538662+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-5349d01f
  kind: behavior
  regression_only: false
---

## Criterion

Revision history is readable for a site, newest first, and each entry carries
what a history view needs: the revision number, when it was published, the
message, who published it, the revision it descends from, the per-path list of
what was added, modified and removed against the previous live revision, and a
digest of the frozen definition kept for audit rather than for addressing —
nothing resolves a revision by it.

Checking out an earlier revision replaces the draft with that revision's frozen
definition — including removing anything the draft holds that the revision never
had — and re-parents the draft onto it. It does not rewind the log: publishing
afterwards mints a new highest revision and records the checked-out revision as
what it descended from, and every revision in between remains readable at its own
location. A checkout of a draft with unpublished changes is refused by name
unless it is explicitly forced, because the operation overwrites the draft
wholesale.

## Verification

Publish two revisions of a site with distinct messages and read the history back
through the builder. Assert the entries come back newest first with their
messages, lineage and change lists intact. Check out the first revision, assert
the draft's lineage pointer now names it, then publish and assert a third
revision was minted whose recorded ancestor is the first. Assert the second
revision is still readable afterwards. Attempt a checkout with uncommitted draft
changes and assert it is refused unless forced.