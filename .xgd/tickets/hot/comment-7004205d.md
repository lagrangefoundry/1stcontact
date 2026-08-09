---
uid: comment-7004205d
id: COMMENT-883
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-09T11:31:11.646593+00:00'
updated_at: '2026-08-09T11:31:11.646593+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-82c4d7f3
  kind: note
---

Assessment complete. **REPORT-1735 (`report-82c4d7f3`) — result: PASS** (violations 0, warnings 1, needs_review 0).

## What I checked

`capability-a12e557f` has exactly three stories — STORY-94 (deploy), STORY-95 (serve), STORY-96 (clean URLs) — carrying 36 active ACs (AC-892 … AC-927), all tracing to two `free_and_reconciled` bundles: BUNDLE-13 (REQ-110/111/113) and BUNDLE-14 (BUG-31).

**Coverage** — all 36 ACs have exactly one substantive UAT; none is a structural check. Every test drives a real entry point: `cmdDeploy`, the Worker's real `fetch(Request, Env, ExecutionContext)`, `startServe` over loopback, and a raw socket where traversal has to survive client-side normalisation. R2 is faked only at the binding.

**Consistency** — I read all 36 tests against their AC bodies. Each exercises what its AC claims, often following the AC's own `## Verification` paragraph step for step. Cross-AC delegations are honoured rather than double-counted (AC-905 defers the tree gate to AC-927; AC-906 accounts for the one header AC-910 requires).

**Executed, not assumed** — `npx vitest run` over the four files: 4 passed, 36 tests passed.

## The one warning

~32 `test_UAT_FC_*` tests across five free-coded files re-verify AC-covered scenarios *in the same shape* — `req110-r2-deploy.test.ts` is wholly subsumed by `reconciliation-deploy-snapshot.test.ts`, and similarly for req111/req113/bug31. I made this a warning, not a violation: the same pattern holds repo-wide (`req82` alongside `reconciliation-l1-substrate`, etc.), so it reads as an established convention rather than drift in these three stories. Repairing it here alone would make this capability inconsistent with every other one — it's a project-level policy call for you. No coverage would be lost either way; the AC-named UATs are equal to or stronger than their free-coded counterparts in every case I compared.

## Two things worth flagging

**AC-1018 … AC-1023** (site asset listing) surface in a naming search near this capability but belong to STORY-102 under `capability-b4ac88fc`. Excluded after checking `fields.capability_uid`, not by title.

**Tooling problem in this worktree.** `xgd ticket list --filter …` never completed — it forces a cold-index rebuild whose exclusive flock is chronically held by the running dashboard servers and dispatcher runners, failing with `index_fcntl_lock: timed out after 30000ms` on every attempt across ~40 minutes. There is no index cache on disk (`.xgd/tickets/` has no built index), so every `list` rescans ~1900 tickets from scratch. I worked around it via the fast UID path (`xgd ticket get <uid> --json`, which needs no index), resolving `id → uid` from the generated `.xgd/tickets/search/metadata.json`; all ticket content came from the API and no ticket `.md` file was read. That's a real environment defect that will hit any workflow using `--filter`, and it's worth fixing before the next capability check rather than working around again.
