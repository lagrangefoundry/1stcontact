---
uid: report-45c3360b
id: REPORT-2686
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T05:15:02.566847+00:00'
updated_at: '2026-08-31T05:15:02.566847+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-554ac441.md` — **UU**, index-only (path is outside
  the sparse-checkout cone, so no working-tree markers existed; resolved with
  `git checkout --ours` + `git add --sparse` per DOC-986 §2/§4.1).
  Rule applied: **2e (intent/bookkeeping ticket)** — "one side is a strict
  superset of the other: keep the superset." Resolved to **ours (HEAD)**.

  The auto-enriched metadata classed this as "intent unknown on one or both
  sides — take the more recent commit by timestamp." That rule and the 2e
  superset rule agree here, so no per-fact tie-break was needed:

  | | ours (HEAD) | theirs (incoming `7782255e`) |
  |---|---|---|
  | `updated_at` | 2026-08-24T02:10:41Z | 2026-08-23T03:22:54Z |
  | `status` | `bundled` | `free_coded` |
  | `fields.version` | 0.2.9 | 0.2.7 |

  A direct blob diff of theirs → ours (`0dc6fa73` → `6546223f`) is purely
  additive on the ours side. Nothing theirs contributes is dropped: every line
  is either byte-identical or is a later value of the same field.

## Incoming changes preserved

The incoming commit `7782255e` ("xgd(ticket): update request request-554ac441")
made exactly three changes to this file. All three are present in the resolved
version, reached through a later route rather than discarded:

1. **`status: free_coding` → `free_coded`.** HEAD carries `status: bundled`.
   The ticket advanced *through* `free_coded` and on to `bundled` — HEAD also
   carries `bundled_in: bundle-b3b7c399`, this reconcile's own intent bundle,
   which only gets set after `free_coded`. Superseded, not lost.

2. **`fields.version: 0.2.1` → `0.2.7`.** HEAD carries `0.2.9`. The ticket body
   on the HEAD side documents both intervening bumps in its own "Version
   bookkeeping" sections (0.2.7, then 0.2.8, then 0.2.9). Superseded, not lost.

3. **Two new `free_coded_shas` entries** — `932f362e4f60b8797557ba8f4cdd1fddeb1c9068`
   and `92fc26e7bcc2a941999ba0e55292cda6b092bd26`. Both are present verbatim in
   HEAD, each additionally carrying `working_sha_history: []`, alongside two
   further entries HEAD adds (`ec144c85`, `02bd4437`).

The incoming commit touched frontmatter only — it contributed no body content,
so no narrative text was at risk. HEAD's version of the body is a strict
superset, adding two follow-up sections (the `bin/build` type-only node reach,
and the deploy secret guard) with acceptance criteria 12–16.

No hunks were dropped under the BUG-1301 precedence exception; it did not apply
to this resolution. No code, test, or spec-ticket files were involved.

## Note for the finalize step

The staged tree has **no net diff against HEAD** (`git diff --cached HEAD` is
empty). This is the redundant-commit case of BUG-1109/BUG-1122, not a discarded
one — STEP 3's distinguishing check is satisfied above: the incoming commit's
key changes are demonstrably *present in HEAD* via later commits on the bundle
branch, rather than simply absent. Per STEP 4 no `--skip` was issued from here;
`CHERRY_PICK_HEAD` (`7782255e4ebcea00a8d9590dfe4c846e3067c175`) is left intact
for `cherry_pick_finalize_resolution` to detect the clean staged diff and skip
the commit itself.
