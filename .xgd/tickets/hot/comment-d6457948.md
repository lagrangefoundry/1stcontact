---
uid: comment-d6457948
id: COMMENT-1338
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-08-20T16:34:08.035925+00:00'
updated_at: '2026-08-20T16:34:08.035925+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-88982a68
  kind: note
---

Done. One violation, one mutation.

## What I did

**Verified the premise before acting.** The report's own caution is that the two previous fix attempts failed because the capability boundary was drawn from a prior report's assertion about provenance rather than from the code. So I read the disambiguating commit directly — `git show 2b902ead0^:tools/generate/src/cli/preview.ts`, immediately before the port landed. It confirms every element of the claim under dispute already existed there:

- `DraftSnapshot.stamp` with its "picked up on the next request rather than needing the server restarted" docstring
- `PreviewRenderer`'s "memoised per `(slug, channel)` and invalidated by the store's stamp … checked before the cache is read, not on a timer"
- the `Map<string, {stamp, rendered}>` cache and `if (hit && hit.stamp === snapshot.stamp) return hit.rendered`
- the per-request re-ask, `const snapshot = this.store.load(slug)` inside `file()`

REQ-142 changed the interface those read through (`DraftStore` → `SiteStore`) and the snapshot payload shape. The mechanism itself is REQ-119's. Deletion was the right call, not a third re-scope.

**AC-1327 (`acceptance_criterion-16093733`)** — deleted bullet 4 and the final Verification sentence. I also rewrote the hand-off paragraph, because its closing sentence ("This capability owns only the store-shaped half: that the preview asks the store again, and trusts the store's stamp…") restated the same misattribution in prose — the per-request re-ask is REQ-119's too. The paragraph now hands off mechanism as well as outcome and cites `2b902ead0^`, so a future pass reading only `origin/main` can't re-derive the same wrong conclusion from the moved lines. Bullets 1–3 and their three Verification sentences are preserved byte-for-byte.

**Checked for parallel edits, found none needed.** STORY-118's full body (10,971 chars) has no freshness claim of its own — its only hit is the Technical Context line handing freshness to CAP-85, which the deletion makes the AC tree consistent with. I also scanned all eleven sibling ACs for residual cache/invalidation/staleness language: zero hits, so the four-instance pattern the report tracks has no fifth instance latent. AC-1033, AC-1321's stamp clause, and AC-1329 all left untouched per findings 3, 7 and the explicit instruction.

**No tests run, and that's not a gap I'm papering over:** per finding 6 this worktree's HEAD predates BUNDLE-19's merge, so the port modules don't exist here and the tests these ACs describe can't be hosted. The mutation is ticket-only anyway.

Completion report filed as REPORT-2473 (`report-88982a68`) — `fixes_applied: 1`, `progress_made: true`, `needs_more_work: false`, `violations_remaining: 0`. Findings 5 and the AC-1033 exclusivity warning are carried forward in it as uat-level items.

One thing worth flagging: the ticket store's git push failed (`Broken pipe` — offline). The commit landed locally, so the assessor will see it, but the remote is behind until something pushes.
