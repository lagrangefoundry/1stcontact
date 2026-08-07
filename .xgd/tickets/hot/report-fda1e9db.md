---
uid: report-fda1e9db
id: REPORT-1622
type: report
title: 'Fix Builder Workspace: Chrome, Origin & Display Panel (story) — attempt 3'
created_by: xgd
created_at: '2026-08-07T20:29:23.527585+00:00'
updated_at: '2026-08-07T20:29:23.527585+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-a994b8f3
  level: story
  fixes_applied: 4
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-17a279f7
---

# Fix Summary — Builder Workspace: Chrome, Origin & Display Panel (story)

**Attempt**: 3
**Fixes applied this call**: 4 findings, resolved in 1 ticket write (a merge, applied atomically)
**Violations remaining**: 0
**Needs more work**: false

This was a **restore, not a rewrite**, exactly as report-3536002c directed. The
target body was the *union* of the two parent blobs — `a1f3e5f70` (attempt 1)
and `4b8553945` (attempt 2) — so it was produced by merging both parents rather
than re-authoring any passage. No wording in any restored passage was invented.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | story-body-edit | STORY-99 (story-e674c60a) | Restored the origin's **operations** verbatim from `a1f3e5f70`: the "listing the store, publishing, and the read-and-apply steps of the write path … thin transport that adds no semantics of its own" clause in the *single workspace* bullet, plus the expected-refusal sentence carrying the write path's own code/path/hint. Also restored the Technical Context half ("carries the write path's read/apply operations as a transport … adds no rendering, no publish semantics and no edit semantics"). CAP-85's body and STORY-99 no longer contradict each other |
| 2 | story-body-edit | STORY-99 | Restored the **"An origin that is missing is not a blank page"** bullet verbatim, in its original position immediately after the *single workspace* bullet. AC-965 (`acceptance_criterion-5286c04b`, `active`) — read in full this call — holds exactly this criterion, so the active AC is again described by its own story body |
| 3 | story-body-edit | STORY-99 | Repointed both superseded references: CAP-84 → **CAP-87 (In-Page Copy Editing)** at "Displays, never produces", and "belongs to **CAP-87 (STORY-98)**" at "The editable mode is registered". `CAP-84` now occurs 0 times |
| 4 | story-body-edit | STORY-99 | Restored the **"The edit transport is one seam, claimed once"** Technical Context bullet, so STORY-100's half of the sentence (story-37a3921b lines 140–141) again has its counterpart and the seam is claimed exactly once from each side |

All four were applied in a single `xgd ticket update --body-file` so the matrix
was never in an inconsistent intermediate state.

**Attempt-2 additions explicitly preserved** (verified present after the write):
the served client code in the origin enumeration, the tab-declaration-integrity
clause, the freshness bullet, and the widened out-of-scope editing bullet. The
out-of-scope bullet is the one place the two parents genuinely conflicted; it was
merged rather than picked, so it now carries both "in what shape its answers
arrive" (attempt 1) and "never what that code does once it runs" (attempt 2).

## Finding #5 — the regression mechanism, closed

The read/write hazard that caused attempts 1 and 2 to overwrite each other was
handled procedurally this call:

- **Before writing** — diffed the intended body against
  `git show HEAD:.xgd/tickets/hot/story-e674c60a.md`. The only deletions were
  the four the report asked for (the lookalike sentence continuation, the
  out-of-scope rewording, and the two CAP-84 lines). Also diffed against
  `a1f3e5f70` to confirm the only losses there were attempt-2's deliberate
  rewrites. Nothing unaccounted for.
- **After writing** — re-read the committed blob. Counts hit the report's stated
  targets exactly: `transport` = **5** (required ≥ 5), `CAP-87` = **2**
  (required 2), `CAP-84` = **0** (required 0). Verified identically on disk and
  in `HEAD`.
- **Passage-level check** — all 9 restored passages and all 4 attempt-2
  additions confirmed present in the committed blob with line-wrap-tolerant
  matching (13/13).
- **Size corroborates a merge, not a replacement**: 12281 bytes, larger than
  both parents (11295 and 10511).
- Committed as `eaf33ada1`; working tree clean.

Note for future sessions: `xgd ticket get` **truncates its body display at
~11.7k chars** ("... (truncated, 11745 chars total)"). STORY-99 now exceeds
that, so a grep over the CLI display will report later passages as missing when
they are present. Verify against the blob, not the rendered read.

## Code Edits (if any)

None this call. Attempt 2's `NO_STORE` fix was re-confirmed untouched and the
working tree is clean. report-3536002c contains no `code-issue`, and its Notes
for the Editor explicitly direct that the code not be touched.

## needs_review Items Forwarded

None — no finding was categorized `needs_review`.

## Info-level items carried forward (no action at level=story)

| # | Element | Status |
|---|---|---|
| 7 | STORY-99 ACs — edit transport | **Now unblocked.** The assessor blocked this behind finding #1 ("an AC cannot be written for a behaviour the story body no longer describes") and marked it "none at story level". Finding #1 is now fixed, so the AC level can proceed. It should cover *reachability and the shape of the refusal* — the write path's own `code`/`path`/`hint` — never what the write path validates |
| 6 | BUG-32 (bug-5cabb340) | Still `free_coded`; `main_sha` null; this branch still reads `WEBUI_SCOPE = '@gendevlabs'`. Correctly uncounted. Lands here on promotion |
| 8 | STORY-100 line 138 | Still names "CAP-84 / STORY-98" — same superseded pointer, other capability. Left alone deliberately: out of this capability's scope, to be swept when CAP-86 is validated |
| 9, 10, 11 | REQ-44 / `/api/assets` / freshness | No action required; re-confirmed as the assessor described |
