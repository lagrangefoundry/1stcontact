---
uid: report-9d189cd4
id: REPORT-4414
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T12:07:54.258410+00:00'
updated_at: '2026-09-19T12:07:54.258410+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-93851fea.md` — **AA (both added)**, index-only conflict
  (path is outside the sparse-checkout cone, DOC-986 §2/§4.1, so no working-tree
  markers existed). Resolved under **rule 2e** (intent/bookkeeping ticket),
  superset branch: kept the OURS side whole.

  - Ours: `0e3ad824` (2026-09-17 13:23:48 -0700), `xgd(ticket): seed_local_overlay
    bug bug-93851fea` — the mature BUG-41 ticket: real title, `status: bundled`,
    `completed_at` set, `version: 0.2.35`, `story_points: 2`,
    `bundled_in: bundle-8e1807f6`, `severity`, `chat_comment`, a `commits` entry
    (`working_sha: d019bab7`), and the full Symptom / Root cause / Fix / Test plan
    body.
  - Theirs: `d8ab3ec1` (2026-09-01 13:41:58 -0700), `xgd(ticket): create bug
    bug-93851fea` — the creation-time stub, 18 lines: `title: Untitled`,
    `status: draft`, `completed_at: null`, `last_field_updated: created_at`,
    `updated_at` equal to `created_at`, body `(new ticket)`.

  Ours is a strict superset per-fact: every field the incoming side carries is
  present in ours, either byte-identical (`uid`, `id`, `type`, `created_by`,
  `created_at`, `fields.auto_merge_back`, `fields.needs_review`,
  `fields.priority`) or legitimately advanced past it over the intervening 15
  days. No fact is in genuine competition — the incoming side holds no newer
  information, only creation defaults. Taking incoming would have reverted a
  bundled, completed ticket to Untitled/draft and destroyed its body.

  The resolved on-disk file hashes to `2ac4f433`, exactly the ours blob, with
  zero conflict markers. No content was invented and no field was modified
  beyond what the two sides already carried.

## Incoming changes preserved

Confirmed. The incoming commit `d8ab3ec1` touches exactly one file and its entire
diff is that file's creation (`new file mode`, 18 insertions, no deletions). Every
identity fact it establishes is present verbatim in the resolved version:

| incoming fact | present in resolution |
| --- | --- |
| `uid: bug-93851fea` | yes, identical |
| `id: BUG-41` | yes, identical |
| `type: bug` | yes, identical |
| `created_by: xgd` | yes, identical |
| `created_at: '2026-09-01T20:41:58.464808+00:00'` | yes, identical |
| `fields.auto_merge_back: true` | yes, identical |
| `fields.needs_review: false` | yes, identical |
| `fields.priority: medium` | yes, identical |

The only incoming values absent from the resolution are the creation-time
placeholders — `title: Untitled`, `status: draft`, `completed_at: null`,
`last_field_updated: created_at`, `updated_at` == `created_at`, and the body
`(new ticket)`. These are not developer content: they are the defaults `xgd
ticket create` stamps, which this ticket's own later history has superseded.
Preserving them would be a regression of the ticket, not preservation of intent.

This is the redundant-commit shape described in STEP 4 (BUG-1109/BUG-1122), not
the discard shape guarded by STEP 3: the incoming commit's key change — the
existence of ticket BUG-41 with that uid and creation stamp — **is present in
HEAD**, having arrived by a different route, so the staged tree nets to no diff
versus HEAD (`git status --porcelain` and `git ls-files -u` both empty). Per STEP
4 I did not call `--skip`; the staged result is left for
`cherry_pick_finalize_resolution` to detect and skip. `CHERRY_PICK_HEAD` remains
present at `d8ab3ec1`.

No code or UAT files were involved, so no BUG-1301 precedence exception was
invoked and no test function was dropped.
