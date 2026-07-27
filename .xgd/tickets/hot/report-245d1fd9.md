---
uid: report-245d1fd9
id: REPORT-954
type: report
title: 'Resync resolve conflicts: 6d48343ad0f072dabecebca3519773a418964c85'
created_by: xgd
created_at: '2026-07-24T22:41:05.406740+00:00'
updated_at: '2026-07-24T22:41:05.406740+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-510318c4
---

## Files resolved

- `.xgd/tickets/hot/request-7ff1bacd.md` — **UU**, intent/bookkeeping ticket (rule 2e,
  `xgd-ticket-recent` merge driver). The driver did NOT run (see root cause below), so git
  fell back to a plain text merge and left markers. Rather than hand-adjudicate the ticket,
  the canonical driver was executed out-of-band from the working install against the three
  merge stages (`:1:` base, `:2:` ours, `:3:` theirs). It exited 0, emitted zero conflict
  markers, and selected **ours** (`updated_at 2026-07-24T20:53:00` > theirs
  `2026-07-24T20:45:08`). That byte-exact output was applied and staged.

The remaining four paths auto-merged cleanly (no conflict class); they are listed for
completeness, not as resolutions:

- `tools/generate/src/l1/fold.ts` — M
- `tests/req88-surface-attribution.test.ts` — M
- `tests/bug13-fold-section-background.test.ts` — M
- `storage/sites/gigabytealchemy/draft/pages/home.json` — M

## Incoming changes preserved

Every staged blob is byte-identical to its counterpart in CHERRY_PICK_HEAD
(`2c166b192aae8537bfd875799c7da5ec0ece8ea3`):

- `tools/generate/src/l1/fold.ts` — PRESERVED (`snappedTop` helper present, 3 refs)
- `tests/req88-surface-attribution.test.ts` — PRESERVED (both new UATs present:
  `..._band_top_snaps_up_to_the_edge_that_opens_its_section`,
  `..._band_top_snap_never_crosses_the_band_above_it`)
- `tests/bug13-fold-section-background.test.ts` — PRESERVED
- `storage/sites/gigabytealchemy/draft/pages/home.json` — PRESERVED

No UAT function was deleted on either side. HEAD and the pick-parent were identical for all
four content files (zero divergence), so taking the incoming side discarded nothing from main.

The ticket resolution is not a loss of incoming content: ours is a strict superset that already
records `working_sha: 2c166b192aae...` in its provenance plus the band-tops section and final
measurements. Taking theirs would have REGRESSED the ticket body.

Staged tree: `9eb6cc815913bab304f92553bd0aba4c7db98458`. Net change from HEAD is non-empty
(4 files). Cherry-pick left paused; CHERRY_PICK_HEAD intact for the next step.

## DEFECT — stale merge-driver path (needs operator action)

`.gitattributes:14` routes `.xgd/tickets/**/*.md` to `merge=xgd-ticket-recent`, but the
repo-local git config points the driver at a dead path:

    /Users/martin/.pyenv/versions/3.12.11/lib/python3.12/site-packages/xgd_source/scripts/merge_ticket_recent.py

That `xgd_source` install is stale/partial — it contains only `core/` and `features/`, no
`scripts/`. The active xgd (`which xgd`) resolves to
`/Users/martin/Projects/xgendev-main/.venv-working/`, where the script DOES exist and works.

Consequence: every ticket merge in this resync run silently loses driver semantics and falls
back to a text merge, manufacturing conflicts that are not real. This is a broken-config ERROR,
not a workflow failure. Suggested repair:

    git config merge.xgd-ticket-recent.driver \
      '/Users/martin/Projects/xgendev-main/.venv-working/bin/python /Users/martin/Projects/xgendev-main/.venv-working/lib/python3.12/site-packages/xgd_source/scripts/merge_ticket_recent.py %O %A %B %P'
