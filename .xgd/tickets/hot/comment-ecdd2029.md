---
uid: comment-ecdd2029
id: COMMENT-2506
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-09-10T09:32:44.068462+00:00'
updated_at: '2026-09-10T09:32:44.068462+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-f037e464
  kind: note
---

All five actionable findings closed in three ticket mutations. Completion report: **REPORT-3707** (`report-f037e464`) — `progress_made: true`, `needs_more_work: false`, `violations_remaining: 0`.

**What changed**

- **CAP-85 body** (findings 2 + 3, the one edit the assessor said resolves both). The "workspace origin" scope bullet no longer claims the editing client's no-drift property or the write path's "thin transport that adds no semantics" — both now defer explicitly to CAP-87 (AC-1006) and CAP-86 (AC-992), keeping only "reachable here" for this capability. Scrubbed the Out-of-scope "Edit semantics" bullet in parallel. No AC added to STORY-99 — that would have converted two coverage violations into two exclusivity violations.

- **STORY-99 body** (findings 1, 4, 5). Withdrew "the deployed origin has one store per account, so the two are equivalent there" and rewrote the reuse passage to describe reuse where it is real: across requests behind the local front door, and nowhere at the deployed origin, which rebuilds the handle per request so the account check can't predate it. Added the BUG-37 Reconciliation Decisions block (item 2) recording the deliberate non-fix, corrected the mislabelled BUNDLE-21 header to "item 1 (BUG-36)", and added a second "Divergence noted, in commentary only" entry for the stale `router.ts:76-77` comment.

- **AC-1033 body** (finding 1's ac-edit half). Same correction to the criterion prose; Verification section left byte-identical, so its passing UAT still proves it.

**Verified before writing, not just asserted:** `store.ts:79-96` documents `storeFor` as constructed per request with the tenant-check rationale, `router.ts:70-82` carries the contradicting comment, BUG-37's ~77 ms × 5 measurement and its explicit refusal to re-key, and the existence of AC-1447/1448/1006/992. Re-read all three bodies after writing to confirm the updates landed. No code or test changed.

**Forwarded, not acted on:** AC-992's Verification still describes the pre-REQ-119 on-disk arrangement — that's CAP-86's cycle, out of this scope. And the thin-provenance note (no `intent_uid` anywhere on this capability) is left for the operator; every candidate value would be reconstructed from bundle membership, and backfilling on a guess would put fabricated provenance in the matrix.
