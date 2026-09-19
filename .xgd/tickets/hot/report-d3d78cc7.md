---
uid: report-d3d78cc7
id: REPORT-4411
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T11:56:54.987760+00:00'
updated_at: '2026-09-19T11:56:54.987760+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-bbff35c7.md` — **UU**, intent/bookkeeping ticket
  (`request-*`), rule **2e**, "one side is a strict superset of the other —
  keep the superset". Resolved to the **HEAD (ours)** side.
  Path is outside the sparse-checkout cone (DOC-986 §2/§4.1), so the conflict
  existed only in the index with no working-tree markers; resolved via
  `git checkout --ours` + `git add --sparse`.

### Why ours is the superset

Incoming commit `9081f1b0` ("xgd(ticket): update request request-bbff35c7",
2026-09-01) added 45 body lines and bumped `updated_at`. A direct
`diff theirs ours` shows **zero differences in the body** — every paragraph the
incoming commit introduced is already present on HEAD, verbatim:

- the "The cursor must not re-report the document it stopped on" bullet
- the "A corrupt cursor costs a sweep and never a turn" bullet
- the "A conversation is never reported to itself" bullet
- the two-paragraph rewrite of the "Until they land…" passage (fan-out /
  co-ranked two-index merge)
- the "A search reaching both knowledge bases…" bullet under the acceptance list
- the "A single oversized title is clipped, not dropped" bullet under Decided

The body arrived on HEAD through the post-watermark sync. HEAD additionally
carries strictly later bookkeeping that the incoming side does not have, and
that taking the incoming side would silently revert:

- `status: draft` → `bundled`, `last_field_updated: body` → `status`
- `completed_at: null` → `'2026-09-14T10:29:11.537297+00:00'`
- `updated_at` 2026-09-01T19:54 → 2026-09-16T01:48
- `fields.commits` (working shas `e9bd703b`, `751b0706`)
- `fields.version: 0.2.34`, `fields.bundled_in: bundle-8e1807f6`

The ours side is the later-positioned intent on every field the two sides
disagree about, and the two sides do not disagree about any body fact.

## Incoming changes preserved

Confirmed. `git show 9081f1b0 -- .xgd/tickets/hot/request-bbff35c7.md` was
compared against the resolved (ours) blob: all six content additions listed
above are present. No hunk was dropped; the BUG-1301 precedence exception was
not invoked and no test function was touched.

The staged tree therefore nets to **no diff vs HEAD** (`git diff --cached
HEAD` is empty). This is the redundant-commit case of BUG-1109/BUG-1122 — the
commit's effect already landed through the sync route — not a discard: STEP 3's
test (are the incoming commit's key changes present in HEAD?) passes
affirmatively. Per STEP 4, `--skip` was **not** called; the tree is staged and
CHERRY_PICK_HEAD is left in place for `cherry_pick_finalize_resolution`.

No post-merge review flag is warranted: although the enrichment rule offered
"take the more recent commit by timestamp and flag for review" for the
unknown-intent case, the two sides turned out not to compete at all — the body
is byte-identical and only frontmatter bookkeeping differs, with ours strictly
later on every differing field.
