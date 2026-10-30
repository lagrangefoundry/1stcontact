---
uid: report-85fa0078
id: REPORT-4514
type: report
title: 'Resync resolve conflicts: 18ffaec45665d29545db8bfd323ee4bf6d1f8678'
created_by: xgd
created_at: '2026-09-20T19:25:09.962422+00:00'
updated_at: '2026-09-20T19:25:09.962422+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/doc-5ecc3343.md` — **AA** (both added), intent/bookkeeping ticket (`type: doc`, not a matrix-defining spec ticket) → **rule 2e**, resolved per-fact. Sparse-cone path; conflict materialized on disk with real markers, resolved with `git checkout --ours` + `git add --sparse`.

Bodies were byte-identical on both sides (`git diff :2: :3:` showed frontmatter-only divergence). Two facts were in conflict:

| Fact | Ours (HEAD) | Theirs (e9418de) | Taken |
|---|---|---|---|
| `updated_at` | `2026-08-31T19:43:21.400065+00:00` | `2026-08-16T01:19:37.724358+00:00` | **Ours** |
| `fields.system_kb` | absent (retired) | `true` | **Ours** (absent) |

### Why ours wins on both facts

The two sides are not competing edits — the incoming side is the *older* state of the same field, and HEAD carries a later, explicitly documented retirement of it.

Ledger replay (`xgd ticket history doc-5ecc3343`, both revs):

- `265ccfa` (Aug 15) — sets `system_kb: true`, `updated_at` → `2026-08-16T01:19:37`. This is exactly the incoming blob's state.
- `0d11a01` (Aug 20) — `xgd(resync): strip .xgd/tickets … from main snapshot (BUG-904)`. Present only on the incoming lineage; listed in this run's anchor `skipped_commits`.
- `e9418de` (Aug 23, **the incoming commit**) — re-adds the ticket after that strip. Its `--commit-message` narrative is a bare `xgd(ticket): update doc doc-5ecc3343`; the diff restores the Aug-15 content verbatim. It carries **no new intent** for `system_kb` — it is snapshot restoration, not a decision.
- `30c47c0` (Aug 31, **on HEAD**) — `field: retire system_kb boolean; membership moves to doc_kind (DOC-39 3.3)`. Removes `system_kb: true` and bumps `updated_at`.

So the same fact (`system_kb`) resolves to the later-positioned intent under 2e: HEAD's Aug-31 retirement post-dates the Aug-15 set that the incoming commit merely re-materialized, and it states its rationale explicitly (membership now expressed via `doc_kind`, per DOC-39 §3.3). Re-adding `system_kb: true` would silently revert that documented schema decision. `updated_at` follows the same ordering.

Note that `last_field_updated: system_kb` is common to both sides and is preserved — it correctly records that the most recent operation on this ticket touched the `system_kb` field (the retirement).

## Incoming changes preserved

No incoming developer content was discarded. The incoming commit `e9418de` contributes no body change (bodies identical) and no novel field intent — its only frontmatter deltas relative to HEAD are the pre-retirement `system_kb: true` and the corresponding older `updated_at`, both of which HEAD supersedes via the later, explicitly narrated `30c47c0` retirement.

The BUG-1301 precedence exception was **not** needed and is not invoked; no test function or code hunk was dropped. No `tests/**` or `xgd_source/**` files were involved in this conflict.

Resulting staged tree is identical to HEAD (`git status --porcelain` empty), i.e. this cherry-pick has no net effect — the resync branch already carries a strictly newer state of this ticket. `--skip` was **not** called; CHERRY_PICK_HEAD (`e9418de5e0826e5533382e471174eda4fdccc1e5`) remains present for the finalize step.
