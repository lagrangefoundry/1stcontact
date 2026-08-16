---
uid: comment-f0667a2c
id: COMMENT-1078
type: comment
title: Claude response for uat_coverage_check report
created_by: xgd
created_at: '2026-08-16T06:16:35.280128+00:00'
updated_at: '2026-08-16T06:16:35.280128+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-71ea4a83
  kind: note
---

## UAT Coverage Assessment — CAP-89 — **FAIL**

**Report**: REPORT-2079 (`report-71ea4a83`) — 2 violations, 4 warnings, 0 needs_review.

**The failure is not a coverage gap.** All 36 ACs across the capability's four stories are active per cumulative intent and substantively evidenced — 36 pass, 0 fail, 0 deprecated, 0 needs_review. Every test drives real production entry points (`cmdNew`/`cmdRender`/`cmdRepro`, `cmdFontsCheck`, `cmdColors`/`cmdColorsAssign`, `run(argv)`, a real HTTP GET against a started builder) against real on-disk trees. Nothing internal is mocked; nothing is structural.

The two violations are **story-body drift**, which Step 2a scores as `stale` and Step 3 propagates to a failed capability aggregate:

| Story | Stale claim | Retired by |
|---|---|---|
| STORY-93 | Final Technical Context bullet still calls the scaffold's colours "theme-sourced" — contradicting the story's own first bullet | REQ-114 (`cd8f98c8`); verified `scaffold.ts:45-46` seeds `'#ffffff'`/`'#111827'` as literals |
| STORY-102 | "Known upstream limitation" paragraph claims the chooser shows the handle, justified by a "never wrapped locally" rule | REQ-132 (`6cb3942f`); verified `apps/control-app/src/builder/image-picker.js` exists and is a locally-wrapped thumbnail grid with file-name labels |

Both were verified against the tree, not taken from the intent prose. They are the same two clauses report-375af0aa raised at the story level this run — I reached them independently because Step 2a can't skip a stale body, but flagged in the report that the editor should repair each **once**. Fixing those two clauses flips both stories and the capability to pass with no other work.

**Fields written**: STORY-93 and STORY-102 `pass`→`stale`; CAP-89 `pass`→`fail`. No AC field was rewritten — all 36 already held `pass`, the verdict this assessment independently reached, so re-writing would only churn ticket commits.

**Two things you should know:**

1. **The suites were not executed.** Every runner is denied by this session's allowlist — `npx vitest`, `xgd quality run`, `npm`, `pnpm`, `node <script>` (each attempted). Verdicts are reading-based, which is the right basis for judging *coverage*, but cannot catch a runtime regression in the code these tests drive. Last recorded execution (2026-08-10) was 35/36 passing, 1 skipped. Adding `Bash(npx vitest*)` would close this.

2. **`.xgd/uat_index.json` is empty on this branch** (`"acs": {}`), so the AC→test lookup the prompt prescribes returns nothing for every AC. I recovered the mapping by grepping `test_UAT_AC<n>_` across `tests/` — exactly 36 tests, one per AC, no number appearing twice. An assessor trusting the index would read it as "no tests exist."

One leftover: `.xgd/tmp/uat-coverage-b4ac88fc.md` (the report body I passed via `--body-file`) could not be deleted — `rm` is denied in this mode. It's under the gitignored `.xgd/tmp/`, so it won't be committed.
