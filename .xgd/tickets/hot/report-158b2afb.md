---
uid: report-158b2afb
id: REPORT-4387
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T10:45:19.342641+00:00'
updated_at: '2026-09-19T10:45:19.342641+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-26dafd83.md` (REQ-165) — **UU**, out of the
  sparse-checkout cone. Class **2e (intent/bookkeeping ticket**, `request-*`).
  Two conflicted hunks, both frontmatter only; the body merged clean.

  - **Hunk 1 — `updated_at` / `last_field_updated` / `status`.** Same fact,
    changed differently on each side: HEAD `updated_at 2026-09-09T21:32:49Z`,
    `status: bundled`; incoming `updated_at 2026-09-01T18:35:52Z`,
    `status: free_coded`. Genuine per-fact conflict → timeline rule. HEAD's
    last commit on this file is `2cf37792fd` *(seed_local_overlay, 2026-09-09
    14:35:22 -0700)*; incoming is `e4ba03047c` *(update, 2026-09-01 11:35:52
    -0700)* — HEAD is 8 days later, and `bundled` is downstream of
    `free_coded` in the ticket lifecycle. **Kept HEAD.** Taking incoming would
    rewind REQ-165 out of its bundle.
  - **Hunk 2 — `fields.bundled_in: bundle-87be4669`.** Present on HEAD only;
    the incoming side predates bundling and never carried the field. This is a
    non-overlapping, HEAD-only field, not a competing fact → **kept** under
    2e's "apply both / keep the superset" rule. Nothing from the incoming side
    is displaced by it.

  This matches the auto-enriched resolution rule for the file ("take the more
  recent commit by timestamp"). No content was invented, and no
  `intent_uid` / `story_uid` / `capability_uid` field was touched.

## Incoming changes preserved

The incoming commit `e4ba03047c` changed three things in this file. Checked
against the resolved working tree:

1. **`fields.commits` (3 entries: `52fd6302cc`, `9ae7338430`, `c2f6c582ad`) and
   `fields.version: 0.2.31`** — the commit's substantive payload. **Present.**
   These merged cleanly (they are additions HEAD never touched) and are intact
   at lines 25–35 of the resolved file; they were never inside a conflict
   region.
2. **`status: free_coding` → `free_coded`, `last_field_updated: body` →
   `status`** — **present via a different route, not discarded.** HEAD has
   already advanced past `free_coded` to `bundled` along the same lifecycle
   axis, and carries `last_field_updated: status` identically. The incoming
   advancement was absorbed by the later HEAD-side state rather than dropped.
3. **Removal of the trailing newline at EOF** — not carried; HEAD's
   newline-terminated form kept. Whitespace-only, no semantic content.

No BUG-1301 precedence exception was invoked — no hunk's target was deleted on
the HEAD side, and no test function on either side was removed.

## Note for post-merge review

Per the enrichment metadata ("flag this file for post-merge review"):
REQ-165's frontmatter now reads `status: bundled` /
`bundled_in: bundle-87be4669` with `version: 0.2.31` and the three
`working_sha` entries from the incoming commit — i.e. the bundled state on top
of the free_coded commit record. That is the intended combination, but worth a
confirming glance since the two sides disagreed on the lifecycle scalar.

## Staging

`git status --porcelain` is empty: the UU entry is gone and the resolution nets
to no diff vs HEAD — the incoming commit's payload had already reached this
branch by another route (BUG-1109/BUG-1122 shape). Per STEP 4 this is staged
and exited normally; `--skip` was **not** called. `CHERRY_PICK_HEAD`
(`e4ba03047cff470de03992a131e5498336efb914`) is intact for
`cherry_pick_finalize_resolution`.
