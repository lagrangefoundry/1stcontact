---
uid: report-66ccb1a2
id: REPORT-3146
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T00:38:26.885303+00:00'
updated_at: '2026-09-01T00:38:26.885303+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-REQ-162
---

## Files resolved

- `.xgd/tickets/hot/request-554ac441.md` — **UU**, intent/bookkeeping ticket (`request-*`), rule **2e**. Resolved per-fact; HEAD kept on every contested fact. Path is outside the sparse-checkout cone (DOC-986 §2/§4.1), so staged with `git add --sparse`.

Sides:
- OURS (HEAD): `b6ac2fa` *xgd(ticket): seed_local_overlay request request-554ac441*, 2026-08-30
- THEIRS (incoming): `a74ac03` *xgd(ticket): update request request-554ac441*, 2026-08-22 20:24:39

This is attempt `10/0` on the same file that attempt `9/0` resolved, but a DIFFERENT incoming commit — `a74ac03`, the successor to `7782255`. HEAD is unchanged at `b6ac2fa` (the previous commit staged to no diff and was skipped by finalize, as expected).

### The two hunks

**Hunk 1 — frontmatter.** Three fields contested:

| Fact | HEAD | Incoming | Kept | Why |
|---|---|---|---|---|
| `updated_at` | 2026-08-24T02:10:41 | 2026-08-23T03:24:38 | HEAD | later |
| `last_field_updated` | `status` | `body` | HEAD | derived breadcrumb of the most recent write; HEAD's write is the later one |
| `status` | `bundled` | `free_coded` | HEAD | `bundled` is downstream of `free_coded` |

**Hunk 2 — end of body.** HEAD holds the whole *"Follow-up: the deploy secret guard asked the wrong question"* section (ACs 13–16, through "Ticket version is now 0.2.9"); the incoming side is EMPTY there — its file simply ends earlier. Nothing to compose: keeping HEAD adds nothing the incoming side rejected and drops nothing it contributed. The only non-marker difference in that hunk is a trailing newline at EOF.

Nothing was invented, and nothing present on either side was dropped except where the other side held a strictly later value for the same fact.

## Incoming changes preserved

The incoming commit made three changes; the substantive one is fully present in the resolved file.

1. **Body append — the whole *"Follow-up: `bin/build` failed on a type-only reach into node"* section** (cause, why-no-test-caught-it, AC-12, the 0.2.7 version-bookkeeping note). This is the commit's actual intent, and it is **present verbatim in HEAD at lines 405–451** — verified by grep after resolution: the section heading (405), AC-12's "including through a type-only import" (443), and "Ticket version is now 0.2.7" (451). It never entered a conflict hunk at all; `git diff HEAD` shows it as unchanged CONTEXT, which is the proof it was already in HEAD rather than something the merge pulled in from theirs.
2. `updated_at` → 2026-08-23T03:24:38 — superseded by HEAD's later 2026-08-24T02:10:41 write of the same field.
3. `last_field_updated: status` → `body` — the one incoming value not in the result. It is a derived breadcrumb naming which field the last write touched; HEAD's later write touched `status` and legitimately reset it. Overwriting it is the per-fact timeline rule operating correctly, not a discard of developer intent.

**Losslessness proof for `checkout --ours`.** Before resolving, `git diff HEAD` on the merged worktree showed every `+` line to be either a conflict marker, theirs-side content, or the EOF-newline change — no HEAD content removed, and no auto-merged incoming content anywhere outside the markers. Confirmed after: `git diff HEAD -- <file>` is empty, so the resolved file is byte-identical to HEAD.

**Net-zero staged diff is expected, not a discard.** This commit is genuinely redundant against HEAD: its body section already landed there by a different route (BUG-1109/BUG-1122). STEP 3's distinction resolves cleanly to "present" — the section is in HEAD verbatim, not merely approximated. Per STEP 4 the cherry-pick was left for `cherry_pick_finalize_resolution`; no `--skip`/`--continue`/`--abort`/`reset` was issued and `CHERRY_PICK_HEAD` (`a74ac03993024fbbffb13bf95ca29a0605894043`) is still set.

No BUG-1301 precedence exception was invoked; no test functions were involved.

## Flagged for post-merge review

Per the enrichment metadata's request (intent unknown on one or both sides). The resolution rests on HEAD being a demonstrable per-fact superset — the incoming body section verified present by content, not assumed — rather than on a reading of either side's declared intent. Worth confirming that `status: bundled` / `bundle-b3b7c399` is the state the bundle expects for REQ-149.
