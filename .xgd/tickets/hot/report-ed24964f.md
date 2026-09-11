---
uid: report-ed24964f
id: REPORT-3586
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-26'
created_by: xgd
created_at: '2026-09-09T23:48:45.245812+00:00'
updated_at: '2026-09-09T23:48:45.245812+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-26
---

## Files resolved

- `.xgd/tickets/hot/bug-6612c4b7.md` (BUG-37) — **UU**, intent/bookkeeping
  ticket → rule **2e**, resolved per-fact. Outside the sparse-checkout cone,
  so staged with `git add --sparse` (DOC-986 §2/§4.1).
  Incoming commit: `b0af50e157` "xgd(ticket): update bug bug-6612c4b7"
  (Martin Westhead, 2026-08-24 14:06:24 -0700).

  The incoming commit has exactly one hunk, changing two things:

  1. **Top-level `title:`** — `control-app: Edit mode **503s** with Cloudflare
     1102 …` → `control-app: Edit mode **dies** with Cloudflare 1102 …`. This
     is the commit's substantive intent. It did **not** conflict: HEAD already
     carries the retitled value, so the merged line 5 reads "dies" on both
     sides. Nothing to decide, nothing lost.

  2. **Lifecycle frontmatter (`updated_at` / `completed_at` /
     `last_field_updated` / `status`)** — the only conflicted region. Same
     fields changed differently on each side, so 2e's timeline rule applies
     per fact:
       - HEAD: `updated_at`/`completed_at` `2026-08-31T19:19:36Z`,
         `last_field_updated: status`, `status: free_and_reconciled` — set by
         `5a37f67dcd` (2026-08-31).
       - Incoming: `updated_at 2026-08-24T21:06:24Z`, `completed_at: null`,
         `last_field_updated: title`, `status: draft`.
     HEAD's intent is later by a week. Kept HEAD. Taking the incoming side
     would revert an operator-only lifecycle status from
     `free_and_reconciled` back to `draft` and null out `completed_at`,
     silently undoing the reconcile.

  No other region of the file was touched by this commit, so taking HEAD's
  version whole-file discards nothing outside the two facts above.

## Incoming changes preserved

The incoming commit is a **bookkeeping duplicate whose substantive effect is
already on HEAD** (BUG-1109/BUG-1122 shape), so the staged tree nets to no
diff vs HEAD. Per STEP 4 this is not a failure and `--skip` was not called —
finalize will detect the clean staged diff.

STEP 3's discard-vs-redundant test, applied explicitly and verified against
the staged index rather than assumed:

- `git show :.xgd/tickets/hot/bug-6612c4b7.md` confirms the resolved,
  **staged** file's `title:` is `control-app: Edit mode dies with Cloudflare
  1102 — the preview render cache never hits in the Worker` — the incoming
  commit's retitle, present verbatim. Present, not absent.
- That value reached HEAD with the overlay seed `501a0595d1`
  ("xgd(ticket): seed_local_overlay bug bug-6612c4b7"), the commit that
  created this file on the bundle branch; `git show
  501a0595d1:.xgd/tickets/hot/bug-6612c4b7.md` already reads "dies". The
  retitle therefore arrived by a different, legitimate route, which is exactly
  STEP 3's "redundant" case rather than its "discarded" case.
- The `updated_at` bump to `2026-08-24T21:06:24Z` is superseded by HEAD's
  later `2026-08-31T19:19:36Z` from `5a37f67dcd`.

No BUG-1301 precedence exception was needed this time: no hunk was dropped on
the grounds that its target had been removed. No code files and no UAT test
files were involved in this conflict.

Context: this is the immediate successor of `fe97d3bc34`, resolved in the
prior step of this same bundle (REPORT-3585) and likewise redundant. The two
form one 2026-08-24 14:06 editing burst against a ticket that HEAD already
carries in its final, reconciled state.

## Verification

- `git status --porcelain` — no `UU`/`AA`/`DU`/`UD` lines remain.
- `git ls-files -u` — empty; no unmerged index entries.
- `git diff --cached --stat HEAD` — empty (expected; see above).
- CHERRY_PICK_HEAD left intact for `cherry_pick_finalize_resolution`. No
  `--continue`/`--skip`/`--quit`/`--abort`/`reset` was run.
