---
uid: report-7246d5f6
id: REPORT-3409
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-03T23:44:40.309856+00:00'
updated_at: '2026-09-03T23:44:40.309856+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/request-909e42f8.md` — **UU**, intent/bookkeeping ticket (STEP 2 rule **2e**), sparse-excluded so the conflict existed only in the index with no working-tree markers (DOC-986 §2/§4.1). Resolved with `git checkout --ours` + `git add --sparse` on 2e's **later-positioned-intent** branch, applied per-fact.

  Incoming `1bc13abacf` (`xgd(ticket): update request request-909e42f8`, 2026-08-31 14:54:37 -0700) changed three frontmatter facts vs the merge base:

  | fact | ours (HEAD) | incoming |
  |---|---|---|
  | `status` | `bundled` | `free_coding` |
  | `updated_at` | `2026-09-02T17:48:26` | `2026-08-31T21:54:37` |
  | `last_field_updated` | `status` | `status` (identical — not contested) |

  Only `status` is genuinely contested. Ours is the later side on every independent measure:

  - **Commit timestamp** — ours `def57cbbb1` (`seed_local_overlay`) is 2026-09-02 10:50:06 -0700, ~2 days after incoming's 2026-08-31 14:54:37 -0700. This is also what the auto-enriched metadata's own fallback rule ("take the more recent commit by timestamp") selects.
  - **`updated_at` frontmatter** — 2026-09-02 vs 2026-08-31, same ordering.
  - **Lifecycle position** — ours is downstream of, not competing with, incoming. The HEAD-side ticket carries `fields.commits` holding the free-coding working SHAs (`858d63202f`, `c056002a52`), `fields.version: 0.2.22`, and `fields.bundled_in: bundle-203b1dc2`. Free-coding demonstrably ran to completion and the ticket then advanced into the very bundle now being reconciled.

  On every other fact ours is a strict superset: it already contains incoming's `fields.chat_comment: comment-6fb39b2a` (landed by the preceding working commit `9a6417c0b0`, resolved at scope `119/0`), and adds `fields.commits`, `version`, `bundled_in`, the reflowed request prose, and the appended `# What landed` implementation record — none of which the incoming side touches.

  Taking incoming's `status: free_coding` would have reverted operator-set lifecycle state and de-bundled the ticket in the middle of its own bundle's reconcile.

## Incoming changes preserved

No code, test, spec-ticket, or config files were in this conflict — the sole conflicted file is a bookkeeping ticket, so 2c's code-authority rule does not apply and no implementation hunks were at risk.

Verified against the staged blob (`git show :<path>`): frontmatter reads `last_field_updated: status` / `status: bundled` / `updated_at: 2026-09-02T17:48:26.845864+00:00`.

The incoming commit's `status` transition is **superseded, not discarded** — the `draft → free_coding` step it records did occur, and HEAD carries the later terminal state of that same field plus the artifacts that step produced. This is STEP 4's BUG-1109/BUG-1122 "landed through a different route" case: HEAD's single `seed_local_overlay` commit collapsed the whole working-side progression (create → `chat_comment` → `free_coding` → … → `bundled`) into its end state. STEP 3's distinguishing check therefore reads *redundant*, not *discarded*. No hunk was dropped, so the BUG-1301 precedence exception was not invoked.

## Note: resolution nets to no diff vs HEAD

Staged and HEAD blobs are the same object (`561e1e92b81b6f120afa61c401b44316c208f90a`), as at scope `119/0` — both working-side commits to this ticket are already subsumed by the overlay. Per STEP 4 no `--skip` was issued; finalize will detect the clean staged diff.

## Caveat

`xgd ticket history request-909e42f8` returns `Ticket not found` in this worktree — the path is outside the sparse cone so there is no file for the ticket store to read, and `xgd ticket schema` produced no output for the status enum. The ordering above therefore rests on git commit timestamps, `updated_at`, and the bundling fields present in the frontmatter, not on a consulted status-enum definition. All three agree, and no `working-timeline` tie-break was needed.

`CHERRY_PICK_HEAD` (`1bc13abacfcb0d4a4346d4960a0cc65fed8e8691`) is intact; the only git writes were `checkout --ours` and `add --sparse`.
