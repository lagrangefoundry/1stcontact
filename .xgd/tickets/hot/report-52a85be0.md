---
uid: report-52a85be0
id: REPORT-3365
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-02T21:20:29.539386+00:00'
updated_at: '2026-09-02T21:20:29.539386+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/bug-23d1ec27.md` (BUG-39) — **UU**, intent/bookkeeping ticket
  (rule 2e). Incoming commit `163924e9`
  ("xgd(ticket): update bug bug-23d1ec27", 2026-08-25 16:27 -0700).

  The incoming commit makes two kinds of change, and they resolve differently:

  **1. The body rewrite (`last_field_updated: body`) — merged CLEAN, kept in
  full.** This is the commit's substantive content: the "Fix — as landed"
  section with the eight-suite collapse table, the `AnthropicAccumulator` root
  cause, the two BUG-39 evidence cases, "Watch for — resolved", and the "Out of
  scope" BUG-38/REQ-127 analysis. HEAD already carries byte-identical text
  (it reached the bundle branch via `Merge branch 'free-BUG-39' into
  xgd-working`), so git produced no conflict hunk there at all.

  **2. The frontmatter status block — the sole conflict hunk**, and a single
  fact: the ticket's lifecycle status plus its stamp.

  | | `updated_at` | `last_field_updated` | `status` |
  |---|---|---|---|
  | ours (HEAD) | `2026-08-31T05:05:09` | `status` | `bundled` |
  | incoming | `2026-08-25T23:27:28` | `body` | `free_coding` |

  Resolved per-fact toward the LATER-positioned side, per 2e. HEAD is later on
  every measure: `bundled` is downstream of `free_coding` in the lifecycle; the
  stamp is six days later; and the newest bundle-branch commit touching this
  file (`6778773d`, 2026-08-26 16:21) post-dates the incoming commit.

  Taking incoming here would rewind the ticket to `free_coding` while leaving
  the downstream bookkeeping that only exists BECAUSE it was bundled —
  `bundled_in: bundle-8eef3846`, `version: 0.2.15`,
  `commits[0].working_sha: 759cd874` — sitting untouched beside it.

  Resolved by `git checkout --ours`, then `git add --sparse`. This is the third
  consecutive pick against this file in the bundle (`e2ef5e98` → `93b031a3` →
  `163924e9`); each is an incremental ticket update whose end state HEAD already
  holds via the free-BUG-39 merge.

## Incoming changes preserved

No code or implementation files were in this conflict — the single conflicted
file is a bookkeeping ticket, so STEP 3's code-file verification does not apply
as such. The equivalent check was run anyway on the incoming commit's
substantive content, the body rewrite, and it passes: all six distinctive
markers of the incoming prose are present in the resolved file — `Fix — as
landed`, `AnthropicAccumulator`, `Out of scope — a second, unrelated defect
surfaced`, `The blast radius is wider than the reproduce line`,
`scripted-model-client.ts`, and
`the_wire_protocol_is_transcribed_in_exactly_one_place`.

The only incoming delta not carried through is the status/stamp regression
described above, which is superseded rather than discarded: HEAD passed through
`free_coding` and carries that run's product forward as
`commits[0].working_sha: 759cd87405a4b50f81995b2c9b510bf23be54fbd`, present in
the resolved file under the later `bundled` status.

No hunk was dropped under the BUG-1301 precedence exception; it was not needed.

Note for the finalize step: the staged tree nets to **no diff vs HEAD**
(`git status --porcelain` reports no tracked-file entries). Per STEP 4 this is
the BUG-1109/BUG-1122 redundant-commit case — the incoming content is present in
HEAD via the free-BUG-39 merge, not absent — so `--skip` was NOT called and
CHERRY_PICK_HEAD (`163924e9`) is left intact for
`cherry_pick_finalize_resolution`.
