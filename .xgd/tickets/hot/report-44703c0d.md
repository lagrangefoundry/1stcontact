---
uid: report-44703c0d
id: REPORT-3152
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T00:54:45.891152+00:00'
updated_at: '2026-09-01T00:54:45.891152+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-REQ-162
---

## Files resolved

- `.xgd/tickets/hot/request-b474390f.md` — **AA** (both added), intent/bookkeeping
  ticket. Rule **2e** (strict-superset branch), corroborated by the enrichment's
  more-recent-commit-by-timestamp rule. Resolved to the **ours (HEAD)** side via
  `git checkout --ours` + `git add --sparse`.

  Both stages are byte-identical across all 296 lines except three frontmatter
  facts, all in the `status` lifecycle family (`last_field_updated: status` on
  both sides):

  | fact | ours (HEAD) | theirs (incoming) |
  |---|---|---|
  | `updated_at` | `2026-08-24T02:10:41` | `2026-08-20T21:15:50` |
  | `status` | `bundled` | `ready_to_reconcile` |
  | `fields.bundled_in` | `bundle-b3b7c399` | *(absent)* |

  HEAD is a strict superset: it advanced `status` forward along the lifecycle
  (`ready_to_reconcile` -> `bundled`) and added `bundled_in`, a field the
  incoming side never touched. Taking incoming would have reverted the ticket to
  a pre-bundling state and dropped `bundled_in` entirely. Both applicable rules
  agree — the ticket's own clock (HEAD +4 days) and the commit timestamps
  (HEAD-side `8a09ff92` Aug 30 vs incoming `9ef799f9` Aug 23).

  No `fields.intent_uid` / `story_uid` / `capability_uid` were modified; no
  content was invented beyond what the ours side already declared.

## Incoming changes preserved

The incoming commit `9ef799f9` is a whole-file add (296 insertions, single
file) — it is not a code file and contains no implementation hunks.

Its entire authored substance, the 296-line request body describing
`control-app` becoming the builder and the proxy being deleted, **is present
verbatim** in the resolved version: a direct `diff` of stage 2 against stage 3
shows differences confined to the three frontmatter lines tabulated above, with
the body byte-identical.

The staged diff vs HEAD is therefore empty. Per STEP 4 this is the
BUG-1109/BUG-1122 redundant-commit case, **not** a discard, and STEP 3's test
distinguishes them: the incoming commit's key content is *present* in HEAD
(having landed through the `seed_local_overlay` route at commit `8a09ff92`),
with a further status advance layered on top — it is not absent. No
`--skip` was issued; the tree is staged for the finalize step to detect.

No BUG-1301 precedence exception was invoked. No UAT test files were involved.
No hunks were dropped.

Post-merge review flag (from the enrichment's "intent unknown on one or both
sides" note): the only divergence is bookkeeping status metadata, and the
retained value is the more advanced one, so no reviewer action is expected.
