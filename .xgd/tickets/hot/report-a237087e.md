---
uid: report-a237087e
id: REPORT-5720
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-30T10:06:05.529717+00:00'
updated_at: '2026-09-30T10:06:05.529717+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

# Resync resolve conflicts — `98be01b7f1` (REQ-252)

Picked commit: `98be01b7f13d211f0a59b2f5e1e3b1a73976df2d`
"feat(builder): show an email page's subject, and name it in the page list [FREE-CODED]"
(author 2026-09-15 18:47:14 -0700, 12 files, +1085/-14)

HEAD `3b3d544ac1017fc14c1a65e1d27d5a255adf3a00` (unmoved).
Apply target `9ac98712a708888db67f8aff21f22b16bd98094e`. Anchor `report-377b581e`.
`prior_stage_failure`: empty.

11 of the commit's 12 files applied cleanly. **One conflicted path, one region.**

## Files resolved

### `package.json` — `UU`, 1 region — **INCOMING (theirs) outright**

Both sides' entire delta from base is the `version` line:

| stage | blob | `version` |
|---|---|---|
| `:1:` base | `7a815caee2` | `0.2.210` |
| `:2:` ours | `5e9a214bde` | `0.2.212` |
| `:3:` theirs | `b4d3f3450e` | `0.2.213` |

`git diff :1: :2:` and `git diff :1: :3:` are each a single hunk touching only that
line — no dependency, script, `packageManager` or other field differs on either side.

This is the **monotone-counter shape with incoming HIGHER**, the same inverted case
recorded on the REQ-251 pick (`5800000879`: base `0.2.207` / ours `0.2.209` / theirs
`0.2.210`). Two independent arguments agree, so there is no tension to arbitrate:

1. **HARD RULES, code and implementation files**: incoming (xgd-working) is
   authoritative; a resolution that keeps only main's version is data loss and is
   never correct. `0.2.213` is incoming's value verbatim.
2. **Monotone counter**: `0.2.213 > 0.2.212`, so taking incoming *advances* the
   counter. Ours' bump (`chore(version): 0.2.212 — 0.2.211 was taken by BUG-98
   mid-cycle`) is passed through, not rolled back. Nothing on the ours side is lost;
   the only content main contributed to this file is a lower value of the same
   monotone field.

The REQ-247 stale-auto-merge check was run and **passed rather than fired**:
`git diff :1: :2:` over the whole file shows ours' delta is the single version line —
no rollback of an earlier incoming feature and no ours-side invention hiding in an
auto-merged region — so the "take incoming for the whole file because ours is a
rollback" remedy was not needed as a rescue; `--theirs` here is the plain 2c-step-2
outcome.

Resolution mechanics: `git checkout --theirs -- package.json`, then
`git add --sparse -- package.json`.

## Incoming changes preserved

- **`package.json`**: `git diff b4d3f3450e -- package.json` is **empty** — the
  resolved file is byte-identical to the incoming stage, so every incoming hunk is
  present and nothing was dropped.
- **The whole commit**: `git diff --cached --stat HEAD` reports
  `12 files changed, 1085 insertions(+), 14 deletions(-)`, which is exactly the
  picked commit's own diffstat. The 11 auto-applied files (`builder/api.js`,
  `builder/app.js`, `builder/builder.css`, `builder/pages.js`, `builder/toolbar.js`,
  `router.ts`, `reconciliation-builder-workspace-origin.test.ts`,
  `tools/generate/src/cli/edit.ts`, and the three new
  `test_UAT_FC_REQ-252_*` files) therefore landed with incoming's content intact
  alongside the resolved `package.json`.
- **2f (UAT tests)**: no test function was deleted or weakened. The pick's three new
  UAT files (`test_UAT_FC_REQ-252_email_subject.test.ts`,
  `test_UAT_FC_REQ-252_page_control.test.ts`,
  `test_UAT_FC_REQ-252_subject_route.workers.test.ts`) are added in full, and the one
  pre-existing test it touches (`reconciliation-builder-workspace-origin.test.ts`,
  `+12`) is additive.

## Auto-enriched conflict metadata

The enrichment for `package.json` said "Intent unknown on one or both sides. Take the
more recent commit by timestamp and flag this file for post-merge review." Ours is the
more recent commit, so the naive rule pointed at main — into the data-loss HARD RULE
and into a counter rollback. **That is the fifth consecutive code pick on this branch
where the timestamp rule was wrong**; it was not followed. The version values settle
the question without reference to timestamps.

## Arbitration of last resort (BUG-1460)

Not applicable — STEP 3h never fired. The conflict was a single monotone counter where
the HARD RULE and the counter argument point the same way; no incoming change had to be
discarded.

## Exit state

- No unmerged entries (`git ls-files -u` empty).
- `git status --porcelain | grep -v '^[MAD] '` empty — nothing unstaged or untracked
  in the resync tree.
- HEAD unmoved at `3b3d544ac1`; `CHERRY_PICK_HEAD` intact at `98be01b7f1`.
- **Real net change staged** (correct for a code pick; finalize will commit it rather
  than skip).

## Forecast for the next picks

- This is now the **fifth** code pick in the REQ-24x/REQ-25x series and the **second**
  `package.json`-only conflict. On any further pick whose sole conflicted path is
  `package.json`: run `git diff :1:package.json :3:package.json` and
  `git diff :1:package.json :2:package.json`. If `version` is the only differing line,
  resolve immediately — `--theirs` when theirs is the higher value (incoming advances
  the counter, HARD RULE and counter agree), `--ours` when theirs is lower (incoming
  would be a rollback and ours passed through theirs' value). Do a replay lookup only
  if some *other* field differs; the counter argument does not cover real content.
- Ours' counter now equals incoming's `0.2.213`, so the next incoming bump on this
  series should be strictly higher and auto-merge or resolve `--theirs`.
- Keep running the REQ-247 stale-auto-merge check (`git diff :1: :2:` over the whole
  file) on every code conflict — it is what distinguishes "edit the marked region"
  from "take incoming for the file".
- Ignore the enrichment's timestamp rule on code paths. Five for five wrong.
