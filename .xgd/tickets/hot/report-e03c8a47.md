---
uid: report-e03c8a47
id: REPORT-3145
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T00:36:37.705779+00:00'
updated_at: '2026-09-01T00:36:37.705779+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-REQ-162
---

## Files resolved

- `.xgd/tickets/hot/request-554ac441.md` — **UU**, intent/bookkeeping ticket (`request-*`), rule **2e**. Resolved per-fact; every contested fact went to HEAD. Path is outside the sparse-checkout cone (DOC-986 §2/§4.1), so staged with `git add --sparse`.

Sides:
- OURS (HEAD): `b6ac2fa` *xgd(ticket): seed_local_overlay request request-554ac441*, 2026-08-30
- THEIRS (incoming): `7782255` *xgd(ticket): update request request-554ac441*, 2026-08-22

Both conflict hunks were confined to YAML frontmatter; the incoming commit touched no body content at all. Per-fact resolution:

| Fact | HEAD | Incoming | Kept | Why |
|---|---|---|---|---|
| `updated_at` | 2026-08-24T02:10:41 | 2026-08-23T03:22:54 | HEAD | later |
| `status` | `bundled` | `free_coded` | HEAD | later lifecycle state; HEAD's own `updated_at` is later |
| `fields.commits` | 6 entries | 4 entries | HEAD | strict superset — contains every incoming SHA (`0e39033`, `932f362`, `92fc26e`) plus `ec144c8`, `02bd443` |
| `fields.version` | 0.2.9 | 0.2.7 | HEAD | later |
| `fields.bundled_in`, `fields.chat_comment` | present | absent | HEAD | HEAD-only fields; incoming never touched them |

No field was invented, and nothing present on either side was dropped except where the other side held a strictly later value for that same fact.

## Incoming changes preserved

Not a code file, but the STEP 3 check was run in substance. `git show 7782255e4e -- <file>` shows four changes; all four are already present in HEAD at an equal-or-later value:

1. `updated_at` → 2026-08-23T03:22:54 — HEAD carries 2026-08-24T02:10:41, a later write of the same field.
2. `status: free_coding` → `free_coded` — HEAD carries `bundled`, downstream of `free_coded`; the transition the incoming commit records has already been passed through.
3. commits list: adds `working_sha_history: []` to `0e39033`, adds `932f362` and `92fc26e` — all three present in HEAD (`0e39033`'s `working_sha_history` sits in the non-conflicted region), alongside two further commits HEAD alone records.
4. `version: 0.2.1` → `0.2.7` — HEAD carries 0.2.9.

**Losslessness proof for `checkout --ours`.** Before resolving, `git diff HEAD -- <file>` on the merged worktree showed hunks whose only `+` lines were conflict markers and the theirs-side block — no HEAD content removed, no auto-merged incoming content anywhere outside the markers. So taking ours discards nothing that git had already integrated. Confirmed after resolution: `git diff HEAD -- <file>` is empty, i.e. the resolved file is byte-identical to HEAD.

**Net-zero staged diff is expected here, not a discard.** The resolution stages no change vs HEAD because this commit is genuinely redundant — the developer's own later working commits carried its effect (and more) onto the bundle branch already, which is exactly the BUG-1109/BUG-1122 case. Per STEP 4 the cherry-pick was left untouched for `cherry_pick_finalize_resolution` to skip; no `--skip`/`--continue`/`--abort` was issued and `CHERRY_PICK_HEAD` (`7782255e4e`) is still set.

No BUG-1301 precedence exception was invoked; no test functions were involved.

## Flagged for post-merge review

The enrichment metadata classed the intent as unknown on one or both sides and asked that this file be flagged. Flagging it: the resolution rests on HEAD being a strict per-fact superset, not on a reading of either side's declared intent. Worth a glance that `status: bundled` / `bundle-b3b7c399` is the state the bundle expects for REQ-149.
