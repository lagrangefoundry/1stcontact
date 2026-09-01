---
uid: report-1e9d84cc
id: REPORT-3180
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T02:20:57.543572+00:00'
updated_at: '2026-09-01T02:21:22.967008+00:00'
completed_at: null
last_field_updated: status
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-REQ-162
status: pass
---

## Files resolved

- `.xgd/tickets/hot/bug-6612c4b7.md` — class **AA** (both added, no merge
  base), intent/bookkeeping ticket → **rule 2e** (with 2b's superset test).
  Resolved to **ours (HEAD)** via `git checkout --ours` + `git add --sparse`
  (path is outside the sparse-checkout cone on this reconcile branch,
  DOC-986 §2/§4.1).

  Ours = `501a0595d1` *"xgd(ticket): seed_local_overlay bug bug-6612c4b7"*
  (2026-08-31). Theirs = `4677b81619` *"xgd(ticket): create bug bug-6612c4b7"*
  (2026-08-24), the incoming cherry-pick.

  The two sides are the same ticket (BUG-37, identical `uid`/`id`/`created_at`)
  at two lifecycle points, not two independent authorings:

  | | ours (HEAD) | theirs (incoming) |
  |---|---|---|
  | `status` | `bundled` | `draft` |
  | `updated_at` | 2026-08-26T17:36 | equal to `created_at` — never updated |
  | `last_field_updated` | `status` | `created_at` |
  | fields | adds `chat_comment`, `commits` (3 working SHAs), `version`, `bundled_in: bundle-78f4e2fe` | none of these |
  | body | CONFIRMED root cause (measured in workerd), the shipped fix, the observability block, plus the original hypothesis retained under "## Superseded" | original hypothesis only; ends "## Not started — Diagnosis only. No branch cut, no code written." |

  Ours is the strict superset and the later state; theirs is the ticket's birth
  state and is fully ancestral to it. 2e's superset rule and the auto-enriched
  rule ("intent unknown on one or both sides — take the more recent commit by
  timestamp and flag for post-merge review") agree: ours. Taking theirs would
  have rewound BUG-37 by seven days, dropping `bundled` status, the three
  recorded `working_sha` entries, `bundled_in`, and the confirmed measurement.

  No per-fact split was warranted: every field theirs carries, ours also
  carries (at an equal-or-later value), so there is no disjoint edit on the
  incoming side to compose in. Lossless-`--ours` check per the standing rule:
  the resolved working file is byte-identical to the stage-2 blob, and 0
  conflict markers remain.

  **Flagged for post-merge review** per the enrichment rule.

No code/implementation files were conflicted. The incoming commit
`4677b81619` touches exactly one file (144 insertions, 1 file changed) — the
ticket above.

## Incoming changes preserved

No code files to verify — the incoming commit contains no
`xgd_source/`, `tests/`, `bin/`, `*.py` or config changes.

For the one ticket file, this is STEP 4's *redundant*, not STEP 3's
*discarded*, case. The incoming commit's effect — BUG-37 existing with its
initial diagnosis recorded — is already present in HEAD, reached by a
different route (`seed_local_overlay` carried the live ticket store forward
from the same creation event). Concretely, HEAD's version retains the
incoming side's content: its hypothesis survives in the
"## Superseded — the original hypothesis, recorded because it was wrong"
section (which cites and then falsifies each of its three claims by
measurement), and its "## Reproduction" and "## Relationship to BUG-36"
sections are carried verbatim. Nothing the developer wrote on the incoming
side is absent from the resolved tree.

Consequence: the staged diff against HEAD is empty. Per STEP 4 this is not a
failure and `--skip` was NOT called — `cherry_pick_finalize_resolution` will
detect the clean staged diff and skip the commit. `CHERRY_PICK_HEAD`
(`4677b816199d596f493093d78959d5e6c778d6a3`) is left in place.

No BUG-1301 precedence exception was invoked; no test function was deleted.