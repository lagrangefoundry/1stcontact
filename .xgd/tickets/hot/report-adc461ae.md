---
uid: report-adc461ae
id: REPORT-2990
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-21'
created_by: xgd
created_at: '2026-08-31T16:13:04.446869+00:00'
updated_at: '2026-08-31T16:13:04.446869+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-21
---

## Files resolved

- `.xgd/tickets/hot/bug-6612c4b7.md` — UU, intent/bookkeeping ticket (rule 2e),
  out of the sparse-checkout cone (index-only conflict, no working-tree markers).
  Resolved per-fact to the HEAD-side content via `git checkout --ours` +
  `git add --sparse`.

  Unlike the four preceding commits in this bundle (scopes 182/183/184/189,
  which were one- and two-line frontmatter edits), this incoming commit is
  substantive: `2759e5b5` (2026-08-24 14:31:48 -0700) rewrites the body,
  114 insertions / 106 deletions. It replaces the original speculative diagnosis
  (the "leading hypothesis" that a dead `PREVIEWS` WeakMap exhausted isolate
  memory, the candidate-fix list, the "Not started" note) with the confirmed
  writeup: `## Root cause — CONFIRMED` and the Workers-Free-plan 10 ms ceiling,
  the workerd measurement table, `## What this ticket fixes in code` with the
  per-isolate assembled-definition memo keyed `(tenantId, slug)`,
  `## Result` (~78 ms → ~5 ms), `## Superseded — the original hypothesis`,
  `## Still outstanding (not in this ticket)`, and
  `## Reproduction (historical)`. It also sets `last_field_updated: body` and
  bumps `updated_at`.

  This is the one commit in the sequence where a naive "take ours" could have
  discarded real authored prose, so I diffed the incoming blob directly against
  the ours blob (`git diff bc8406e525 54e03170f8`) rather than relying on the
  merge base. That diff shows the two sides are **identical across the whole
  body** except for one section, i.e. every paragraph this commit authors is
  already present verbatim in HEAD.

  The single differing section is the same fact at a later state: incoming's
  `## Still outstanding (not in this ticket)` says `wrangler.toml` declares no
  `[observability]` block and that adding it is "Worth adding; config-only, no
  code". HEAD replaces that with `## Observability — added here`, recording that
  the block was subsequently declared in both places with
  `head_sampling_rate = 1`, the `[env.production.observability]`-before-`routes`
  TOML trap, and the UAT that pins it
  (`test_UAT_FC_BUG-37_the_production_route_survives_the_new_table`), plus a new
  `## Deployment` section. HEAD is the later intent (`updated_at
  2026-08-26T17:36:27` vs the incoming's `2026-08-24T21:31:48`) and describes the
  work as done rather than outstanding.

  Per-fact resolution: body — same section changed differently on each side,
  HEAD is the later intent and supersedes "outstanding" with "added", so HEAD
  wins for that section; all other body sections — byte-identical on both sides,
  nothing to choose; `updated_at` / `last_field_updated` / `status` — HEAD later,
  HEAD wins; `commits`, `version`, `bundled_in` — present only on the HEAD side
  and preserved. Nothing was invented, and no prose present only on the incoming
  side was dropped except the superseded "Still outstanding" paragraph, whose
  subject matter HEAD covers in advanced form.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-6612c4b7.md` — the incoming commit's body rewrite is
  present in the resolved file. Section headings confirmed at
  `## Root cause — CONFIRMED` (line 40), `## What this ticket fixes in code`
  (58), `## Result` (106) including the "~78 ms to ~5 ms" figure (108),
  `## Superseded — the original hypothesis` (112), `## Reproduction (historical)`
  (171), `## Relationship to BUG-36` (182) with the incoming's reflowed closing
  sentence. Verified by direct blob diff of incoming vs resolved
  (`git hash-object` = `54e03170f8615a3a40cd150fa569cca6d1e49ff9`, the ours-side
  blob): no body hunk other than the observability section differs.

This resolution nets to no diff versus HEAD (`git status --porcelain` reports no
tracked entries at all). That is the redundant-commit case, not a discard:
STEP 3's check passes because the incoming commit's authored prose is *present*
in HEAD, verbatim, via a later route rather than absent. Per STEP 4 the file was
staged and left for `cherry_pick_finalize_resolution` to skip;
`--skip`/`--continue`/`--abort` were not called and `CHERRY_PICK_HEAD`
(`2759e5b5077faf531087d339c35b29c62cc1c6cc`) is intact.

No code, UAT, or spec-ticket files were involved in this conflict, so no
BUG-1301 precedence exception was needed.
