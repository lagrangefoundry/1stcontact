---
uid: report-b0656b9f
id: REPORT-5438
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T03:37:28.644505+00:00'
updated_at: '2026-09-29T03:37:28.644505+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-909e42f8.md` — **UU (both modified)**, intent/bookkeeping
  ticket (§2e), resolved per the auto-enrichment rule for this file ("intent unknown
  on one or both sides — take the more recent commit by timestamp and flag for
  post-merge review"). Staged at the HEAD-side blob `c9bd09b51d`.
  - Outside the sparse-checkout cone (DOC-986 §2/§4.1), so the conflict existed only
    in the index — no working-tree markers. Resolved via `git update-index --cacheinfo`
    to stage 0.
  - **Recency determination.** Commit author dates are unusable here: the HEAD-side
    commit `192f79e8` carries author-date 2026-08-31 but committer-date 2026-09-28,
    because this resync replayed it (see the anchor's `orphan_commits` remapping).
    The reliable signal is the ticket's own ledger field — ours
    `updated_at: 2026-09-09T21:32:49.608058+00:00` vs theirs
    `2026-09-01T18:14:18.084983+00:00`. Ours is later. Corroborated by lifecycle
    position: ours is `status: bundled` + `bundled_in: bundle-87be4669`, which is
    downstream of theirs' `status: ready_to_reconcile`.
  - **Not composable per-fact.** §2e's "apply both for non-overlapping fields" does
    not yield a coherent result here: the two sides set `last_field_updated` to
    different values (`status` vs `body`), which is a same-field conflict resolved to
    the later side. Taking theirs' body while keeping ours' frontmatter would leave
    `last_field_updated: status` describing a body edit.
  - `xgd ticket history request-909e42f8` (HEAD side) errors with "Ticket not found"
    because the file is skip-worktree in this sparse worktree; the `--rev` form
    against the incoming commit succeeds. Only one side's lookup errored, and this is
    a `request` (intent/bookkeeping), not a spec ticket, so the @fail condition for
    spec tickets does not apply. Both sides' frontmatter was read directly from their
    blobs via `git cat-file`.
  - Also restored the `skip-worktree` bit on this path (`git update-index
    --skip-worktree`). The `--cacheinfo` write had cleared it, leaving the entry as
    `H` while every sibling ticket file is `S`; git consequently reported a spurious
    unstaged worktree deletion (` D`). Restoring it returns `git status --porcelain`
    to empty.

## Incoming changes preserved

No code/implementation files were in conflict, so STEP 3's verify-incoming check has
no code target. For the one ticket file, the incoming commit `6e301eb747` contributes
**no substantive content** — its body change is a lossy markdown reserialization, not
an edit:

- `git diff -w --word-diff=porcelain` between the merge base and the incoming blob
  surfaces only the two frontmatter timestamps plus emphasis-delimiter swaps. Zero
  prose added, removed, or altered.
- What the reserialization does change is formatting, and it regresses the document
  in four places:
  - `*"this architecture document is **also** a system document"*` →
    `_"this architecture document is _**_also_**_ a system document"_` (broken nested
    emphasis; renders as literal underscores)
  - ` ```js ` → ` ``` ` (lost code-fence language tag)
  - ``**`doc_kind: system_kb`**`` → ``` `doc_kind: system_kb` ``` (lost bold)
  - ``- **`kb status`** shells out…`` → ``- `kb status`** shells out…**`` (displaced
    bold markers; bullet renders wrong)
- It also unwraps prose to 200+ char lines, switches `*italics*` → `_italics_`, and
  loosens tight lists — all three against house style. Sampled every
  `request-*.md`/`doc-*.md` in `.xgd/tickets/hot/`: 11/11 hard-wrap at ~80 columns,
  120 asterisk-italics vs **0** underscore-italics anywhere in the directory, 16
  adjacent bullet pairs vs 0 blank-separated. The base/ours body conforms; the
  incoming body is the sole deviation.

No developer intent was discarded: there is none on the incoming side beyond the
reformat, and the `.gitattributes` note (REQ-816 / DOC-986 §5.2) that ticket files
must resolve on merits rather than most-recent-wins points the same way — ours holds
the only new information (the bundle state).

**Flagged for post-merge review** per the enrichment rule: `request-909e42f8`
(REQ-164). The dropped commit is a formatting-only change; if byte-identical
preservation of working's tail is required for audit, the alternative is to take
theirs' body and hand-repair the four regressions above. Not recommended — the result
would differ from base only in ways that violate house style.

## Staging state

- `git ls-files -u` → empty (no unmerged entries)
- `git status --porcelain` → empty
- `git diff --cached HEAD` → empty. The resolution is a net no-op against HEAD, so
  per STEP 4 I did **not** call `--skip`; finalize should detect the clean staged diff
  and skip the commit.
- `CHERRY_PICK_HEAD` left intact at `6e301eb7477b1c0258bcc014f300f4a29851fdf8`. No
  `--continue`/`--skip`/`--quit`/`--abort` was run.
