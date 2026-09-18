---
uid: report-52abab7f
id: REPORT-4323
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-18T06:30:47.463907+00:00'
updated_at: '2026-09-18T06:30:47.463907+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-6612c4b7.md` (BUG-37) — class **UU**, intent/bookkeeping
  ticket → rule **2e**, resolved per-fact by working-timeline position. Ours
  (HEAD) taken for all three conflicted regions; `git checkout --ours` +
  `git add --sparse`. Nets to **no diff vs HEAD** (redundant, not discarded —
  see below).

Incoming commit `2759e5b507` (authored 2026-08-24T21:31:48Z, `last_field_updated:
body`) is the sixth commit on this ticket and by far the largest: it replaces the
early hypothesis body with the measured "Root cause — CONFIRMED" write-up
(~120 lines changed). Successor of `1975a6876b` (45/0), `9255f773b5` (44/0),
`b0af50e157` (43/0), `fe97d3bc34` (42/0).

## Per-fact resolution

Most of the incoming body rewrite **merged cleanly** — ours already contains it
verbatim. `git diff <theirs bc8406e5> <ours f3b9d25b>` leaves only three
differences, which are exactly the three conflict regions:

| region | theirs (`bc8406e5`) | ours (`f3b9d25b` = HEAD) | resolution |
|---|---|---|---|
| frontmatter block + `fields` | `updated_at: 2026-08-24T21:31:48Z`, `completed_at: null`, `last_field_updated: body`, `status: draft`; no `commits`/`version`/`bundled_in` | `2026-08-31T19:19:36Z`, completed, `last_field_updated: status`, `status: free_and_reconciled`, plus `commits` (3), `version: 0.2.13`, `bundled_in: bundle-78f4e2fe` | ours — later working-timeline position for the contested scalars; the bookkeeping fields are ours-only additions theirs never asserted |
| observability section | `## Still outstanding (not in this ticket)` — "no `[observability]` block … Worth adding; config-only, no code." | `## Observability — added here` — declared in both places with `head_sampling_rate = 1`, the `[env.production.observability]`-before-`routes` trap, `test_UAT_FC_BUG-37_the_production_route_survives_the_new_table`, `wrangler deploy --env production --dry-run` — plus a new `## Deployment` section | ours — same section, later position: theirs says the work is outstanding, ours records it done. Ours is also the strict information superset |
| trailing newline | present | absent | ours (cosmetic; matches the working-branch tip byte-for-byte) |

## Incoming changes preserved

Not a code file, so no code hunks are at stake. The incoming commit's
**principal intent — the body rewrite from hypothesis to confirmed root cause —
is present in the resolved file**, verified by grep on the resolved file:

```
40:## Root cause — CONFIRMED
67:`assembleSite` runs inside `loadDraft`
72:**FIX: memoise the assembled (validated) definition per isolate, keyed
106:## Result
112:## Superseded — the original hypothesis, recorded because it was wrong
142:## Observability — added here
```

So the Workers-Free-plan 10 ms ceiling finding, the ~78 ms cost table, the
memoise-the-assembled-definition fix, the ~15x result, and the "Superseded"
record of the discarded WeakMap hypothesis all survive. Every one of those
sections came in *without* conflict, because ours already held the identical
text.

The only incoming text not in the result is the `## Still outstanding (not in
this ticket)` paragraph, superseded on ours by `## Observability — added here`:
the same subject, one working-timeline step later, after the config change was
actually made and pinned by a UAT. Plus the `updated_at` bookkeeping bump.

Corroborating evidence that ours is this same ticket further along its own
timeline, not a competing edit:

- `git show xgd-working:.xgd/tickets/hot/bug-6612c4b7.md` (the working branch
  containing `2759e5b507`) is **identical** to the ours side — including
  `## Observability — added here`, `## Deployment`, and the missing trailing
  newline. The working timeline itself replaced "Still outstanding" with
  "added here".
- Ours stage-2 blob `f3b9d25b` equals `HEAD:.xgd/tickets/hot/bug-6612c4b7.md`,
  so the resolved file is exactly the current, reconciled ticket state.

No BUG-1301 precedence exception was invoked. No UAT/test files in this
conflict (the UAT named in the body is referenced, not modified). No
`fields.intent_uid` / `story_uid` / `capability_uid` touched, and no content
invented.

## State on exit

- `git ls-files -u` → empty; `git status --porcelain` → empty.
- `git diff --cached HEAD` → empty (redundant commit per BUG-1109/BUG-1122;
  finalize will skip the commit).
- `CHERRY_PICK_HEAD` → `2759e5b5077faf531087d339c35b29c62cc1c6cc`, still present
  and untouched for `cherry_pick_finalize_resolution`.
