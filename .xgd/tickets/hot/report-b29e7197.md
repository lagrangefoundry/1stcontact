---
uid: report-b29e7197
id: REPORT-4152
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-13T22:15:51.965698+00:00'
updated_at: '2026-09-13T22:15:51.965698+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-13a5e206.md` (REQ-162) — **UU**, intent/bookkeeping
  ticket (`request-*`), rule **2e**. **One** conflict region (frontmatter only);
  the entire prose body auto-merged. Marker edited out by hand rather than
  `git checkout --ours`, so the auto-merged incoming prose survived. Staged with
  `git add --sparse` (path is outside the sparse-checkout cone).

  Incoming commit: `1e28c676bf` (2026-08-31 14:18:42 -0700), 14 insertions /
  21 deletions — *"content edit: correct the prerequisite — REQ-104 is on
  xgd-working; only the shared artifact store is stale, so bin/install is the
  whole fix"*.

  This is the commit whose prose the preceding attempt's sibling
  (`76cd837f38`, same message, twelve seconds earlier) announced but did not
  carry, and the one identified back in attempt 92 via `git log -S` as the
  author's own retraction of the "stranded on `resync-577be0d7`" account. Here
  it arrives with its actual content.

  HEAD side: the same ticket at `status: free_and_reconciled`, `result: pass`,
  `updated_at` 2026-09-02 01:34Z.

  Resolution:

  1. **Frontmatter** (the only conflict) — same fields both sides.
     Later-positioned side wins: HEAD (2026-09-02, `free_and_reconciled`,
     `completed_at` set) over incoming (2026-08-31 21:18:42Z, `free_coding`,
     `completed_at: null`). A superseded lifecycle position, not a competing
     claim — `free_and_reconciled` is downstream of `free_coding`.

  No `fields.intent_uid` / `story_uid` / `capability_uid` touched. No content
  invented that was not on one side.

## Incoming changes preserved

Verified against `git show 1e28c676bf -- .xgd/tickets/hot/request-13a5e206.md`.

**The substantive hunk — the prerequisite rewrite — merged cleanly and is
present in full**, because HEAD already held the identical corrected text.
Confirmed by line:

- `## Prerequisite: refresh the installed component` (incoming's new heading,
  replacing `## Prerequisite: the installed component predates REQ-104`) — L566
- `fad535e8a4 [FREE-CODED] REQ-104: ticket attachments — a BlobStore port with
  typed records` — L574
- `bin/install --lang js --component ticketing --env /Users/martin/lagrangefoundry`
  — L579
- "Narrow by design — one package, no siblings, no third-party dependencies." —
  L582

And the text this commit *removes* is correspondingly absent: `resync-577be0d7`
and `a60537ee3c` return no matches, which is the intended end state of the
commit rather than a loss.

The only incoming change not taken is the frontmatter metadata, superseded as
described above — HEAD holds the furthest-advanced lifecycle state rather than
rewinding to `free_coding`.

No hunks dropped under the BUG-1301 precedence exception; none applied here.

## Note on the staged diff

The resolution nets to **no diff vs HEAD**. Redundant-commit case
(BUG-1109/BUG-1122), not a discard — and this attempt is the clearest instance
of the distinction STEP 3 draws: the incoming commit's key change is not merely
"absent and excused" but demonstrably *present* in HEAD, line by line, above.
Staged and exiting `@done`; `--skip` not called. `CHERRY_PICK_HEAD` still reads
`1e28c676bfaa8c27ff16560cb3d23e1926fd3685` for
`cherry_pick_finalize_resolution`.

No trailing-newline fix was needed this time (unlike attempts 91–94): the sole
edit was mid-file in the frontmatter, so the file's existing no-newline EOF was
left untouched.
