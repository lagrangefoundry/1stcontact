---
uid: report-d617aae0
id: REPORT-4067
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-11T22:28:15.798455+00:00'
updated_at: '2026-09-11T22:28:15.798455+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-554ac441.md` — **UU** (both modified), intent/bookkeeping
  ticket (rule **2e**), resolved on the strict-superset branch: kept the HEAD side
  in full.

  Incoming commit `0c554d53cb` (`xgd(ticket): update request request-554ac441`,
  authored 2026-08-23T15:13:14-0700) is the closing commit of this ticket's
  2026-08-23 editing session. It promotes `status` `free_coding` → `free_coded`,
  appends the `ec144c85` and `02bd4437` `working_sha` entries, adds
  `working_sha_history: []` to the two pre-existing entries, and bumps
  `fields.version` 0.2.7 → 0.2.9.

  Every one of those changes is already in HEAD, byte-identical. The
  ours-vs-theirs diff no longer touches the `commits` list or `version` at all —
  those hunks have fully converged. What remains:

  | fact | incoming (theirs) | HEAD (ours) | relation |
  |---|---|---|---|
  | `status` | `free_coded` | `free_and_reconciled` | HEAD is the downstream state of the same lifecycle |
  | `updated_at` | 2026-08-23T22:13:13Z | 2026-08-31T14:22:34Z | HEAD later |
  | `completed_at` | `null` | 2026-08-31T14:22:34Z | HEAD later |
  | `fields.bundled_in` | absent | `bundle-b3b7c399` | HEAD only |
  | `fields.chat_comment` | absent | `comment-98e86f10` | HEAD only |
  | EOF newline | absent | present | HEAD later |
  | `fields.commits`, `fields.version`, entire body | — | — | **identical** |

  `free_and_reconciled` is reached *through* `free_coded`, so HEAD does not
  contradict the incoming status — it carries it one stage further. No fact has
  the incoming side as the later-positioned or unique authority, so 2e's per-fact
  timeline rule never fires and the superset branch decides the whole file.

  The path is outside the sparse-checkout cone (DOC-986 §2/§4.1), so the conflict
  existed only in the index with no working-tree markers. Stage 2 was materialised
  with `git cat-file blob` and staged with `git add --sparse`.

## Incoming changes preserved

No code or implementation files were in this conflict — the single conflicted
path is a bookkeeping ticket, not source. No UAT or test function was touched on
either side, and no hunk was dropped under the BUG-1301 precedence exception.

STEP 3's redundant-vs-discarded test resolves to **redundant**. Taking the
incoming commit's payload change by change: the status promotion to `free_coded`
is present in HEAD and superseded by `free_and_reconciled`; both new
`working_sha` entries are present verbatim; both `working_sha_history: []`
additions are present verbatim; the 0.2.9 version bump is present verbatim.
Nothing this commit asserts is missing from the resolution. Applying the incoming
side instead would have demoted an operator-owned `status`, nulled `completed_at`,
and dropped the `bundled_in`/`chat_comment` links that exist only on HEAD.

## Net result

Fourth successive commit from this ticket's 2026-08-23 session to land as a no-op
against HEAD (after `c9f82a85cd`, `e95404260a` and `51ac0d0a8c`). Across those
four the incoming side converged on HEAD field by field — body first, then the
commits list and version — leaving only the post-session state (`free_and_reconciled`,
`completed_at`, `bundled_in`, `chat_comment`) that HEAD alone holds. This is the
expected shape when post-watermark sync has already landed the session's work in
refined form.

The resolution nets to no diff vs HEAD (`git status --porcelain` empty), which per
STEP 4 is the BUG-1109/BUG-1122 outcome. `--skip` was not called and no
sequencer-advancing command was run; `CHERRY_PICK_HEAD` = `0c554d53cb` remains in
place for `cherry_pick_finalize_resolution`.
