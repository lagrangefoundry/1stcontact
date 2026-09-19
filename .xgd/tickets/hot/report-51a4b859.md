---
uid: report-51a4b859
id: REPORT-4416
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T12:13:04.750340+00:00'
updated_at: '2026-09-19T12:13:04.750340+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-93851fea.md` (BUG-41) — class **UU**, rule **2e**
  (intent/bookkeeping ticket), resolved per-fact; every fact landed on **ours**
  (`2ac4f433`).

  Incoming commit: `dadea5a9` — *"xgd(ticket): update bug bug-93851fea"*,
  Martin Westhead, 2026-09-01 13:46:22 -0700. This is the follow-on to
  `daaaeaea` resolved at scope `138/0`: the merge base for this pick is
  `44148bf6`, which is exactly the blob `daaaeaea` produced.

  The path is outside the sparse-checkout cone (DOC-986 §2/§4.1), so the
  conflict existed only in the index with no working-tree markers. Resolved
  with `git checkout --ours --` then `git add --sparse --`, each as its own
  standalone Bash call.

  Per-fact comparison of the incoming blob (`e14b489d`) against ours
  (`2ac4f433`) — a full `diff -u` of the two shows only these differences:

  | fact | theirs (`e14b489d`) | ours (`2ac4f433`) | kept | why |
  |---|---|---|---|---|
  | `title` | *Library: an uploaded .md is stored undescribed…* | identical | — | no conflict |
  | `fields.severity` | `medium` | identical | — | no conflict |
  | `fields.chat_comment` | `comment-0948105e` | identical | — | no conflict |
  | `last_field_updated` | `status` | identical | — | no conflict |
  | body (Symptom / Root cause / Fix / Test plan, ~78 lines) | full text | **byte-identical** | — | no conflict |
  | `status` | `free_coding` | `bundled` | ours | later lifecycle position |
  | `updated_at` | `2026-09-01T20:46:22` | `2026-09-16T01:48:36` | ours | later |
  | `completed_at` | `null` | `2026-09-14T10:29:09` | ours | later |
  | `fields.commits` / `version: 0.2.35` / `story_points: 2` / `bundled_in: bundle-8e1807f6` | absent | present | ours | ours-only addition |
  | trailing newline at EOF | present | absent | ours | cosmetic; body otherwise byte-identical |

  So ours is a **strict superset** of the incoming version: nothing the incoming
  commit authored is missing from it. The only facts where the two sides differ
  substantively are the three lifecycle scalars, and ours holds the unambiguously
  later state — `bundled` is downstream of `free_coding`, the ours-side commit
  (`0e3ad824`, 2026-09-17) post-dates the incoming commit (2026-09-01) by sixteen
  days, and the ours side additionally records `bundled_in: bundle-8e1807f6`,
  which is the very bundle this reconcile run is processing. Taking the incoming
  side on those scalars would have reverted the ticket out of the bundle it is
  currently being reconciled under, and dropped the `commits` /
  `version: 0.2.35` / `story_points` bookkeeping with it.

  No `xgd working-timeline` tiebreak was needed: there is no fact on which the
  incoming side is later or carries content ours lacks.

  This also agrees with the auto-enrichment's fallback rule for this file
  ("intent unknown on one or both sides — take the more recent commit by
  timestamp").

## Incoming changes preserved

No code/implementation files were in conflict — the sole conflicted path is a
bookkeeping ticket (rule 2e).

STEP 3 check for `.xgd/tickets/hot/bug-93851fea.md`: `git show dadea5a9 -- <file>`
is an 84-insertion / 5-deletion diff that (a) sets the real title, (b) adds
`fields.severity: medium`, (c) advances `status` `draft` → `free_coding` with a
new `updated_at`, and (d) replaces the `(new ticket)` placeholder with the full
Symptom / Root cause / Fix / Test plan body.

Items (a), (b) and (d) are present **verbatim** in the staged resolution — the
body is byte-identical between the incoming blob and the resolved blob. Item (c)
is present in HEAD via a different route: the ticket has since advanced past
`free_coding` to `bundled`, which supersedes rather than discards the incoming
lifecycle edit. This is the *redundant*, not *discarded*, case described in
STEP 4. No hunk was dropped, so the BUG-1301 precedence exception does not apply.

## Staging state

`git status --porcelain` is empty and `git ls-files -u` returns nothing: the UU
class line is gone and the staged blob (`2ac4f433`) is identical to
`HEAD:.xgd/tickets/hot/bug-93851fea.md`, so this pick nets to no diff vs HEAD.
Per STEP 4 that is not a failure and `--skip` was **not** called — the finalize
step will detect the clean staged diff and skip the commit.

The cherry-pick sequencer is untouched: `CHERRY_PICK_HEAD` is still present at
`dadea5a9b45050e2ed0f9f29efcb6d289fb27889`. Git writes were limited to
`checkout --ours` and `add --sparse` on this single path.
