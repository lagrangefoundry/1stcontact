---
uid: report-1fc3a79d
id: REPORT-4731
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T14:22:50.525860+00:00'
updated_at: '2026-09-21T14:22:50.525860+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-3bc4b835.md` — **UU**, intent/bookkeeping ticket (STEP 2e).
  REQ-167 "Identity: the invite provisions the account, login binds it".
  Outside the sparse-checkout cone (DOC-986 §2/§4.1), so the conflict existed
  only in the index with no working-tree markers; resolved by materialising the
  stage-2 blob and staging with `git add --sparse`.

  Both sides touched the same three frontmatter facts:

  | fact | base | ours (HEAD) | theirs (CHERRY_PICK_HEAD) |
  |---|---|---|---|
  | `status` | `free_coded` | `bundled` | `ready_to_reconcile` |
  | `updated_at` | 2026-09-01T01:31:23 | 2026-09-09T21:32:50 | 2026-09-01T18:09:26 |
  | `last_field_updated` | `story_points` | `status` | `status` |

  Ours additionally adds `fields.bundled_in: bundle-87be4669` and a trailing body
  section ("Note: the account/business split came after this ticket") reconciling
  REQ-167 against DOC-40 §2 and pointing forward to REQ-178. Theirs adds nothing
  beyond the three fields above.

  **Rule applied**: `status` is the same fact changed differently on both sides —
  a genuine intent conflict, so 2e's later-positioned-intent rule decides it, per
  fact. Ours is later by eight days and sits further along the same lifecycle path
  (`free_coded` → `ready_to_reconcile` → `bundled`); theirs is an earlier point on
  that same path being replayed. Ours is therefore also a strict superset of
  theirs' information. Took ours verbatim. This matches the auto-enrichment's
  "take the more recent commit by timestamp" guidance for the unknown-intent case.

  **Flagged for post-merge review** per the enrichment metadata: intent was
  unresolvable from the commit subjects (both sides are the generic
  `xgd(ticket): update request request-3bc4b835`), so the decision rests on
  timestamp plus lifecycle ordering rather than a stated operation narrative.

## Incoming changes preserved

No code/implementation files were in conflict — the single conflicted path is a
bookkeeping ticket, not `xgd_source/**`, `tests/**`, or `bin/**`. No UAT test
functions were touched, and the BUG-1301 precedence exception was not invoked.

The incoming side's substantive content is fully represented in the resolved
version: theirs advanced `status` to `ready_to_reconcile` and stamped
`last_field_updated: status`; ours carries that same `last_field_updated` value
and a `status` further along the identical lifecycle, so nothing the incoming
commit expressed is lost — it is superseded by a later state on the same axis.

Because the resolution equals HEAD exactly, the staged diff against HEAD is
empty. Per STEP 4 this is expected and left alone: staged and exiting @done
without calling `--skip`, so Python's finalize step can detect the clean staged
diff and skip the commit itself. `CHERRY_PICK_HEAD` is intact.
