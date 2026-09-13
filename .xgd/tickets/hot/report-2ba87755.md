---
uid: report-2ba87755
id: REPORT-4181
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-13T23:57:52.511044+00:00'
updated_at: '2026-09-13T23:57:52.511044+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-3ade1af4.md` — **UU**, intent/bookkeeping ticket (rule 2e).
  Bug ticket BUG-40, not matrix state, so 2e's simplified per-fact judgment applies
  rather than 2d's ledger replay.

  - Base (stage 1) was the empty stub: `title: Untitled`, `status: draft`, body
    `(new ticket)`. With no common content, the whole file conflicted — there was
    no auto-merged incoming text to preserve.
  - Ours (stage 2) = `xgd(ticket): seed_local_overlay bug bug-3ade1af4`
    (35bff14777, 2026-09-11T14:08:31-07:00), `updated_at: 2026-09-11T18:53:54`,
    `status: bundled`, carrying `commits`/`version: 0.2.33`/`bundled_in: bundle-8e1807f6`.
  - Theirs (stage 3) = the cherry-picked commit cda495bd6e
    (2026-09-01T12:15:17-07:00), `updated_at: 2026-09-01T19:15:17`,
    `status: free_coding`.

  **Rule applied:** 2e strict-superset. A full line-by-line diff of stage 3 against
  stage 2 shows ours contains every section of the incoming version in a later,
  refined form. Ours is also the more recent commit by timestamp (2026-09-11 vs
  2026-09-01), which independently matches the enrichment's stated resolution rule.
  Resolved to ours.

  **Incoming text absent from the resolution, and why:** only prose the developer
  themself retracted in their own later revision —
  - Cause 2's heading "environment, no code change" and its trailing "Note for
    later: nothing in the suite builds these assets ... worth a ticket of its own"
    are superseded by ours' "environment, plus one real defect", which resolves
    that deferred note by documenting the actual fix (`1c assets` was `rm -rf`-ing
    `dist-assets/` before refilling it; the build now stages into
    `dist-assets.staging/` and swaps once whole).
  - Cause 3's "ten UATs" becomes "eleven UATs" — ours adds an eighth numbered item
    (AC-964); all seven incoming items are present and expanded.
  - The Test plan's "plus targeted re-runs of every file named above" is replaced by
    a more specific account of what covers the new production change.
  Taking theirs would have rolled `status` back from `bundled` to `free_coding` and
  dropped the bundle/commit metadata this reconcile branch depends on.

  **Mechanics:** the path is outside the sparse-checkout cone (15% of tracked files
  present, DOC-986 §2/§4.1), so the conflict existed only in the index with no
  working-tree markers and there was no file on disk for `checkout --ours` to write.
  Resolved at index level via `git update-index --cacheinfo 100644,963294b597,<path>`,
  then `git update-index --skip-worktree <path>` to restore the `S` bit that every
  sibling under `.xgd/tickets/hot/` carries. `git ls-files -v` now reports a single
  stage-0 entry flagged `S`; `git status --porcelain` is empty.

## Incoming changes preserved

No code/implementation files were in this conflict — the single file is a
bookkeeping ticket. STEP 3's redundant-vs-discarded check was still run against it,
and it resolves to **redundant**: the incoming commit's key changes are present in
HEAD via a different route (the seeded local overlay), not absent.

Verified by grepping HEAD's blob for everything cda495bd6e introduced — every item
is present:

- frontmatter fields `severity: medium` (L18), `story_points: 5` (L19)
- `## Symptom` (L28), `## Cause 1` (L41), `## Cause 2` (L68), `## Cause 3` (L88)
- all seven numbered criteria: AC-960 (L94), AC-1055 (L102), AC-1123 (L116),
  AC-1331 (L126), AC-1336/1337/1338 (L136), AC-1341 (L146), AC-1342 (L157)
- `## Test plan` (L175)

Because stage 2's blob is byte-identical to HEAD's (`963294b597f174b85a31ffe6c471c2701699ae6d`
on both sides), the staged diff against HEAD is empty. Per STEP 4 this is expected
for a commit whose effect already landed through the overlay seed, and is not a
@fail: the content is present in HEAD, not discarded. `--skip`/`--continue` were NOT
called; CHERRY_PICK_HEAD is intact at cda495bd6e for the finalize step, which will
detect the clean staged diff and skip the commit.

No BUG-1301 precedence exception was invoked, and no test function was deleted.

**Post-merge review flag:** the enrichment classed this file's intent as unknown on
one or both sides and asked that it be flagged. Flagging it here — though the
superset relationship above is direct textual evidence, not a timestamp inference.
