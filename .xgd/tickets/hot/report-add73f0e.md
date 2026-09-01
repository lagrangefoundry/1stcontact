---
uid: report-add73f0e
id: REPORT-3149
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T00:46:42.165467+00:00'
updated_at: '2026-09-01T00:46:42.165467+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-REQ-162
---

## Files resolved

- `.xgd/tickets/hot/request-18a48d63.md` — class **AA** (both added; effectively modify/modify,
  no merge base). Intent/bookkeeping ticket → **rule 2e**, resolved per-fact, not whole-file.

  Sides: ours = HEAD commit `209bea11` (2026-08-30, `seed_local_overlay request request-18a48d63`),
  blob `updated_at` 2026-08-24. Incoming = `fb1d4d62` (2026-08-23, `update request request-18a48d63`),
  blob `updated_at` 2026-08-17. The incoming commit touches this file only.

  The two blobs differ in **frontmatter only** — the entire markdown body is byte-identical
  (verified by direct blob diff: 3 hunks, all inside the `---` frontmatter). Per-fact:

  | Fact | Ours | Theirs | Applied | Basis |
  |---|---|---|---|---|
  | `status` | `bundled` | `ready_to_reconcile` | ours | same field, differing → later intent; also forward lifecycle direction |
  | `updated_at` | 2026-08-24T02:10:41 | 2026-08-17T20:06:08 | ours | later |
  | `fields.bundled_in` | `bundle-b3b7c399` | *absent* | ours | strict superset; theirs never carried the field |
  | `fields.commits` | 1 entry, `7ebc721b` folded into `working_sha_history` | 2 entries, `7ebc721b` standalone | ours | **identical sha set**; ours is the later normalization |

  Both timestamp axes (commit date and ticket `updated_at`) agree on ours being later, so the
  timeline rule is unambiguous. No `intent_uid` / `story_uid` / `capability_uid` was touched,
  and no content absent from both sides was invented.

## Incoming changes preserved

Not a code file, but the equivalent check was run and passes — **nothing incoming is discarded**:

- The incoming commit's substantive fact is the recording of working sha
  `7ebc721b83ab6202fdec600cd0493b69964bac39` against REQ-143. That sha **is present** in the
  resolved file, inside the single commit entry's `working_sha_history`. The full sha set is
  identical on both sides — `{96118c32, b71a8641, 761b7fbd, 7ebc721b}` — so the two sides differ
  only in how the same four shas are grouped, and ours is the later grouping produced by bundling.
- The incoming `status: ready_to_reconcile` was not dropped but **superseded forward** by
  `status: bundled` on HEAD, which is the later state of the same lifecycle field.

Result: the resolution nets to **no staged diff vs HEAD** (ours stage-2 blob `beb1073f` is
byte-identical to `HEAD:.xgd/tickets/hot/request-18a48d63.md`). This is the redundant-commit case
of BUG-1109/BUG-1122, **not** a discard — the STEP 3 discriminator confirms it: the incoming
commit's key change is *present in HEAD via a different route* (the folded `working_sha_history`
plus the advanced status), not merely absent. Per STEP 4, `--skip` was **not** called; the tree is
staged and the finalize step will detect the clean staged diff.

No BUG-1301 precedence exception was invoked. No test functions were involved or deleted.

Cherry-pick sequencer state left intact: `CHERRY_PICK_HEAD` = `fb1d4d62`, 0 unmerged paths.
