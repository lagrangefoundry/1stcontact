---
uid: report-dc4026c7
id: REPORT-1064
type: report
title: 'Resync resolve conflicts: f5f29fb9f01dfd222dd5a744af7374b1e371be99'
created_by: xgd
created_at: '2026-07-29T06:49:15.622269+00:00'
updated_at: '2026-07-29T06:49:15.622269+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-510318c4
---

## Files resolved

- `packages/framework/src/l1/render.ts` — **UU on code file** (rule 2c: incoming authoritative, integrate non-overlapping). Incoming `126e06e90` (REQ-98) replaces the `box` case's inline surface CSS with the shared `surfaceDecls()` emitter. Ours (`resync-510318c4` HEAD, rooted on main) had independently rewritten the same block via `4d0985957`, which introduced `cssUrl()` as the **sole CSS `url()` sink** (scheme allowlist + `CSS_URL_ALLOWED` character allowlist).

  Resolution: took the incoming structural change verbatim in the `box` case, then integrated ours' non-overlapping hardening into the incoming shared emitter. The overlap was NOT inside the marked conflict region — git auto-merged the new `surfaceDecls()` function cleanly, and that function carried the *pre-hardening* construction `url("${escapeHtml(a.backgroundImageUrl!)}")`. Taking incoming wholesale would have silently reverted a main-rooted security fix into the one emitter now shared by all node kinds — the `[FREE-CODED]` overwrite hazard CLAUDE.md warns about, and a DOC-2 §2 violation (`escapeHtml` leaves newlines intact; a newline terminates a CSS string). `surfaceDecls()` now routes the background URL through `cssUrl()`. Nothing incoming was discarded — only the URL sink was upgraded.

  Note: the enrichment metadata's default rule ("take the more recent commit by timestamp, flag for post-merge review") was not applicable — both sides' intent was determinable from the code, and a timestamp pick would have dropped one side's substance. Rule 2c (integrate; incoming wins only where mutually exclusive) applied instead. No post-merge review flag needed.

- `packages/site-schema/src/l1/schema.ts`, `types.ts`, `validate.ts`, `tools/generate/src/l1/assets.ts` — auto-merged clean, no markers. Reviewed `validate.ts` explicitly (it is where the two sides' envelope checks could have collided): incoming is a strict widening — the shared surface group is bounded once for every kind, and it *adds* two checks ours lacked (`borderLeft.widthPx`, previously unbounded on every kind; the `backgroundImageUrl` scheme check, previously `box`-only). No loss.

- `tools/generate/src/l1/fold.ts` — auto-merged clean for this pick (type rename only, `L1BoxAxes` → `L1SurfaceAxes`). Separately repaired a **pre-existing** duplicate `isSafeUrl` import in the import block, introduced by an earlier resync pick (`2193232bb`) and never caught because `tools/generate` is not in the `pnpm -r build` tsc scope. It was a hard parse error (`Identifier 'isSafeUrl' has already been declared`) that failed **86 of 122 test files**, making this pick unverifiable. One duplicate line removed; import list now matches the incoming commit's ordering.

## Incoming changes preserved

Verified against `git show 126e06e90 -- <file>`:

- `render.ts` — all five incoming `surfaceDecls()` call sites present and at the correct kinds: text `:725` (with the `{ fill: !a.gradientFill }` opt), image `:799`, slot `:815`, box `:823`, container `:841`; shared emitter defined at `:282` with the incoming `L1SurfaceAxes` signature. Every per-kind inline copy the commit deletes is gone.
- Schema/types/validate/assets — `L1BoxAxes` / `l1BoxAxesSchema` return zero hits repo-wide, confirming the incoming rename and single-declaration refactor landed whole.
- `tests/req98-uniform-surface-axes.test.ts` — added intact (405 lines), passing.

## Verification

- `pnpm -r build` — clean.
- Full suite: **845 passed, 7 failed** (was 188 passed / 1 failed while the fold.ts parse error was masking the suite).
- REQ-98's own tests plus the surface/CSS-url guard suites (`req91-l1-pixel-mover-axes`, `bug11-fold-surface-fill`, `bug13-fold-section-background`, `req90-l1-font-resources`, `reconciliation-l1-language`): **47 passed, 0 failed**. This includes `req91-l1-pixel-mover-axes.test.ts:242`, the raw-newline CSS-escape payload that specifically guards the `cssUrl()` sink preserved above.

The 7 remaining failures are pre-existing and unrelated to this pick:

- **3 ENOENT** on `storage/references/gigabytealchemy.ai/index/multistate.json` (`bug17-fold-padding`, `req96-control-composition` x2) — environmental; the reference captures are absent from this resync worktree.
- **4 assertion failures** (`reconciliation-1c-astro-free-render`, `reconciliation-3probe-gate`, `reconciliation-3probe-gate-evaluator`, `reconciliation-l1-fold-full-language`) — causality established empirically, not assumed: reverse-applied this pick in the worktree and re-ran, and **all four fail identically at the pre-pick branch HEAD**. Symptoms (an extra `slot` leaf, a missing `field` residual) point at the earlier REQ-93/REQ-96 picks in this resync, not at REQ-98's purely additive surface axes. Worktree state was restored exactly afterward.

Staging: no conflict-class lines remain; net change vs HEAD is non-empty (7 files, +609/-172). `CHERRY_PICK_HEAD` (`126e06e90`) left intact — no `--continue` / `--skip` / `--quit` / `--abort` was run.
