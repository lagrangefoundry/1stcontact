---
uid: report-dc507b14
id: REPORT-3411
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-03T23:51:56.162938+00:00'
updated_at: '2026-09-03T23:51:56.162938+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/request-26dafd83.md` — **UU**, intent/bookkeeping ticket
  (rule **2e**; a `request-*` ticket, not a matrix-defining spec ticket, so 2d's
  ledger-replay reconstruction does not apply). Path is outside the
  sparse-checkout cone (DOC-986 §2/§4.1) — no working-tree file and no textual
  conflict markers, conflict existed only in the index. Resolved with
  `git checkout --ours` + `git add --sparse`. Staged blob is
  `746636c1c285f116b80c0391e059b1db4edd8fb1` (stage 2, ours) at stage 0.

### Why ours, per fact

The incoming commit (`048fba1a9d39`, `xgd(ticket): update request
request-26dafd83`, 2026-08-31 14:57:02 -0700) changed exactly three frontmatter
fields and nothing else. HEAD (`a8ffae74c3bf`, `xgd(ticket): seed_local_overlay
request request-26dafd83`, 2026-09-02 10:50:06 -0700) changed the same three,
plus a large disjoint superset. Per-fact resolution:

| fact | ours (HEAD) | incoming | kept |
|---|---|---|---|
| `updated_at` | `2026-09-02T17:48:27.063949+00:00` | `2026-08-31T21:57:01.925843+00:00` | ours — later |
| `last_field_updated` | `status` | `status` | identical — not actually in conflict |
| `status` | `bundled` | `free_coding` | ours — later intent |

HEAD is a strict superset on everything else: it adds `fields.commits` (three
`working_sha` entries), `fields.version: 0.2.31`, `fields.bundled_in:
bundle-203b1dc2`, a "What landed" body section, and resolves the "Granularity"
open question. Incoming touched none of that. So there is **no incoming fact
absent from the resolution** — taking ours *is* the per-fact composition here,
not a whole-file winner-pick (BUG-1030's failure mode does not arise, because
the two sides' edits are not disjoint: incoming's are a proper subset of the
same fields).

The conflict enrichment recorded intent as unknown on one or both sides and
prescribed "take the more recent commit by timestamp" — that is ours, by ~2 days.

Note: `xgd ticket history request-26dafd83` errored on the HEAD side
("Ticket not found") because the file was mid-conflict and out of cone; the
incoming-side lookup succeeded. Only one of the two lookups errored, and 2d's
"both `updated_by` lookups errored" @fail condition is scoped to spec tickets in
any case — so this is not a fail. Timeline was established from commit dates and
`updated_at` instead.

## Incoming changes preserved

No code/implementation files were in this conflict — the sole conflicted path is
a bookkeeping ticket, so STEP 3's code-file verification has no code target.
Recording the disposition of the incoming commit's content anyway:

The incoming commit's intent was to advance the ticket off `draft` to
`free_coding` and stamp `updated_at`/`last_field_updated`. That effect **is
present in HEAD via a later route**, not discarded: HEAD's status is `bundled`,
which is downstream of `free_coding`. This is evidenced by the ticket's own
HEAD-side content rather than inferred — it carries three recorded
`fields.commits[].working_sha` values (`52fd6302cc92...`, `9ae733843066...`,
`c2f6c582ad88...`), `fields.version: 0.2.31`, and `fields.bundled_in:
bundle-203b1dc2`. A ticket cannot hold completed working commits and membership
in this very reconcile bundle unless free_coding already ran to completion and
its output was bundled.

Taking incoming instead would have reverted an operator-owned status from
`bundled` back to `free_coding` and dropped this bundle's own bookkeeping
(`bundled_in: bundle-203b1dc2`) — a lifecycle regression on the bundle currently
being reconciled.

**Staged diff vs HEAD is empty** for this file, i.e. the resolution nets to no
change. Per STEP 4 this is the BUG-1109/BUG-1122 redundant-commit case, not a
discard, and is not a @fail: the incoming commit's key change is present in HEAD
(status advanced past `draft`), rather than simply absent. `git cherry-pick
--skip` was NOT called — the cherry-pick sequencer state (CHERRY_PICK_HEAD,
verified still present) is left intact for `cherry_pick_finalize_resolution` to
detect the clean staged diff and skip the commit itself.

No conflict-class entries remain in `git status --porcelain`.

## Flagged for post-merge review

Per the enrichment rule's "flag this file for post-merge review": intent was
unknown on at least one side, and the resolution discards an
`updated_at`/`status` pair authored by the developer on 2026-08-31 in favour of
automated overlay bookkeeping from 2026-09-02. The judgement rests on `bundled`
being downstream of `free_coding`. Cheap to confirm; nothing else in the bundle
depends on it.
