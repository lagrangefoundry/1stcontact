---
uid: report-34018ef9
id: REPORT-3421
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-04T00:12:52.716942+00:00'
updated_at: '2026-09-04T00:12:52.716942+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/request-78370159.md` — **UU**, intent/bookkeeping ticket
  (rule **2e**, strict-superset branch). Out of the sparse-checkout cone
  (DOC-986 §2), so the conflict existed only in the index with no working-tree
  markers; resolved with `git checkout --ours` + `git add --sparse`.

  - **Incoming** (`0d29fbb5`, `xgd(ticket): update request request-78370159`,
    2026-08-31 15:57 -0700) changed exactly three things vs the merge base:
    the `shadow` → `description` rename in two body paragraphs, an
    `updated_at`/`last_field_updated: body` bump, and a trailing newline at EOF.
  - **Ours** (`9b278972`, `xgd(ticket): seed_local_overlay request
    request-78370159`, 2026-09-02 10:50 -0700) contains both renamed paragraphs
    **verbatim and identically**, plus a large disjoint set of edits the
    incoming side never touched: `status: draft` → `bundled`,
    `story_points` 8 → 13, the `commits`/`version`/`bundled_in` fields, and a
    substantially expanded body (the `role` field section, the promotion
    section, the origin-contract section, superseded-AC record, and the
    "Open questions — resolved" rewrite).
  - Ours is therefore a **strict superset** of incoming on every fact incoming
    changed, and is also the later-positioned side by both file `updated_at`
    (2026-09-02 vs 2026-08-31) and commit timestamp. Per-fact check found no
    fact where the two sides disagree: the only overlapping fact is the
    `shadow` → `description` rename, and both sides landed it identically.
    No content was invented; nothing from either side was dropped.

## Incoming changes preserved

Confirmed present in the resolved file:

- `description — what the system understands this to be), and the fields from
  [[DOC-38]]` (line 62) — incoming's first rename hunk.
- `classify, write the description, create the ticket, index.` (line 148) —
  incoming's second rename hunk.
- Zero remaining occurrences of the string `shadow` in the resolved blob,
  matching the incoming side exactly.

The only incoming hunk not literally reproduced is the frontmatter
`updated_at: '2026-08-31T22:57:14'` / `last_field_updated: body` pair, which
the later HEAD-side ticket operation superseded with
`updated_at: '2026-09-02T17:48:27'` / `last_field_updated: status` while
bundling the request into `bundle-203b1dc2`. That is the per-fact timeline rule
in 2e resolving in ours' favour on a bookkeeping scalar, not a discarded
developer edit.

No BUG-1301 precedence exception was needed. No code, test, or UAT files were
involved in this conflict.

**Net staged diff vs HEAD is empty.** This is the BUG-1109/BUG-1122 redundant
case described in STEP 4, not a STEP 3 discard: incoming's substantive change
is present in HEAD (via the later `seed_local_overlay` commit that carried the
identical rename), rather than absent. Staged and exiting normally; the
finalize step will detect the clean staged diff and skip the commit.
`CHERRY_PICK_HEAD` (`0d29fbb5`) left intact — no `--continue`/`--skip`/
`--quit`/`--abort` was run.
