---
uid: report-142ea2b5
id: REPORT-3231
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T22:14:40.358701+00:00'
updated_at: '2026-09-01T22:14:40.358701+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-REQ-162
---

## Files resolved

- `.xgd/tickets/hot/doc-4d7da14b.md` — class **AA** (both added), doc/bookkeeping ticket (rule 2e + AA rule 2b). Resolved by taking the INCOMING version in full (`git checkout --theirs` + `git add --sparse`; the path is outside the sparse-checkout cone per DOC-986 2/4.1, so plain `git add` was rejected and `--sparse` was required).

  The two sides were byte-identical except for two facts:
  1. `updated_at` — ours `2026-08-16T01:21:50.814648+00:00`, theirs `2026-08-31T19:42:51.203191+00:00`.
  2. `fields.system_kb: true` — present on ours, absent on theirs.

  Both sides changed the SAME fact (presence of `system_kb`), so this is a genuine per-fact intent conflict and the timeline rule applies. HEAD side: `c490cea814` (2026-08-15 18:21:51 -0700) added `system_kb: true`. Incoming side: `1e91206b53` (2026-08-31 12:42:51 -0700), a `free_coded` commit from xgd-working, whose operation narrative is explicit — "field: retire system_kb boolean; membership moves to doc_kind (DOC-39 3.3)". The incoming intent IS the removal of that field, and it is the later-positioned edit by 16 days. Incoming wins.

  No content was merged from the ours side because there was none to merge: outside the two facts above the ours and theirs blobs are identical (verified by diffing index stages 2 and 3 — only those two hunks). Nothing from HEAD was discarded beyond the field the incoming commit deliberately retires.

  The auto-enrichment rule for this file ("intent unknown on one or both sides — take the more recent commit by timestamp and flag for post-merge review") points the same way; the incoming commit's own free-text narrative removed the ambiguity, so this is a deliberate per-fact decision rather than a timestamp coin-flip.

## Incoming changes preserved

- `.xgd/tickets/hot/doc-4d7da14b.md` — CONFIRMED. The staged blob is `483fe76e1d`, byte-identical to index stage 3 (the incoming version). `git diff --cached HEAD` shows exactly the incoming commit's two intended changes and nothing else: `updated_at` advanced to `2026-08-31T19:42:51.203191+00:00`, and `fields.system_kb: true` removed. Every change in `git show 1e91206b53 -- <file>` is present in the resolved file.

No code/implementation files were in conflict, so no spot-check tests were applicable. No hunks were dropped; the BUG-1301 precedence exception was not invoked. No UAT test files were involved.

## Staging state

`git status --porcelain` after resolution: one entry, `M  .xgd/tickets/hot/doc-4d7da14b.md` (staged, resolved). No UU/AA/DU/UD entries remain; `git ls-files -u` for the path is empty. The 190 `??` untracked entries are the pre-existing seeded ticket overlay, untouched by this step. `CHERRY_PICK_HEAD` (`1e91206b535dafa650aa8a7d12935adb316c6816`) is intact and was not advanced, skipped, or aborted.
