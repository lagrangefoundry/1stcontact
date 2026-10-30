---
uid: report-fc9b7dba
id: REPORT-5282
type: report
title: 'Resync resolve conflicts: b6b7f564f0bf1ee0904f0b6aa25ee3ca053055f0'
created_by: xgd
created_at: '2026-09-28T03:49:39.996331+00:00'
updated_at: '2026-09-28T03:49:39.996331+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/bug-23d1ec27.md` — **UU**, intent/bookkeeping ticket (BUG-39), sparse-excluded (`.xgd/tickets/**`, DOC-986 §2/§4.1). This time the path did **not** materialize in the working tree — `grep` on it returned `No such file or directory`, so the conflict existed purely as index stages and was resolved through the index: `git checkout --ours` then `git add --sparse`.

  Rule applied: **§2e — "one side a strict superset: keep the superset"**, with the per-fact tie-break confirming the same answer where the two sides differ.

  Incoming commit `0941885b7b` (Aug 25 16:28 -0700) is the **free_coded promotion**: it advances `status` to `free_coded` and records the implementation sha and version. I diffed the two blobs in full (`git diff --no-index`), so the delta below is the complete list — there is nothing else between them:

  | fact | incoming `0941885b7b` | ours (HEAD) | decision |
  |---|---|---|---|
  | `updated_at` | Aug 25 23:28:09 | **Aug 31 05:05:09** | ours — later |
  | `last_field_updated` | `status` | `status` | no conflict, sides agree |
  | `status` | `free_coded` | **`bundled`** | ours — later, and `bundled` is strictly downstream of `free_coded` |
  | `fields.commits` | adds `working_sha: 759cd874…`, `reconcile_sha: null`, `main_sha: null` | **already present, byte-identical** | no loss either way |
  | `fields.version` | adds `0.2.15` | **already present, `0.2.15`** | no loss either way |
  | `fields.story_points` / `fields.bundled_in` | absent | `3` / `bundle-8eef3846` | ours — superset, post-bundling only |
  | body (lines 27–166) | unchanged from base | **byte-identical to incoming** | no diff at all |
  | EOF | no trailing newline (`\ No newline at end of file`) | trailing newline present | ours — well-formed |

  The two facts incoming actually contributes, `commits` and `version: 0.2.15`, are **already in ours verbatim** — same `working_sha` `759cd87405a4b50f81995b2c9b510bf23be54fbd`, same `reconcile_sha: null` / `main_sha: null`, same version string. So incoming is a strict subset of ours here, and ours' `status: bundled` is the downstream continuation of the very `free_coded` step this commit performs. Incoming-wins would have regressed `bundled` → `free_coded` and dropped `story_points` and `bundled_in` while leaving the ticket otherwise unchanged — a strictly worse record with nothing gained.

## Incoming changes preserved

**Yes — nothing from incoming is absent.** Verified mechanically: `git diff --no-index <incoming blob 4fc9bbb960> <ours blob 52bab41fee>` yields exactly four differences — the later `updated_at`, the downstream `status`, ours' two extra `fields` keys, and the trailing newline. Every line incoming *adds* (`commits:`, `working_sha`, `reconcile_sha`, `main_sha`, `version: 0.2.15`) appears unchanged in the resolved version; the diff shows them as context, not as removals.

The body is byte-identical between the two sides — the full 140-line body region produces no diff hunk. This confirms the composition I made in the previous pick (`163924e9fd`, REPORT-5281: ours' frontmatter + incoming's intact body) survived into HEAD as blob `52bab41fee` and is now the `ours` side, so the recovered markdown table, ` ```ts ` fence tag and bold span are all still in place.

No hunk was dropped, and the BUG-1301 precedence exception was neither invoked nor needed. No code, test, or spec-ticket (`story-`/`acceptance_criterion-`/`capability-`) files were in conflict, so STEP 3's code verification is not applicable.

## Note for the finalize step

This pick is **empty**: the staged blob and the `HEAD` blob are both `52bab41feef14c15dce46fe47aac7b19ab0f59e8`, `git status --porcelain` is empty and `git ls-files -u` is empty. Per STEP 4 it was **not** skipped here. `CHERRY_PICK_HEAD` is intact at `0941885b7b737d3fb116a27589ab86cd535d2dd3`; no `--continue`/`--skip`/`--quit`/`--abort` was run.
