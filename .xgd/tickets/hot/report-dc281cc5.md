---
uid: report-dc281cc5
id: REPORT-3185
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T02:34:33.511533+00:00'
updated_at: '2026-09-01T02:34:33.511533+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-REQ-162
---

## Files resolved

- `.xgd/tickets/hot/bug-6612c4b7.md` — UU, index-only conflict (outside the
  sparse-checkout cone, DOC-986 §2/§4.1; sides read via `git show :1:/:2:/:3:`).
  Intent/bookkeeping ticket, rule **2e**, resolved per-fact to the HEAD (ours)
  content via `git checkout --ours --ignore-skip-worktree-bits` +
  `git add --sparse`.

  Incoming commit `2759e5b5` (2026-08-24T14:31:48-0700, `free_coded`) is the
  developer's large body rewrite — 114 insertions / 106 deletions — replacing
  the draft-era hypothesis narrative with the confirmed root cause and fix
  writeup.

  **The decisive measurement**: `diff` of theirs against ours shows the two
  bodies are byte-identical except for ONE section. Mechanically, of the 94
  lines incoming adds relative to base, **86 are present verbatim in HEAD**.
  The 8 that are not:

  | absent line(s) | why |
  |---|---|
  | `updated_at: '2026-08-24T21:31:48'`, `last_field_updated: body` | bookkeeping, superseded by HEAD's later `2026-08-26T17:36:27` / `status` |
  | the 6-line `## Still outstanding (not in this ticket)` section | superseded by HEAD's `## Observability — added here` |

  | fact | base (:1) | ours (:2, HEAD) | theirs (:3, incoming) | resolution |
  |---|---|---|---|---|
  | body: Symptom, Root cause CONFIRMED, What this ticket fixes in code, Result, Superseded, Reproduction (historical), Relationship to BUG-36 | draft-era hypothesis | rewritten | rewritten **identically** | no conflict — both sides agree |
  | observability section | `## Prerequisite — there is no telemetry` | `## Observability — added here` + `## Deployment` | `## Still outstanding (not in this ticket)` | **HEAD** — genuine competing fact, later-positioned intent wins |
  | `updated_at` | 21:06:30Z | **2026-08-26T17:36:27Z** | 2026-08-24T21:31:48Z | HEAD (later) |
  | `status` / `last_field_updated` | draft / title | **bundled / status** | draft / body | HEAD (later) |
  | `fields.{commits,version,bundled_in}` | absent | **present** | absent | HEAD |

  The observability section is the one genuinely competing fact — both sides
  rewrote it from base differently — so 2e's per-fact timeline rule applies and
  HEAD's later-positioned intent (2026-08-26 vs 2026-08-24) wins.

  Composition was considered and rejected as incoherent: incoming asserts the
  `[observability]` block is *not yet added* ("Worth adding; config-only, no
  code"), while HEAD documents it as *added*, explains the TOML table-ordering
  trap that nearly broke the production `routes` declaration, names the UAT that
  pins it (`test_UAT_FC_BUG-37_the_production_route_survives_the_new_table`), and
  records `wrangler deploy --env production --dry-run` verification. Keeping both
  would produce a self-contradictory document; keeping incoming's would regress a
  factual claim about work HEAD shows as complete.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-6612c4b7.md`: incoming's key change — the entire
  rewrite of the ticket narrative from "leading hypothesis / not started" to the
  confirmed free-plan CPU-ceiling root cause, the per-isolate memoisation fix
  with its correctness and bounding argument, the `Result` measurement, and the
  `Superseded` post-mortem — **is present in the resolved version**, verbatim,
  86 of 94 added lines matching exactly.

  Nothing was discarded. HEAD is a strictly later state of the same document on
  the same working timeline: it contains all of incoming's rewrite plus the
  observability work that incoming still listed as outstanding. The only lines
  not carried are the two superseded bookkeeping values and the one section HEAD
  advanced past. This is STEP 3's "present in HEAD via a different route" case,
  not the "simply absent" case.

  The staged diff vs HEAD is consequently empty; per STEP 4 the resolution was
  staged and left for `cherry_pick_finalize_resolution` to skip. No
  `--skip`/`--continue`/`--abort` issued; `CHERRY_PICK_HEAD`
  (2759e5b5077faf531087d339c35b29c62cc1c6cc) is intact.

No code, UAT or config files were in conflict, so the BUG-1301 precedence
exception did not arise and no hunk was dropped under it.
