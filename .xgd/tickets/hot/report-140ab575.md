---
uid: report-140ab575
id: REPORT-4374
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T10:09:24.261844+00:00'
updated_at: '2026-09-19T10:09:24.261844+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-13a5e206.md` — class **UU**, rule **2e** (intent/bookkeeping
  ticket; `request-*` is user-authored content, not matrix state). Resolved to the
  HEAD side as a strict superset. Staged via `git checkout --ours` + `git add --sparse`.

Incoming commit: `40765e3d` *xgd(ticket): update request request-13a5e206*
(free_coded, 2026-08-31 14:40 -0700). Both sides carried the identical subject, so
the auto-enrichment reported "intent unknown"; the per-fact comparison below settles
it without needing a whole-file timeline pick.

Two conflict regions, both resolved toward HEAD:

1. **Frontmatter lifecycle scalars** (`updated_at`, `completed_at`,
   `last_field_updated`, `status`) — the SAME facts changed differently on each side,
   so 2e's per-fact timeline rule applies. HEAD carries the later position:
   `updated_at 2026-09-02T01:34:36` / `completed_at 2026-09-02T01:34:00` /
   `status: free_and_reconciled`. Incoming carries the earlier state it was authored
   at: `updated_at 2026-08-31T21:40:00` / `completed_at: null` / `status: free_coding`.
   Taking incoming here would have demoted an operator-owned status backwards and
   dropped `completed_at`.
2. **Final body line** (`Cloudflare does not.`) — byte-identical on both sides; a
   trailing-newline artifact, not a content difference. No-op either way.

HEAD additionally carries fields incoming never touched (`commits`, `version: 0.2.20`,
`orphan_commits`, plus appended comments — 538 lines of frontmatter vs the base's 16).
Incoming touched none of them, so nothing from either side was dropped.

## Incoming changes preserved

Verified by diffing all three index stages (base `eb6694f0`, ours `e909dcbb`,
theirs `914093b0`) rather than reading conflict markers alone.

The incoming commit made exactly three changes to this file:

- the `updated_at` bump — superseded per fact 1 above;
- a stray blank line inserted after the frontmatter terminator — pure formatting
  churn, no content;
- the substantive change: a **109-line `## What landed (free-coded, 2026-08-31)`
  section** appended to the body, with its `### Evidence`, `### Collateral`, and
  `### Not done here` subsections and the closing operator note about
  `wrangler r2 bucket create 1stcontact-material`.

That section is present **verbatim** in the resolved file at lines 733–836, confirmed
against HEAD:

    git grep -c "What landed (free-coded, 2026-08-31)" HEAD -- .xgd/tickets/hot/request-13a5e206.md
    HEAD:.xgd/tickets/hot/request-13a5e206.md:1

No hunk was dropped, so the BUG-1301 precedence exception was not invoked and is not
relied on anywhere in this resolution. No code, test, or UAT files were involved.

## Net result

The staged tree is identical to HEAD (`git diff --cached --stat HEAD` is empty). This
is the redundant-commit case, not the discarded-commit case: STEP 3's discriminator
holds — the incoming commit's key change is *present* in HEAD, having already reached
the reconcile branch by another route, rather than absent. Per STEP 4 (BUG-1109 /
BUG-1122) this is staged and exited `@done` as normal; `--skip` was not called and the
cherry-pick sequencer state is untouched — `CHERRY_PICK_HEAD` still reads `40765e3d6b`
for `cherry_pick_finalize_resolution`.
