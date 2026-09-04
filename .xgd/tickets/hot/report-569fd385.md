---
uid: report-569fd385
id: REPORT-3452
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-04T01:27:08.661061+00:00'
updated_at: '2026-09-04T01:27:08.661061+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/request-909e42f8.md` — **UU**, intent/bookkeeping ticket (rule 2e).
  Conflict existed only in the index; the path is outside the sparse-checkout cone
  (DOC-986 §2/§4.1), so there were no working-tree markers. Resolved with
  `git checkout --ours` + `git add --sparse`.

  Sides:
  - **Ours** (HEAD, `def57cbbb1` "seed_local_overlay request request-909e42f8",
    2026-09-02 10:50 -0700): `status: bundled`, adds `fields.bundled_in: bundle-203b1dc2`,
    `updated_at: 2026-09-02T17:48:26Z`, plus a whole-body markdown reflow (hard-wrap
    removal, `*emph*` → `_emph_`, blank lines between list items) produced by the
    overlay seeding.
  - **Theirs** (incoming `a4e81f7825`, "update request request-909e42f8",
    2026-08-31 20:36 -0700): `status: free_coded` → `ready_to_reconcile`,
    `last_field_updated: body` → `status`, `updated_at: 2026-09-01T03:36:07Z`,
    and removal of the trailing newline.

  Per-fact resolution (2e; the auto-enrichment noted intent is unknown on one or both
  sides, so the more recent commit by timestamp governs — ours, by two days):
  - `status`: ours. The two sides are not competing edits to the same fact so much as
    two points on one monotonic progression — `free_coded` → `ready_to_reconcile` →
    `bundled`. HEAD sits one step further along, and its `bundled_in` names
    `bundle-203b1dc2`, the very bundle this reconcile run is replaying. Taking the
    incoming value would rewind the ticket behind the run that is reading it and drop
    its bundle membership.
  - `updated_at`: ours (strictly newer).
  - `last_field_updated`: identical on both sides (`status`).
  - `fields.bundled_in`: ours-only addition; no incoming counterpart, kept.
  - Body prose: verified equal, not assumed. A markup-normalized word-level diff of the
    two blobs (1562 vs 1563 tokens) shows exactly one difference across the whole body —
    the `js` language tag on one fenced code block, which the HEAD-side reflow dropped.
    That tag is present in the merge base and untouched by the incoming commit, so its
    loss is HEAD-side reflow drift, not incoming content being discarded. No paragraph,
    bullet, or sentence exists on one side and not the other.

  No content was invented, and no `intent_uid` / `story_uid` / `capability_uid` field was
  touched (none are present on this ticket).

## Incoming changes preserved

No code or implementation files were in conflict — the incoming commit `a4e81f7825`
touches exactly one file, this bookkeeping ticket (4 insertions, 4 deletions, all
frontmatter plus a trailing newline). Every fact it carries is present in the resolved
file, or superseded forward by HEAD along the same axis:

- `last_field_updated: status` — present verbatim.
- trailing newline removed — present; the resolved file's final byte is `n`, no EOL.
- `updated_at` bump — present via a strictly later timestamp (2026-09-02T17:48:26Z >
  2026-09-01T03:36:07Z).
- `status: ready_to_reconcile` — superseded, not discarded. HEAD carries `bundled` plus
  `bundled_in: bundle-203b1dc2`, which is the state `ready_to_reconcile` transitions
  into and which this reconcile run itself produced. The incoming intent ("this ticket
  is done coding and ready to reconcile") is realised in HEAD by a later route.

No hunk was dropped under the BUG-1301 precedence exception; that exception was not
needed and was not used. No test file was involved.

## Note on the net-zero staged diff

The resolution leaves no staged difference against HEAD (`git diff --cached --stat HEAD`
is empty), because HEAD already holds the later state of every fact the incoming commit
set. Per STEP 4 this is not a failure and `--skip` was not called; the finalize step will
detect the clean staged diff and skip the commit. STEP 3's discard check was applied and
passed on its own terms: the incoming commit's changes are present in HEAD via a
different route (a forward status transition), rather than merely absent.

`git ls-files -u` is empty (0 unmerged entries) and `CHERRY_PICK_HEAD` is intact.
