---
uid: report-fa0d8832
id: REPORT-3572
type: report
title: 'Overlap resolution: cluster 4'
created_by: xgd
created_at: '2026-09-09T23:10:51.592430+00:00'
updated_at: '2026-09-09T23:10:51.592430+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: overlap_resolution
  subject_uid: report-e37a6b4a
  cluster_id: '4'
---

## Cluster 4 Resolution

**Boundary**: The change log is simultaneously a storage-port write-contract detail and a capability of its own
**Stories resolved**: 2

### Actions

| Story | Action | From | To | Rationale |
|-------|--------|------|-----|-----------|
| story-fde7370b (STORY-121, Cloudflare Site Store) | confirm | capability-c4c7a854 (CAP-101) | (no change) | Owns only that the journal's *questions* are answerable by a store with no filesystem — never what their answers mean. |
| story-6cd17452 (STORY-115, Draft change journal) | confirm | capability-702b7c02 (CAP-99) | (no change) | Owns the journal's semantics, consumers and degradation — never how any one store persists it. |

### Why this is a clean boundary, not an unresolved overlap

The survey correctly spotted that the change log appears on both sides. It does — but as
two different claims about it, and the split is already stated explicitly in the artifacts
rather than being an accident that happens to hold.

**The split is "the question" vs. "the answer".**

- CAP-101 / STORY-121 claims that *the journal's operations are part of the storage port*:
  AC-1385 enumerates "the change count; recording a change; the changes since a given count"
  among the questions every one of the three live stores must answer identically. That is a
  port-shape claim. It asserts nothing about what a record contains, what the count means,
  or who reads it.
- CAP-99 / STORY-115 claims *what those answers are*: what a record names (AC-1257), the
  bound on retained text (AC-1261), the window and its truncation flag (AC-1259), actor
  arithmetic (AC-1258), the untrusted marking (AC-1265), the per-turn push signal (AC-1266),
  and the operator's CLI surface (AC-1267/1268). None of these is a statement about storage.

STORY-121's own Out-of-scope section names this seam in as many words: *"What a change
record contains and what the change count means — CAP-99's; this story owns only that those
questions answer over a store with no filesystem."*

**The two counters are deliberately different numbers, and one AC exists to say so.**

The strongest evidence that the boundary was drawn rather than blurred is AC-1388
(CAP-101): *"A site's write version is readable and advances on every write, independently
of the change count."* It requires a write that journals nothing to still move the site
version while the change count stands still. The site **write version** is CAP-101's
optimistic-concurrency token; the **change count** is CAP-99's journal cursor. AC-1388 is a
boundary-defining criterion — merging or reassigning either story would make it
unstatable.

**The nearest pair of criteria are not duplicates.** AC-1253 (CAP-99) and AC-1390 (CAP-101)
both concern a refused write, so they were checked directly:

- AC-1253 refuses on **validation** (an invalid field value) and observes that the *change
  count and change log* are unmoved.
- AC-1390 refuses on a **stale version expectation** and observes that *no page, no
  definition change and no version bump* survives — transactional rollback in the cloud
  store, on a deliberately multi-page change.

Different trigger, different store, different observable. Neither subsumes the other.

### Verification

- Both stories remain assigned to exactly one capability each; neither was silently skipped.
- No merge was performed, so no AC relationships were disturbed and no test renaming is
  required — all 16 ACs under STORY-121 and all 16 under STORY-115 keep their existing
  `story_uid`.
- No ticket writes were made for this cluster; the resolution is "confirm" for both stories.
