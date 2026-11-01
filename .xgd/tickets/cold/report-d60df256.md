---
uid: report-d60df256
id: REPORT-998
type: report
title: 'Resync resolve conflicts: 006568bd9e49cc7323728e278446fbe1f1e9b96b'
created_by: xgd
created_at: '2026-07-27T21:20:18.267675+00:00'
updated_at: '2026-07-27T21:20:18.267675+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-510318c4
---

## Files resolved

- `package.json` — **UU**, config file (§2g scalar). Sole conflict in the run.
  The two sides differ **only** on the `version` scalar: ours (main-rooted
  resync tip, `fe980a927`, 2026-07-27) is `0.0.212`; incoming
  (`5b7f82be5`, 2026-07-25) bumps `0.0.204` → `0.0.205`. Every other key
  (scripts, engines, devDependencies, packageManager) is byte-identical on
  both sides, so nothing else had to be merged.

  **Rule applied**: enrichment rule for unknown-intent — take the more recent
  commit by timestamp. HEAD is two days newer *and* the higher value on a
  monotonic counter; taking incoming would regress the published version by
  seven bumps. Kept `0.0.212`. The incoming commit's version bump is
  superseded rather than discarded: its bump target (`0.0.205`) is already
  behind the resync branch's counter, and the free-coding version-bump gate
  was satisfied on `xgd-working` when the commit was authored.

  Result validated as parseable JSON (`require('./package.json').version` →
  `0.0.212`). Flagged for post-merge review per the enrichment rule, though
  the residual risk is nil — the file's only divergence is a counter the
  resync branch already owns.

## Incoming changes preserved

All 11 non-conflicting paths from `5b7f82be5` auto-merged cleanly and were
verified **byte-identical to the incoming commit's version** (diffed each
staged working-tree file against `git show 5b7f82be5:<path>` — zero
differences on every one):

- `packages/framework/src/modules/contact-form/index.astro` — identical
- `packages/framework/src/modules/contact-form/meta.ts` — identical
- `tools/generate/src/l1/forms.ts` — identical
- `tools/generate/src/l1/fold.ts` — identical
- `tools/generate/src/l1/probes.ts` — identical
- `tools/generate/src/cli/index.ts` — identical
- `tools/generate/src/cli/repro.ts` — identical
- `tests/req88-form-labelling-and-submit.test.ts` — identical (new file, `A`)
- `tests/req93-l1-slot-mounted-behaviors.test.ts` — identical
- `tests/bug21-control-surface-outset.test.ts` — identical
- `tests/reconciliation-reproduction-treatments.test.ts` — identical

Spot-checked the commit's two headline behaviours as present in the staged
tree:

- **`labelMode` carried fold → config → render**: `forms.ts:62,255-256`
  (derives `placeholder` from `el.nameSource`), `meta.ts:38` (typed enum,
  default `visible`), `index.astro:18,40,70-74` (visually-hidden `<label>`
  retained and programmatically associated, so the a11y obligation is not
  traded for the look).
- **Submit-slot lifting**: `forms.ts:79-93` (`submit?: L1Node` slot),
  `:180` (`submitSlotFrom`), `:187` (rect distance helper), `:199`
  (`submitProximityThreshold`).

No UAT/test function was deleted on either side — the only test-file delta
is the *addition* of `req88-form-labelling-and-submit.test.ts`. No
intent/bookkeeping ticket conflicted. No developer code was discarded.

## Staging state

`git status --porcelain` shows no conflict-class lines (UU/AA/DU/UD/AU/UA);
11 files staged (`M`/`A`) as net change from HEAD, so the resolution is not
empty. `package.json` correctly drops out of the staged diff because the
resolution equals HEAD for that file. Repo-wide grep for `<<<<<<<`/`>>>>>>>`
over `*.ts`/`*.astro`/`*.json`/`*.md` returns no markers (the single hit is
prose quoted inside `report-0768a263`'s body, not a marker).

`CHERRY_PICK_HEAD` left intact at `5b7f82be51319017b2388af6ad744539a9e99d39`.
No `--continue`/`--skip`/`--quit`/`--abort` was issued.
