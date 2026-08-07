---
uid: comment-6ddf4589
id: COMMENT-803
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-07T20:36:37.890294+00:00'
updated_at: '2026-08-07T20:36:37.890294+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-774ff873
  kind: note
---

**Result: PASS** — REPORT-1623 (`report-774ff873`), level=story, 0 violations, 1 warning, 0 needs_review. Schema verified: top-level `result: pass`, `report_kind: capability_validation`, `subject_uid: capability-a994b8f3`, integer counts.

**Attempt 3's restore is real.** I verified it against the git blob rather than the fix report's own claims: `git diff a1f3e5f70 HEAD` on the story file shows **zero content deletions** (only attempt-2's additions), and `git diff 4b8553945 HEAD` shows exactly the four deletions report-3536002c asked for. The committed body is a strict superset of both parents (12281 B vs 11295 / 10511), markers hit `transport`=5, `CAP-87`=2, `CAP-84`=0, working tree clean. All four prior findings are closed:

- The origin's **operations** and the expected-refusal shape are back, and match what ships (`builder.ts:239`, `:371-378` — `CommandError` → 400 + `err.toEnvelope()`).
- **"An origin that is missing is not a blank page"** is back, so AC-965 (`active`) again has its story body; ships at `control-app/src/index.ts:26-33` (503) and `:44-49` (502).
- Both **CAP-84 → CAP-87** pointers repaired.
- **"One seam, claimed once"** restored — STORY-100 names STORY-99 for the transport and STORY-99 now carries the matching half, so it is claimed once from each side.

**Ledger re-derived independently**, sweeping all 112 requests and all 31 bugs. Nothing new touches this capability. REQ-119 is still `draft`, so the story's "deliberate and temporary" Node-origin framing isn't stale; BUG-32 is still `free_coded` with `main_sha` null and `webui.ts:33` still reads `@gendevlabs`, so it stays uncounted. Freshness intent traced to its actual source — COMMENT-601's `65b9be7a` turn ("the shell at `/` is the only response still cacheable … a hole in exactly one response is worse than none") — and the code carries `NO_STORE` on all eight routes including the hand-written shell.

**The one warning** is finding #1: no AC covers the edit transport. It was `info` in prior attempts only because it was blocked behind the story-body gap; that gap is now closed, so I raised it to `warning` (which doesn't affect pass/fail) so the AC cycle can't drop it. It should cover reachability and the refusal's shape — never what the write path validates.

**One thing worth knowing beyond this report:** `xgd ticket get` truncates the body at 11745 chars, and does so *silently in the `--json` path* — no marker. STORY-99 is 12281 bytes, so any session that greps the CLI read to verify a passage will get a false negative on the tail. That is very plausibly the root cause of the attempt-2 stale-read regression, and it is still unfixed — attempt 3 only worked around it procedurally. `.xgd/tickets/` also remains sparse-checkout-excluded in this worktree.
