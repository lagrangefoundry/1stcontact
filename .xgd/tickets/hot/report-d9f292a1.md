---
uid: report-d9f292a1
id: REPORT-5283
type: report
title: 'Resync resolve conflicts: b6b7f564f0bf1ee0904f0b6aa25ee3ca053055f0'
created_by: xgd
created_at: '2026-09-28T03:52:10.963048+00:00'
updated_at: '2026-09-28T03:52:10.963048+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/bug-23d1ec27.md` — **UU**, intent/bookkeeping ticket (BUG-39), sparse-excluded (`.xgd/tickets/**`, DOC-986 §2/§4.1). Resolved through the index: `git checkout --ours` then `git add --sparse`.

  Rule applied: **§2e — "one side a strict superset: keep the superset"**, with the per-fact tie-break agreeing on every fact where the two sides differ.

  Incoming commit `7f1350e9a5` (Aug 25 16:28:10 -0700 — one second after the preceding pick `0941885b7b`) is a **single-field estimate write**: `last_field_updated: story_points`, and it adds `story_points: 3` to `fields`. `status` is untouched by it, staying at `free_coded`.

  I diffed the two blobs in full (`git diff --no-index 2d6d161713 52bab41fee`), so the table below is the complete delta — there is nothing else between them:

  | fact | incoming `7f1350e9a5` | ours (HEAD) | decision |
  |---|---|---|---|
  | `updated_at` | Aug 25 23:28:10 | **Aug 31 05:05:09** | ours — later |
  | `last_field_updated` | `story_points` | `status` | ours — the composed result's most recent *event* is ours' bundling |
  | `status` | `free_coded` (unchanged by this commit) | **`bundled`** | ours — later, and `bundled` is strictly downstream of `free_coded` |
  | `fields.story_points` | **adds `3`** | **already present, `3`** | no loss either way — this is incoming's only substantive contribution |
  | `fields.bundled_in` | absent | `bundle-8eef3846` | ours — superset, post-bundling only |
  | `fields.commits` / `fields.version` | present | present, identical | no conflict |
  | body (lines 27–166) | unchanged | **byte-identical to incoming** | no diff hunk at all |
  | EOF | no trailing newline (`\ No newline at end of file`) | trailing newline present | ours — well-formed |

  Incoming-wins would have regressed `bundled` → `free_coded` and dropped `bundled_in` while contributing a `story_points: 3` that ours already holds — strictly worse, nothing gained.

## Incoming changes preserved

**Yes — nothing from incoming is absent.** The one line this commit adds, `story_points: 3`, appears in the `git diff --no-index` output as **context**, not as a removal, which is direct evidence it is present verbatim in the resolved version. The only four differences the full-blob diff reports are ours' later `updated_at`, ours' `last_field_updated`/`status` pair, ours' extra `bundled_in` key, and the trailing newline.

The body region produces no diff hunk, confirming the composition from pick `163924e9fd` (REPORT-5281 — ours' frontmatter + incoming's intact body) is still the `ours` side as blob `52bab41fee`: the recovered markdown table, ` ```ts ` fence tag and repaired bold span remain in place.

No hunk was dropped, and the BUG-1301 precedence exception was neither invoked nor needed. No code, test, or spec-ticket (`story-`/`acceptance_criterion-`/`capability-`) files were in conflict, so STEP 3's code verification is not applicable to this pick.

## Note for the finalize step

This pick is **empty**: the staged blob and the `HEAD` blob are both `52bab41feef14c15dce46fe47aac7b19ab0f59e8`, and `git status --porcelain` / `git ls-files -u` are both empty. Per STEP 4 it was **not** skipped here. `CHERRY_PICK_HEAD` is intact at `7f1350e9a56fc0c6292aa72c851b34a80dda8aae`; no `--continue`/`--skip`/`--quit`/`--abort` was run.
