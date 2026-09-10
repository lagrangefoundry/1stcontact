---
uid: acceptance_criterion-e045b3e3
id: AC-1619
type: acceptance_criterion
title: The revision storage verbs are the same declared set, answered by every adapter
created_by: martin-github@westhead.me
created_at: '2026-09-10T06:14:30.736668+00:00'
updated_at: '2026-09-10T07:15:39.099371+00:00'
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

The five revision storage verbs are part of the *same* declared, total, asynchronous set as the
editing questions, and every adapter answers them — the filesystem-backed store, the
filesystem-free store, and the cloud store alike. A revision that could only be written to a
filesystem would put the filesystem back under the seam.

The verbs, and what they answer:

- "list this site's revisions" → every frozen revision, oldest first
- "freeze this revision" → the definition, its pages, its asset bytes and its rendered output
  are held under the revision the entry names, and the entry joins the log — one act, with no
  caller ever naming where those bytes live
- "read revision *n*" → that revision's frozen definition, pages and asset bytes
- "the revision the draft descends from" → an identifier, or nothing before any publish
- "re-parent the draft onto revision *n*" → what the previous question answers changes, and
  nothing else does

For a site that has never published, the same questions answer emptily rather than raising: no
revisions, no base for the draft, and nothing to read back for an identifier the store holds
nothing for. For a site that has published: a frozen revision lists, reads back byte-for-byte
what was frozen, and is unreachable through the draft it was taken from — a later write to the
draft does not move it.

Every one of these answers asynchronously, exactly as the editing questions do, and none hands
back a location.

## Verification

Assert the above in the one body of storage assertions the editing questions already run
through, so every adapter registered against it is held to the same text — including the
filesystem-free store, whose revision verbs are otherwise asserted nowhere. Register both cases
per adapter: a site that has published and a site that has not.

CAP-82's publish and checkout tests do not satisfy this criterion. They prove the *sequencing*
above the port and drive two of the three adapters; this criterion is the port-level claim that
each adapter answers the verbs at all.