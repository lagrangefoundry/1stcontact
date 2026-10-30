---
uid: report-d961fa79
id: REPORT-5493
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T07:21:50.458753+00:00'
updated_at: '2026-09-29T07:21:50.458753+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/bug-360c5a44.md` — class **AA** (both added), intent/bookkeeping
  ticket (`bug-*`, STEP 2e); enrichment rule "take the more recent commit by
  timestamp" also applies. Resolved by taking the HEAD side in full.
  - Ours (HEAD, `e8f9e7c85b` *xgd(ticket): update bug bug-360c5a44*): the matured
    BUG-43 ticket — `title: 'Builder preview: the frame is never reloaded after an
    assistant turn'`, `status: free_and_reconciled`, `updated_at 2026-09-19`,
    `completed_at 2026-09-14`, `severity: high`, `chat_comment`, `commits[]`,
    `version: 0.2.40`, `bundled_in: bundle-8e1807f6`, plus a ~100-line body
    (Symptom / What was verified / Root cause / What is wanted / Fix / Test plan).
  - Theirs (`0d64e0f0a9` *xgd(ticket): create bug bug-360c5a44*): that same ticket's
    birth stub — `title: Untitled`, `status: draft`, `updated_at 2026-09-01`,
    `completed_at: null`, body `(new ticket)`.
  - HEAD is a **strict superset**: the only facts the incoming side carries are
    `uid`/`id`/`type`/`created_by`/`created_at` (byte-identical on both sides) and
    the stub values of `title`/`status`/`updated_at`/`completed_at`/
    `last_field_updated`, each of which HEAD supersedes with a strictly later value
    of the same field. No disjoint field or section exists on the incoming side to
    combine, so there is no per-fact composition to do — keeping the superset
    preserves every fact from both sides.
  - Path is outside the sparse-checkout cone (11% of tracked files present;
    `.xgd/tickets/**` is excluded per DOC-986 §2/§4.1), so staged with
    `git checkout --ours -- <path>` followed by `git add --sparse -- <path>`.

## Incoming changes preserved

No code/implementation files were in conflict — the sole conflicted path is a
bookkeeping ticket, so STEP 3's per-file incoming-hunk verification does not apply
and the BUG-1301 precedence exception was not invoked.

For the ticket itself: the incoming commit is the *creation* of a ticket that HEAD
already carries in a far more advanced state. Every field the incoming side sets is
present in the resolved file, either byte-identical (`uid: bug-360c5a44`, `id: BUG-43`,
`type: bug`, `created_by: xgd`, `created_at: '2026-09-01T21:52:34.046521+00:00'`) or
carried forward at a later value by a subsequent documented operation on the same
field. Applying the incoming side instead would have destroyed the title, terminal
status, completion timestamp, severity, commit trail, version/bundle linkage, and the
entire ticket body — so taking HEAD is what preserves the union of both intents here.

Resolution equals HEAD exactly, so the staged diff against HEAD is empty and this
cherry-pick is now a no-op. Left staged and paused as instructed —
`CHERRY_PICK_HEAD` is intact; no `--continue`/`--skip`/`--quit`/`--abort` was run.
