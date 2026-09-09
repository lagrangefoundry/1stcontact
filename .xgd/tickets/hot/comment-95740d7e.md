---
uid: comment-95740d7e
id: COMMENT-2373
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-09-09T23:23:35.573274+00:00'
updated_at: '2026-09-09T23:23:35.573274+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-43e0f0f2
  kind: note
---

**REPORT-3580 (`report-43e0f0f2`) — FAIL: 11 violations, 3 warnings, 0 needs_review.**

## What I checked

Built the intent ledger from 25 REQ/BUG tickets across 8 bundles, read all 7 story bodies and the capability body, and **re-verified every code citation in this worktree** rather than inheriting REPORT-2096's findings.

## Verdict

**Almost nothing has been repaired since REPORT-2096 (2026-08-16).** STORY-75/76/77/78 all carry `updated_at` 2026-08-16T09:18 — the `uat_coverage` field writes that closed that cycle — and their bodies still read exactly as described then. Its 9 findings all re-confirm.

**Coverage (8 violations)** — reconciled intents live in production code inside CAP-63's own scope, expressed in no story anywhere:

| Intent | Live at | Owner |
|---|---|---|
| REQ-73 gap axis | `values-diff.ts:363, 1530, 1953` | STORY-75 |
| BUG-22 split-control attribution | `values-diff.ts:137-144, 2103, 2151` | STORY-75 |
| BUG-24 scrim via canvas probe | `extract.ts:265, 1055` | STORY-75 |
| BUG-25 per-text-node geometry | `extract.ts:676, 1106-1124` | STORY-75 |
| BUG-16 offline re-extract | `reextract.ts:50, 67, 100` | STORY-75 |
| REQ-72 in-browser hexify | `extract.ts:334, 846, 1132` | STORY-76 |
| REQ-76 cause clustering | `fidelity.ts:433-524`, `index.ts:1035` | **unhomed** |
| REQ-58 T2/A + REQ-64 `--collapse` | `fidelity.ts:199, 242, 318`, `index.ts:1018` | **unhomed** |

The two unhomed ones I checked store-wide against `.xgd/tickets/{hot,cold}` — no story file in any capability mentions them. The only other stories naming `--multi-viewport` are STORY-84 (folds a ladder into L1) and STORY-83 (explicitly out of scope).

**Consistency (3 violations)** — one carried, two new since the last cycle:

- **STORY-76** still presents its authoring half as live. Re-confirmed `resolveSurfaceGradient` has **zero production callers** (two re-exports, two test files).
- **STORY-124** *(new)* — "Filed under CAP-102" is the wrong numeral; its `capability_uid` resolves to CAP-63. CAP-63's own body flagged this as a defect it wasn't permitted to repair; the fix step is the first one that is.
- **CAP-63 body** *(new)* — Scope bullet 4 still asserts "the render path constructs an Astro container only for a page that needs one". REQ-150 (2026-08-18) retired that: no workspace `package.json` declares `astro`, `tools/generate/package.json:23` declares `vite` directly, and STORY-79 guarantee 5 is now unconditional.

Both new violations are single-clause edits, and both trace to the same pattern — REQ-150 updated the story but not the capability body; REQ-154 shipped STORY-124 with a stale numeral.

**Zero `needs_review`** — every intent is `free_and_reconciled` except REQ-154 (`bundled` inside a `free_and_reconciled` bundle), and no story cites an abandoned delivery vehicle, so Step 2.5's stale-citation case never arises. **Zero `code-issue`** — every gap is the matrix failing to describe working code, not the reverse.
