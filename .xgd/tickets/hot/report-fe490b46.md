---
uid: report-fe490b46
id: REPORT-3050
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-22'
created_by: xgd
created_at: '2026-08-31T20:14:25.691061+00:00'
updated_at: '2026-08-31T20:14:25.691061+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-22
---

## Files resolved

- `.xgd/tickets/hot/request-4fcbd354.md` — class **AA** (both added), intent/bookkeeping
  ticket (rule **2e**), resolved outside the sparse-checkout cone via
  `git checkout --ours` + `git add --sparse` (DOC-986 §2/§4.1).

  Both sides carry a byte-identical 140-line body. The entire conflict is three
  frontmatter lines:

  | fact | ours (HEAD) | theirs (incoming `61d15c3f`) |
  |---|---|---|
  | `status` | `bundled` | `ready_to_reconcile` |
  | `updated_at` | `2026-08-24T02:10:41` | `2026-08-22T21:55:22` |
  | `fields.bundled_in` | `bundle-b3b7c399` | *(absent)* |

  Applied per-fact, not whole-file:

  - `status` / `updated_at` — same fact, different values → later-positioned side wins.
    HEAD is later on both the ticket's own `updated_at` (08-24 vs 08-22) and on the
    lifecycle (`ready_to_reconcile` → `bundled` is a forward transition). Taking the
    incoming value would regress the status this reconcile run depends on.
  - `fields.bundled_in` — a field the incoming side never touched; HEAD is a strict
    superset → keep.

  Result is HEAD's version. Nothing was invented; no `intent_uid` / `story_uid` /
  `capability_uid` field was touched.

## Incoming changes preserved

- `.xgd/tickets/hot/request-4fcbd354.md` — the incoming commit `61d15c3f`
  ("xgd(ticket): update request request-4fcbd354") is a 167-line whole-file add. Its
  substantive content — the Why / What changed / design-decision / 7 acceptance criteria /
  9-UAT test list / operator note / origin sections, plus every `fields` entry
  (`priority`, `story_points`, `auto_merge_back`, `needs_review`, both `commits` entries,
  `version: 0.2.3`, `chat_comment`) — is present **verbatim** in the resolved file. Only
  the two superseded scalars (`status`, `updated_at`) are not carried, and those are older
  values of facts HEAD advanced afterwards, not developer content.

This resolution nets to no diff vs HEAD. Per STEP 4 that is the redundant case, not the
discarded one: STEP 3's check confirms the incoming commit's key changes are present in
HEAD (via the earlier commit that established this ticket body), rather than absent. No
BUG-1301 precedence exception was invoked; no test function was deleted. No code or test
files were in conflict.
