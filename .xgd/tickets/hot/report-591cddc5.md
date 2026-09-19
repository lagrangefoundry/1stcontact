---
uid: report-591cddc5
id: REPORT-4397
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T11:13:52.235652+00:00'
updated_at: '2026-09-19T11:13:52.235652+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-01ea4eec.md` (REQ-155) — **UU**, out-of-sparse-cone
  (no working-tree markers; conflict existed only in the index). Rule **2e**
  (intent/bookkeeping ticket), per-fact timeline resolution. Resolved to the
  HEAD-side content, staged byte-exact via `git cat-file blob <stage-2> > <path>`
  + `git add --sparse` (hash-object confirms `2e26c89e`, 10236 bytes, identical
  to index stage 2).

### Why HEAD wins each contested fact

Both sides edited the same three frontmatter facts from the same base
(`status: free_coded`, `updated_at: 2026-09-01T18:57:59`). The document body is
byte-identical on both sides — the entire conflict is lifecycle bookkeeping.

| Fact | Incoming (25fa2b65, 2026-09-01) | HEAD (997058fc, 2026-09-17) | Kept |
|---|---|---|---|
| `status` | `ready_to_reconcile` | `bundled` | HEAD |
| `updated_at` | `2026-09-01T19:02:00` | `2026-09-16T01:48:29` | HEAD |
| `completed_at` | `null` | `2026-09-14T10:29:15` | HEAD |
| `last_field_updated` | `status` | `status` | identical, no conflict |
| `fields.bundled_in` | absent (untouched) | `bundle-8e1807f6` | HEAD (additive) |

`ready_to_reconcile` is a strict *predecessor* of `bundled` in the same lifecycle
chain, so the incoming side is the earlier-positioned intent per fact; taking it
would regress the ticket's status backwards and drop `completed_at` and
`bundled_in`. The enrichment's own stated rule ("take the more recent commit by
timestamp") points the same way: HEAD's commit is 2026-09-17, incoming's is
2026-09-01.

No field was invented, and no `fields.intent_uid` / `story_uid` /
`capability_uid` was touched.

## Incoming changes preserved

Not a code file, but the STEP 3 redundant-vs-discarded distinction applies and
resolves to **redundant**:

The incoming commit's sole change is the transition `free_coded →
ready_to_reconcile`. That intent has already reached HEAD by another route — HEAD
carries `bundled_in: bundle-8e1807f6`, i.e. the ticket passed *through*
`ready_to_reconcile` and was consumed by this very reconcile bundle, then
advanced to `bundled` with `completed_at` set. The incoming change is therefore
superseded by its own downstream effect, not discarded. Nothing from the incoming
side is lost that HEAD does not already supersede.

Net result: the staged tree has no diff vs HEAD (`git status --porcelain` empty,
`git ls-files -u` empty). Per BUG-1109/BUG-1122 this is expected for a redundant
pick and is not a failure — `cherry_pick_finalize_resolution` will detect the
clean staged diff and skip the commit. `CHERRY_PICK_HEAD` (25fa2b65) was left
intact; no sequencer commands were run.

## Flagged for post-merge review

The enrichment classified one side's intent as unknown and asked for a
post-merge flag. Reviewers should confirm REQ-155's final lifecycle state reads
`status: bundled` / `completed_at: 2026-09-14T10:29:15` / `bundled_in:
bundle-8e1807f6` after the bundle merges, i.e. that the 2026-09-01
`ready_to_reconcile` stamp did not reassert itself.
