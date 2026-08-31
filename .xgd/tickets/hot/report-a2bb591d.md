---
uid: report-a2bb591d
id: REPORT-3074
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-22'
created_by: xgd
created_at: '2026-08-31T21:14:01.894775+00:00'
updated_at: '2026-08-31T21:14:01.894775+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-22
---

## Files resolved

- `.xgd/tickets/hot/bug-6612c4b7.md` — **AA (both added)**, intent/bookkeeping
  ticket (rule **2e**, with 2b's superset test). Resolved to the **OURS/HEAD**
  side (blob `54e0317`), staged at stage 0. No conflict markers remain.

  **Why OURS, not the incoming free_coded side.** The "incoming is
  authoritative" hard rule is scoped to *code* files; this is a bookkeeping
  ticket. On the per-fact timeline test that 2e actually prescribes, the
  incoming side is the **older** position:

  | | OURS (HEAD) | THEIRS (incoming `4677b816`) |
  |---|---|---|
  | commit | `501a0595` `xgd(ticket): seed_local_overlay bug bug-6612c4b7` | `4677b816` `xgd(ticket): create bug bug-6612c4b7` |
  | committed | 2026-08-31T07:24:25-07:00 | 2026-08-24T14:06:08-07:00 |
  | `updated_at` | 2026-08-26T17:36:27Z | 2026-08-24T21:06:08Z (== `created_at`) |
  | `status` | `bundled` | `draft` |
  | `last_field_updated` | `status` | `created_at` |

  `git show --stat 4677b816` is **144 insertions, one file, zero deletions** —
  the incoming commit is the ticket's *creation*, i.e. ancestor content, not a
  divergent edit. `created_at` is byte-identical on both sides
  (`2026-08-24T21:06:08.727702+00:00`), confirming HEAD holds that same
  creation carried forward rather than a parallel file.

  This satisfies both the auto-enrichment rule ("take the more recent commit by
  timestamp") and 2e's superset test simultaneously.

  **Per-fact check (2e), no side's edit silently dropped:**
  - `severity`, `priority`, `needs_review`, `auto_merge_back` — identical on
    both sides; nothing to reconcile.
  - `title` — same fact, later wording on OURS ("Edit mode **dies** with
    Cloudflare 1102" vs "**503s**"); the developer corrected this, 1102 is not
    a 503. OURS by timeline.
  - `chat_comment`, `commits[]` (3 working SHAs), `version: 0.2.13`,
    `bundled_in: bundle-78f4e2fe` — present only on OURS; THEIRS never had
    them. Strict field-level superset.
  - Body — same document, later revision by the same author. Taking THEIRS
    would revert a `bundled` ticket to `draft` and destroy the `commits`/
    `bundled_in` bookkeeping this very reconcile run depends on.

  Nothing was invented; no `intent_uid`/`story_uid`/`capability_uid` touched.

## Incoming changes preserved

No code/implementation files were in conflict — the sole conflict is a
bookkeeping ticket, so 2c/2f do not apply and no UAT function was deleted.

The incoming commit's entire effect ("create ticket `bug-6612c4b7` with its
initial draft") **is present in HEAD**, arrived at via the
`seed_local_overlay` route rather than this commit. This is STEP 4's
*redundant*, not STEP 3's *discarded*: the key change is in HEAD, not absent
from it.

The incoming draft's four pre-investigation sections are each carried forward
in superseded form by the same author, not lost:
- "Leading hypothesis — the preview render cache never hits in the Worker" →
  OURS §"Superseded — the original hypothesis, recorded because it was wrong",
  which restates it and records the measurements that falsified it.
- "Candidate fixes" #1 (re-key the WeakMap) → OURS §"What this ticket fixes in
  code" defect 2, kept and explicitly *not* fixed, with the tenant-staleness
  reason for rejecting it.
- "Prerequisite — there is no telemetry" → OURS §"Observability — added here"
  (the `[observability]` block landed, in both the top level and
  `[env.production]`).
- "`deps.store` complication" / "What Edit mode actually requests" →
  superseded scaffolding for the falsified hypothesis; the confirmed root cause
  (free-plan 10 ms CPU ceiling vs ~78 ms `assembleSite`) replaces it.

BUG-1301 precedence exception: not invoked — no hunk was dropped on
refactor grounds.

Staged result nets to no diff vs HEAD. Per STEP 4 this is left for
`cherry_pick_finalize_resolution` to detect and skip; `--skip`/`--continue`
were not called and `CHERRY_PICK_HEAD` (`4677b816`) remains present.
