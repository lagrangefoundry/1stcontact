---
uid: report-c8e901c8
id: REPORT-3032
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-22'
created_by: xgd
created_at: '2026-08-31T19:30:42.991314+00:00'
updated_at: '2026-08-31T19:30:42.991314+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-22
---

## Files resolved

- `package.json` — UU (config scalar, 2g / version-scalar precedent). Sole
  conflict: `"version"`, HEAD `0.2.14` vs incoming `0.2.1`. Both sides are
  `free_coded`, so the both-free-coded exception applies: take the later
  working-timeline position. HEAD's side (`97f4e4e5` fix(ai-host): resolve a
  session id against the store — 2026-08-24) is later than the incoming
  (`aa64b3e1` refactor(tests): convert the last Astro site off the container —
  2026-08-21), and this also matches the auto-enrichment rule ("take the more
  recent commit by timestamp"). Kept `0.2.14`. The incoming's `0.2.0 -> 0.2.1`
  bump is bookkeeping already superseded on the HEAD line; taking it would have
  regressed the package version.

No other conflict classes were present. The four `??` entries under
`.xgd/tickets/hot/` are untracked pre-existing files, not conflicts, and were
left alone.

## Incoming changes preserved

- `tests/reconciliation-site-storage-port.test.ts` — the incoming commit's only
  code change. It merged cleanly (never entered conflict state) and is fully
  present in the working tree:
  - `import { contactForm as ContactForm } from '.../contact-form/component'`
    (line 8) and `import type { BehaviorProps } from '.../modules/behavior'`
    (line 9) — the `astro/container` and `index.astro` imports are gone.
  - `it('test_UAT_AC1329_the_split_kept_the_filesystem_runtime_and_partitions_cleanly', ...)`
    (line 595) — renamed from `..._the_astro_runtime_...`, AC linkage untouched.
  - Direct call `ContactForm({...} as unknown as BehaviorProps)` (line 606)
    replacing the `AstroContainer.create()` / `renderToString` path.
  - Config assertions now `from 'vitest/config'` + `defineConfig({` plus the new
    `expect(node).not.toMatch(/from 'astro/)` floor (lines 616-618), with
    `expect(workers).not.toContain('astro')` retained (line 630).

  No UAT test function was deleted; the AC-1329 test is present under its new
  descriptive name, which is the incoming commit's own rename.

- `package.json` — the incoming version bump was deliberately not taken, per the
  both-`free_coded` timeline rule above. This is a bookkeeping scalar, not
  developer code; no functional incoming change was discarded.

## Net result

`git diff --cached HEAD` is empty: the incoming commit's code change had already
landed on this branch through the post-watermark sync, and the only remaining
delta (the version scalar) resolves toward HEAD. This is the redundant-commit
case (BUG-1109/BUG-1122), not a discard — STEP 3's distinguishing check passes:
the incoming commit's key changes are verifiably PRESENT in HEAD (grep hits
above), not absent. Staged and exiting @done; the finalize step will detect the
clean staged diff and skip the commit. `--skip` was not called here.
