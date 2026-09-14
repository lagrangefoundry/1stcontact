---
uid: report-118a65cd
id: REPORT-4182
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-14T00:00:52.808785+00:00'
updated_at: '2026-09-14T00:00:52.808785+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-3ade1af4.md` — **UU**, intent/bookkeeping ticket (rule 2e).
  Bug ticket BUG-40, not matrix state, so 2e's per-fact judgment applies rather than
  2d's ledger replay.

  Incoming commit is **d2b87a3946** (`xgd(ticket): update bug bug-3ade1af4`,
  2026-09-01T12:27:33-07:00). Unlike the prior attempt in this bundle, the merge base
  here is **not** the empty stub — stage 1 is `164ba43c42`, the result of the
  preceding 12:15 commit — so the incoming side is a focused delta (a body rewrite),
  not a whole-file creation.

  - Base (stage 1) `164ba43c42` — the 12:15 revision.
  - Ours (stage 2) `963294b597` = HEAD — `xgd(ticket): seed_local_overlay bug
    bug-3ade1af4` (35bff14777, 2026-09-11T14:08:31-07:00), `updated_at:
    2026-09-11T18:53:54`, `status: bundled`, carrying `commits` /
    `version: 0.2.33` / `bundled_in: bundle-8e1807f6`.
  - Theirs (stage 3) `036c116920` — `updated_at: 2026-09-01T19:27:33`,
    `last_field_updated: body`, `status: free_coding`.

  **Rule applied:** 2e strict-superset. Resolved to ours.

  The decisive evidence is a direct blob diff of stage 3 against stage 2: the entire
  **body is byte-identical** between the two. Every change the incoming commit makes
  — the Cause 2 rewrite from "no code change" to "plus one real defect" documenting
  the `1c assets` `rm -rf`/`dist-assets.staging` race fix, Cause 3 going from ten to
  eleven UATs, the new item 8 (AC-964), the rewordings of items 2/3/4/5/6/7, the
  `Errors 30 errors` reindent, and the rewritten Test plan — is already present in
  ours verbatim. Ours is the developer's own later revision of the same ticket, and
  the overlay seed carried this body forward.

  The only differences are frontmatter facts where ours is strictly later, plus a
  trailing newline:
  - `updated_at` 2026-09-11 (ours) vs 2026-09-01 (theirs)
  - `status: bundled` (ours) vs `free_coding` (theirs)
  - ours adds `commits` / `version` / `bundled_in` — the bundle bookkeeping this
    reconcile branch depends on; theirs has none of it
  - `title`: theirs still reads "23 failures ... ten UATs", which is stale against
    **its own body** (that same commit's body says eleven UATs). Ours reads "27
    failures + 30 collection errors ... eleven UATs" — the developer's own later
    correction, and the one consistent with the shared body. Taking theirs would
    reintroduce a title that contradicts the text beneath it.

  Nothing from the incoming side is dropped: no body content, and no frontmatter
  field that ours does not already carry at a later value.

  **Mechanics:** the path is outside the sparse-checkout cone (DOC-986 §2/§4.1), so
  the conflict existed only in the index with no working-tree file for
  `checkout --ours` to write. Resolved at index level via
  `git update-index --cacheinfo 100644,963294b597,<path>`, then
  `git update-index --skip-worktree <path>` to restore the `S` bit every sibling
  under `.xgd/tickets/hot/` carries. `git ls-files -v` now shows a single stage-0
  entry flagged `S`; `git status --porcelain` is empty.

## Incoming changes preserved

No code/implementation files were in this conflict — the single file is a
bookkeeping ticket. STEP 3's redundant-vs-discarded check was still run, and it
resolves unambiguously to **redundant**: the incoming commit's changes are present
in HEAD via a different route (the seeded local overlay), not absent.

This case is stronger than the usual STEP 3 spot-check. Rather than sampling for
key markers, the full blob diff `036c116920..963294b597` returns only three
frontmatter hunks and an end-of-file newline marker — zero body hunks. The incoming
commit's entire subject matter is its body rewrite, and that body is reproduced
exactly in HEAD.

Because stage 2's blob is byte-identical to HEAD's (`963294b597…`), the staged diff
against HEAD is empty. Per STEP 4 this is expected for a commit whose effect already
landed through the overlay seed, and is not a @fail. `--skip` / `--continue` were
NOT called; CHERRY_PICK_HEAD is intact at d2b87a3946 for the finalize step, which
will detect the clean staged diff and skip the commit.

No BUG-1301 precedence exception was invoked, and no test function was deleted.

**Post-merge review flag:** the enrichment classed this file's intent as unknown on
one or both sides and asked that it be flagged. Flagging it here — though the
byte-identical body above is direct textual evidence of redundancy, not a timestamp
inference.
