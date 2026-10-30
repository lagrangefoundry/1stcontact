---
uid: report-31aa9da4
id: REPORT-4706
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T10:50:26.285592+00:00'
updated_at: '2026-09-21T10:50:26.285592+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-78370159.md` — **UU**, intent/bookkeeping ticket
  (STEP 2e). Resolved by per-fact composition of the two intent ledgers, which
  evaluates to HEAD's blob verbatim (`9c6d321c8b13840940fd0f2800f0edab053050f4`).
  Staged via `git update-index --cacheinfo` (path is outside the sparse-checkout
  cone, so the conflict existed only in the index with no working-tree markers)
  and materialized with `git checkout-index -f` so the worktree matches its
  siblings in `.xgd/tickets/hot/` (all `H`, not `S`).

### Ledgers compared

- **Incoming** (`139c79dec2`, Aug 31 17:53, `xgd(ticket): update request`) — the
  free-coding lifecycle record on the xgd-working line:
  `draft → free_coding → free_coded`, adding the two `working_sha` entries and
  `version: 0.2.26`.
- **HEAD** (`58ee785188`, Sep 9 14:35, `xgd(ticket): seed_local_overlay`) — the
  bundling operation on the main-rooted resync line: `draft → bundled`,
  `story_points 8 → 13`, adding `bundled_in: bundle-87be4669`.

### Per-fact resolution

| Fact | Incoming | HEAD | Applied | Why |
|---|---|---|---|---|
| `commits` (2× `working_sha`) | added | already present, identical | present | not in conflict; incoming's addition already in HEAD |
| `version` | `0.2.26` | `0.2.26` | `0.2.26` | identical on both sides |
| `status` | `free_coded` (Sep 1) | `bundled` (Sep 9) | `bundled` | genuine same-fact conflict → later-positioned intent wins; `bundled` is also downstream of `free_coded` in the lifecycle, so it subsumes it |
| `story_points` | `8` (unchanged from base) | `13` | `13` | HEAD-only change, not a conflict |
| `bundled_in` | absent | `bundle-87be4669` | present | HEAD-only addition, preserved |
| `updated_at` / `last_field_updated` | Sep 1 / `status` | Sep 9 / `status` | Sep 9 / `status` | travels with the winning `status` fact |
| body prose | identical (no trailing newline) | identical (trailing newline) | HEAD's | byte-identical apart from the trailing newline |

No non-overlapping edit on the incoming side was discarded: every field the
incoming commit introduced is present in the staged result. The single
same-fact divergence (`status`) went to the later-positioned side, consistent
with both STEP 2e's per-fact timeline rule and the auto-enriched resolution
rule for this file.

## Incoming changes preserved

Verified against `git show :.xgd/tickets/hot/request-78370159.md`:

- `working_sha: 855dd57a7c765c187b5b0acb10842562bb340796` — present (line 20)
- `working_sha: 482a1f984651e81351e1c96b578064e19de9aa7a` — present (line 23)
- `version: 0.2.26` — present (line 26)
- `last_field_updated: status` — present (line 11)

No hunk was dropped under the BUG-1301 precedence exception; no code or UAT
test files were involved in this conflict.

## Post-merge review flag

Per the auto-enriched metadata ("Intent unknown on one or both sides … flag
this file for post-merge review"), `.xgd/tickets/hot/request-78370159.md` is
flagged. Specifically worth a human glance: the ticket's `status` now reads
`bundled` while the incoming free-coding record that set `free_coded` has been
superseded — correct if `bundle-87be4669` genuinely subsumes this ticket's
free-coded work, which the Sep 9 `seed_local_overlay` asserts.

## Cherry-pick state

`CHERRY_PICK_HEAD` (`139c79dec2a17f0370d8e8eebc2e378cf24c8187`) left intact.
`git ls-files -u` is empty and `git status --porcelain` is clean. Because the
resolution equals HEAD, the staged diff against HEAD is empty — the finalize
step will detect this and skip the commit. No `--continue`/`--skip`/`--quit`/
`--abort` was invoked.
