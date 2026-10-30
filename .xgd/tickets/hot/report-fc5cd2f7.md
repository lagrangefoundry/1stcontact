---
uid: report-fc5cd2f7
id: REPORT-5511
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T08:07:22.889630+00:00'
updated_at: '2026-09-29T08:07:22.889630+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-26dafd83.md` — UU, intent/bookkeeping ticket
  (rule 2e). Single conflicted hunk: the `updated_at` frontmatter field.
  - OURS (HEAD, `xgd(ticket): seed_local_overlay request`):
    `2026-09-09T21:32:49.857144+00:00`, with `status: bundled` and
    `bundled_in: bundle-87be4669`.
  - THEIRS (`b8ad690c13`, `xgd(ticket): update request`):
    `2026-09-02T01:52:29.230056+00:00`, authored when the ticket was
    still `ready_to_reconcile`.
  - Same fact changed on both sides → later-positioned intent wins, per
    fact: kept HEAD's `2026-09-09T21:32:49`. Reverting to the incoming
    timestamp would leave `updated_at` disagreeing with the later
    `status`/`bundled_in` state already present on the branch.
  - Path is outside the sparse-checkout cone (`.xgd/tickets/`), so it was
    staged with `git add --sparse`.

## Incoming changes preserved

- `b8ad690c13` touched exactly one file and one line: the `updated_at`
  bump from `2026-09-01T23:10:06` to `2026-09-02T01:52:29`. Verified via
  `git show b8ad690c13 -- .xgd/tickets/hot/request-26dafd83.md` — the
  diff is `-updated_at: '2026-09-01T23:10:06.570969+00:00'` /
  `+updated_at: '2026-09-02T01:52:29.230056+00:00'`, nothing else.
- That single change is superseded, not discarded: HEAD already carries a
  strictly later `updated_at` written by a later commit on the same
  ticket, along with the downstream `status: bundled` /
  `bundled_in: bundle-87be4669` fields that the incoming commit predates.
  No content, field, or section from the incoming side is lost.
- No code/implementation files were involved in this conflict; no UAT
  test functions were touched; no hunk was dropped under the BUG-1301
  precedence exception.
- Result: the staged tree is byte-identical to HEAD for this path, so the
  cherry-pick resolves to a no-op. Staged and left for the finalize step
  to detect and skip — `--skip`/`--continue` were not invoked here.
