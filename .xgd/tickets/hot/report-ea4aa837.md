---
uid: report-ea4aa837
id: REPORT-3569
type: report
title: 'Overlap resolution: cluster 3'
created_by: xgd
created_at: '2026-09-09T23:08:58.487286+00:00'
updated_at: '2026-09-09T23:08:58.487286+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: overlap_resolution
  subject_uid: report-e37a6b4a
  cluster_id: '3'
---

## Cluster 3 Resolution

**Boundary**: Who owns canonical site bytes once the store moves to Cloudflare
**Stories resolved**: 2 (both confirmed in place — no ticket writes)

### Actions

| Story | Action | From | To | Rationale |
|-------|--------|------|-----|-----------|
| story-fde7370b (STORY-121, Cloudflare Site Store) | confirm | capability-c4c7a854 (CAP-101) | (no change) | It is a store *adapter* — the second implementation behind the port CAP-101 declares. It answers storage questions; it ships nothing to a visitor. Its own out-of-scope hands publishing, checkout and revision history to another story explicitly. |
| story-5349d01f (STORY-94, Publish to shared storage) | confirm | capability-a12e557f (CAP-82) | (no change) | It is an *act of delivery* sequenced above the port, not an implementation of it. Its technical context states the reason directly: a publish verb was deliberately kept **off** the port so the sequence lives in one place above every adapter. It pairs with the serving story in the same capability. |

### Why this overlap is acceptable

The cluster's question — "who owns canonical site bytes once the store moves to
Cloudflare" — has a clean two-part answer, and the two stories sit on opposite
sides of it:

- **CAP-101 owns the mutable draft, wherever it lives.** Site definition, pages,
  asset bytes, the change log, the site's write version, account scoping. The
  move from a directory tree to D1+R2 changes *what is behind the port*, not who
  owns it. STORY-121 is that move.
- **CAP-82 owns frozen revisions and the sequence that mints them.** Freezing a
  definition, rendering it, recording lineage, claiming a slug, and serving the
  result. STORY-94 is the operator half of that.

The seam between them is explicit and consistent in both directions, which is
what makes this an acceptable overlap rather than a contested one:

- STORY-121's out-of-scope: *"Publishing, checkout and revision history, which
  remain filesystem-backed here and move in their own story."* — it declines the
  territory.
- STORY-94's dependencies: it reaches storage *only* through the store port, and
  its technical context records that putting a publish verb on the port was
  considered and rejected. — it declines to own the port.

That is a handoff, not a duplicated claim. Neither story could absorb the other:
STORY-121 with publishing removed is still a complete story, and STORY-94 runs
unchanged against the filesystem store, the in-memory store and the cloud store
precisely because it does not know which it was handed.

### Confirming evidence: no AC contention

The two stories' acceptance criteria partition cleanly, with no pair asserting
the same behaviour:

- STORY-121 (16 ACs) — all store-layer: bindings (AC-1398), draft assembly reuse
  (AC-1447, AC-1448), account refusal and scoping (AC-1386, AC-1387), write
  version and conditional writes (AC-1388–AC-1391), asset bytes and naming
  (AC-1392, AC-1393, AC-1397), cross-store copy and parity (AC-1385, AC-1394,
  AC-1395), Workers-runtime completion (AC-1396).
- STORY-94 (7 ACs) — all publish-sequence: minting and storing a revision
  (AC-1418), the unchanged-draft no-op (AC-1419), validate-before-write
  (AC-1420), history and checkout (AC-1421), slug claiming (AC-1422), and the
  artifact's two halves (AC-892, AC-894).

No AC needed reparenting, so no test function required renaming under the
`test_UAT_AC<number>_*` convention.

### Residual note (not actioned — outside this task's scope)

CAP-82's capability body still carries an out-of-scope line reading *"the
canonical site store (delivery moves serving, not storing — site definitions
stay canonical on the operator's machine)"*. The parenthetical is stale as of
STORY-121: definitions are no longer canonical on the operator's machine on the
cloud path. The **load-bearing half of the sentence is still correct and is
exactly the boundary confirmed above** — delivery moves serving, not storing —
so the capability's scope is unchanged and no story assignment turns on it.
Flagged rather than edited: this task's permitted actions are reassign, merge and
confirm on stories, and rewording a capability body would risk colliding with a
concurrent reconcile.

### Verification

- Both stories belong to exactly one capability each (`capability_uid` unchanged:
  story-fde7370b → capability-c4c7a854, story-5349d01f → capability-a12e557f).
- Neither story was skipped; both were read in full along with all 23 ACs.
- No merges performed, so no AC relationships were disturbed.
