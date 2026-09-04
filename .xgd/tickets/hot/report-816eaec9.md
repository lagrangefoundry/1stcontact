---
uid: report-816eaec9
id: REPORT-3442
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-04T01:06:24.053348+00:00'
updated_at: '2026-09-04T01:06:24.053348+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/request-6893f6ea.md` — **UU**, index-only (path is outside
  the sparse-checkout cone, so there were no working-tree conflict markers;
  resolved with `git checkout --ours` + `git add --sparse`, DOC-986 §2/§4.1).
  Rule applied: **2e (intent/bookkeeping ticket)**, "one side is a strict
  superset of the other → keep the superset". Resolution: **HEAD side kept**.

  Per-fact analysis (2e resolves per fact, not per whole file):

  | fact | ours (HEAD, `0ee399eeb5` seed_local_overlay, 2026-09-02 10:50) | theirs (incoming `b986aab196` free_coded, 2026-08-31 18:21) | kept |
  |---|---|---|---|
  | `updated_at` | `2026-09-02T17:48:27` | `2026-09-01T01:21:47` | ours (later) |
  | `status` / `last_field_updated` | `bundled` / `status` | `free_coding` / `body` | ours — bundling state is workflow-owned; taking `free_coding` back would revert it |
  | `fields.commits`, `fields.version: 0.2.27`, `fields.bundled_in: bundle-203b1dc2` | present | absent (untouched by incoming) | ours — incoming never touched these |
  | body — trailing empty bullet in `## Open questions` | present (`- `) | present (`-`) — this is the incoming commit's ONLY body edit | ours (identical content, ours has a trailing space) |
  | body — everything else (size analysis restated as measured, `NODE_USE_ENV_PROXY` second blocker, corpus-scoped section, reflow) | later revision, superset | older text, untouched by the incoming diff | ours — incoming made no competing edit here |

  No genuine competing fact exists: the incoming diff against its own base
  changes exactly two things (`updated_at`, and the appended empty bullet), and
  the HEAD side is later on both.

## Incoming changes preserved

The incoming commit `b986aab1967c44179f7b830ff7cc262e36245eb6` touches one file
and its full diff is 3 insertions / 1 deletion:

```
-updated_at: '2026-09-01T01:16:45.609695+00:00'
+updated_at: '2026-09-01T01:21:47.009068+00:00'
@@
+-
+
 -
```

Both are present in the resolved (HEAD) version by a different route:

- The appended empty bullet is in the resolved file — verified directly:
  `git cat-file blob ccbacba4cc | grep -c '^- $'` → `1`, i.e. the resolved blob
  carries the second trailing `-` bullet the incoming commit added. The
  HEAD-side revision independently made the same append as part of its own
  later body edit.
- `updated_at` is superseded, not discarded: HEAD carries
  `2026-09-02T17:48:27`, later than the incoming `2026-09-01T01:21:47`.

No developer code was dropped. Nothing was resolved under the BUG-1301
precedence exception; no test file was involved.

**Net effect:** the resolution stages identically to HEAD (index stage 0 is
`ccbacba4ccf1f11f29a4e8585bf4d208a0196bd0`, HEAD's blob), so this commit is
redundant — its effect already landed through the later HEAD-side revision
(BUG-1109/BUG-1122). Per STEP 4 this is staged and exited `@done` without
calling `--skip`; `cherry_pick_finalize_resolution` will detect the clean
staged diff. STEP 3 distinguishes this from a discard: the incoming commit's
key change is *present* in HEAD, not absent.
