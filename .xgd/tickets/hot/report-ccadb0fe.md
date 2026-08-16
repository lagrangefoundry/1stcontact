---
uid: report-ccadb0fe
id: REPORT-2112
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-18'
created_by: xgd
created_at: '2026-08-16T21:21:46.782574+00:00'
updated_at: '2026-08-16T21:21:46.782574+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-18
---

## Files resolved

- `package.json` — class **UU**, single conflict hunk (the `version` scalar; nothing
  else in the file conflicted). **Rule applied**: the enrichment rule for this file
  ("intent unknown on one or both sides — take the more recent commit by timestamp,
  flag for post-merge review"). HEAD side is the more recent of the two:
  - HEAD side `3ddd5a25` — 2026-08-15 18:58:33 -0700 — `"version": "0.1.52"`
  - Incoming `caeb60b40` — 2026-08-13 09:35:38 -0700 — `"version": "0.1.40"`

  Resolved to **`0.1.52`** (HEAD).

  Corroborating evidence: main's version lineage runs `0.1.39 → 0.1.44 → 0.1.45 →
  0.1.47 → 0.1.50 → 0.1.52`. `0.1.40` was this commit's free-coded bump taken from
  `0.1.39` on `xgd-working`; main has since advanced well past it. Taking incoming
  would have regressed main's version and re-claimed a slot that later bumps already
  passed through, breaking version monotonicity.

  Note on the "incoming (free_coded) is authoritative" hard rule: that rule protects
  developer *code*. The only incoming change to `package.json` is the version
  bookkeeping scalar, which is not part of the fix's intent — and the version bump
  obligation for this change is already satisfied on main by the later bumps. No
  developer code was involved in this hunk.

## Incoming changes preserved

All three code/test files carrying the actual fix were auto-merged cleanly and were
**not** touched by this resolution. Verified byte-identical to the incoming commit —
`git diff caeb60b40 -- <the three paths>` returns empty:

- `apps/control-app/src/builder/builder.css` (M, staged) — identical to incoming.
  Confirmed present: `--fields-fg: var(--preview-color, var(--shell-fg))`,
  `background-image: var(--preview-text-image, none)`, and the
  `-webkit-background-clip` / `background-clip: var(--preview-text-clip, border-box)`
  pair with initial-value fallbacks.
- `apps/control-app/src/builder/page-style.js` (M, staged) — identical to incoming.
  Confirmed present: the glyph-paint carry-across in `readTypography`
  (`background-clip` / `-webkit-background-clip` reads), the withheld-foreground
  backstop so `--fields-fg` falls back to the chrome's own colour, and the
  `'background-image': cs.backgroundImage` emission onto the control.
- `tests/test_UAT_FC_BUG-34_glyph_fill_preview.test.ts` (A, staged) — identical to
  incoming; the full 220-line UAT is present. No test function from either side was
  removed.

No conflict markers remain in any file. `CHERRY_PICK_HEAD` was left in place;
no `--continue`/`--skip`/`--quit`/`--abort`/`reset`/`checkout <branch>` was run.

Staged `package.json` nets to no diff vs HEAD (its resolved value *is* HEAD's value).
Per STEP 4 this is expected and is not a failure — and it is distinct from a discarded
resolution: STEP 3's check passed positively, since the incoming commit's key changes
live in the other three files and are all present.

## Post-merge review flag

Per the enrichment rule, `package.json` is flagged for post-merge review — the version
scalar was decided by timestamp, not by declared intent. Expected disposition: none
needed; main's `0.1.52` already supersedes the incoming `0.1.40`.

## Not run

No test suite was executed. The resolution changed only a version scalar and left every
code file byte-identical to the developer's commit, so no behaviour could be affected;
`--all-tests` is prohibited here and a targeted spot-check would exercise nothing this
resolution touched.
