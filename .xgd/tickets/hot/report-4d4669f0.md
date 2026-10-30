---
uid: report-4d4669f0
id: REPORT-5262
type: report
title: 'Resync resolve conflicts: b6b7f564f0bf1ee0904f0b6aa25ee3ca053055f0'
created_by: xgd
created_at: '2026-09-28T02:39:11.671593+00:00'
updated_at: '2026-09-28T02:39:11.671593+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/bug-6612c4b7.md` — UU, intent/bookkeeping ticket (STEP 2e).
  Resolved to the HEAD (ours) side in full.

  Incoming commit `2759e5b5077faf531087d339c35b29c62cc1c6cc`
  ("xgd(ticket): update bug bug-6612c4b7", author date
  2026-08-24 14:31:48 -0700) is the substantive one in this run: against its
  base (blob `7f850188d9`) it replaces the whole speculative body with the
  confirmed root-cause write-up, sets `last_field_updated: body`, and bumps
  `updated_at` to 2026-08-24T21:31:48Z. Unlike the four preceding picks
  this is a real content rewrite, so it was diffed directly against ours
  (blob `f3b9d25bf1`) rather than judged on frontmatter alone.

  That ours↔incoming diff has exactly two regions:

  1. **Frontmatter.** Ours: `updated_at`/`completed_at`
     2026-08-31T19:19:36Z, `last_field_updated: status`, `status:
     free_and_reconciled`, plus `commits` (3 entries), `version: 0.2.13`,
     `bundled_in: bundle-78f4e2fe`. Incoming: 2026-08-24T21:31:48Z,
     `completed_at: null`, `status: draft`. Ours is strictly later and a
     strict superset — later-positioned intent wins (2e).

  2. **One body section, near the tail.** Incoming ends the observability
     discussion with `## Still outstanding (not in this ticket)` — "declares
     no `[observability]` block … Worth adding; config-only, no code."
     Ours has, in the same position, `## Observability — added here` plus a
     following `## Deployment` section: the block was subsequently added in
     both places with `head_sampling_rate = 1`, with the production-table
     ordering hazard pinned by
     `test_UAT_FC_BUG-37_the_production_route_survives_the_new_table`.
     That is the same fact one step further along, not a competing claim.

  **Everything else in the incoming body is already present in ours,
  byte-identical** — `## Symptom`, `## Root cause — CONFIRMED` (Workers Free
  10 ms ceiling vs ~78 ms preview), `## What this ticket fixes in code`
  (the per-isolate assembled-definition memo keyed `(tenantId, slug)`, and
  the deliberate decision not to re-key the `PREVIEWS` WeakMap),
  `## Result` (~78 ms → ~5 ms), `## Superseded — the original hypothesis…`,
  `## Reproduction (historical)`, `## Relationship to BUG-36`. They appear
  as unchanged context in the diff, not as adds or deletes.

  Provenance of ours' later state: the `seed_local_overlay` commit
  `501a0595d1cfbfc8675a1aeecb8a34aebc719f47` seeded this branch with the
  ticket as it stood on 2026-08-26 at `status: bundled` — already carrying
  the confirmed root-cause body *and* the `## Observability — added here` /
  `## Deployment` sections. Verified by listing the seed blob's headings.
  Taking the incoming side would roll the ticket's narrative backwards:
  `free_and_reconciled` → `draft`, drop `commits`/`version`/`bundled_in`/
  `completed_at`, and re-assert that observability is outstanding when the
  branch's later record says it was added and UAT-pinned.

  This is the fifth consecutive commit in this resync queue against this
  ticket (`fe97d3bc34`, `b0af50e157`, `9255f773b5`, `1975a6876b`,
  `2759e5b5077`) whose effect the branch already carries.

  Net effect: the staged tree is identical to HEAD (no staged diff). Left
  for the finalize step to detect and skip — `--skip` was not invoked here.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-6612c4b7.md` — the incoming commit's payload is the
  confirmed root-cause body rewrite. Every section of it is present in the
  resolved file; verified by heading enumeration
  (`grep -n '^## '` → Symptom / Root cause — CONFIRMED / What this ticket
  fixes in code / Result / Superseded / Observability — added here /
  Deployment / Reproduction (historical) / Relationship to BUG-36) and by
  the ours↔incoming blob diff showing the entire rewrite as unchanged
  context.

  One incoming paragraph is not carried verbatim: `## Still outstanding
  (not in this ticket)`. It is superseded in place by ours'
  `## Observability — added here` + `## Deployment`, which record the same
  work as completed rather than pending. That supersession arrived on this
  branch through the `501a0595d1` overlay seed (ticket state of 2026-08-26,
  i.e. after the 2026-08-24 incoming commit) — an already-integrated later
  decision, not a resolution shortcut taken here.

No code files, no UAT test files, and no spec tickets were involved in this
conflict. No hunk was dropped under the BUG-1301 precedence exception.
