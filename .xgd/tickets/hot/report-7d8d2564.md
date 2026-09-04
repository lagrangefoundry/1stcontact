---
uid: report-7d8d2564
id: REPORT-3459
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-04T01:54:58.500182+00:00'
updated_at: '2026-09-04T01:54:58.500182+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/request-26dafd83.md` — UU, intent/bookkeeping ticket
  (rule 2e). Outside the sparse-checkout cone, so the conflict existed only in
  the index with no working-tree markers (DOC-986 §2/§4.1); resolved with
  `git checkout --ours` + `git add --sparse`.

  **Why ours:** HEAD is a strict superset of the incoming version. The two
  sides' bodies are byte-identical apart from a trailing newline — both add the
  same `## What landed` section and both drop the now-answered **Granularity**
  open question. The only substantive difference is frontmatter that exists on
  the HEAD side alone:

  - `status: bundled` (incoming still says `free_coding`)
  - `fields.commits` — three `working_sha` entries (52fd6302…, 9ae73384…,
    c2f6c582…)
  - `fields.version: 0.2.31`
  - `fields.bundled_in: bundle-203b1dc2`
  - `updated_at: 2026-09-02T17:48:27Z` (later than incoming's
    2026-09-01T18:31:05Z), `last_field_updated: status`

  That is reconcile-owned bundling state recorded after the incoming commit was
  authored. Taking the incoming file whole would have reverted the ticket out of
  `bundled` and dropped the commit/version/bundled_in bookkeeping while adding
  nothing — the incoming side's only content change is already in HEAD. No
  per-fact timeline lookup was needed: the sides do not change the same fact
  differently, so 2e's superset rule applies directly.

## Incoming changes preserved

Incoming commit `f034eeee18172b33f1d11fdcf3ccbc0553a44a52`
(*xgd(ticket): update request request-26dafd83*, 2026-09-01) changed exactly one
file, and its whole substance is the `## What landed` body section plus the
removal of the **Granularity** open question. Verified present in the resolved
(= HEAD) version: both the `## What landed` heading and the
`**A projection is not renderManual.**` paragraph are in `HEAD:.xgd/tickets/hot/request-26dafd83.md`,
and the **Granularity** bullet is gone from the Open questions list. Diffing the
two index stages directly (`git diff :2:<path> :3:<path>`) shows no body
difference other than the trailing newline.

The staged tree therefore has no diff against HEAD. Per STEP 4 (BUG-1109 /
BUG-1122) this is a genuinely redundant commit, not a discarded one: STEP 3's
distinguishing check passes — the incoming commit's key changes are *present* in
HEAD, having arrived via the earlier bundling commit that also stamped the
bookkeeping fields. `--skip` was not called; the finalize step will detect the
clean staged diff.

No BUG-1301 precedence exception was invoked. No code, test, or spec-ticket
files were involved. CHERRY_PICK_HEAD is intact.
