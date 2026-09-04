---
uid: report-4cc49890
id: REPORT-3299
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-02T18:09:38.876762+00:00'
updated_at: '2026-09-02T18:09:38.876762+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `package.json` — class **UU**, config/bookkeeping scalar (§2g scalar + the
  enrichment's "both sides free_coded" exception). Kept HEAD's `"version":
  "0.2.20"`; dropped incoming's `"0.2.1"`.

  Rationale: both sides are `free_coded`, so the working-timeline rule applies
  rather than the blanket "incoming wins". HEAD's side is `510d4082382c` /
  `[FREE-CODED] REQ-162 — version 0.2.20`, dated 2026-08-31 14:41:02 -0700.
  Incoming is `aa64b3e15b44` / REQ-150, dated 2026-08-21 13:12:12 -0700 — ten
  days earlier, and its entire package.json diff is the single bookkeeping line
  `0.2.0 -> 0.2.1` (verified via `git show aa64b3e15b -- package.json`: one
  hunk, one line). Taking incoming would regress the package version by
  nineteen patch releases while carrying no code intent. This is the
  later-timeline side per the free_coded/free_coded exception and the more
  recent commit by timestamp per the enrichment rule — the two agree.

No other paths were conflicted. `tests/reconciliation-site-storage-port.test.ts`
— the incoming commit's actual payload — merged clean.

## Incoming changes preserved

- `tests/reconciliation-site-storage-port.test.ts`: **fully present, verbatim.**
  `git diff aa64b3e15b44b425aa1394edd18d0915fdba0324 --
  tests/reconciliation-site-storage-port.test.ts` returns empty output — the
  worktree file is byte-identical to the incoming commit's version. The Astro
  container -> direct-call conversion, the `astro/config` + `getViteConfig({`
  -> `vitest/config` + `defineConfig({` config-assertion rewrite, the
  `/from 'astro/` specifier assertion, and all 8 restored tests are intact.

- `package.json`: the only incoming change was the version bump, deliberately
  superseded as described above. No code intent was discarded — the incoming
  commit's code lives entirely in the test file, which is preserved verbatim.

Checked for the "clean merge escapes a conversion" failure mode: `git grep
astro/container -- tests/` returns only deliberate absence-assertions and
explanatory comments (`tests/support/astro-absent.ts:23,29`,
`test_UAT_FC_REQ-145_build_artifacts.test.ts:77`,
`test_UAT_FC_REQ-148_astro_free_render.test.ts:51`) — no live `from
'astro/container'` import survives anywhere in the suite. No call site on
main's side escaped the conversion.

No UAT test function was deleted on either side. The BUG-1301 precedence
exception was not invoked — no hunk was dropped on refactor-already-integrated
grounds.

## Note for the finalize step

The staged tree nets to **no diff vs HEAD** (`git diff --cached --stat HEAD` is
empty). This is the redundant-commit case (BUG-1109/BUG-1122), not a discard,
and STEP 3's check is what distinguishes them: the incoming commit's key
changes are *present* in HEAD via a different route (the converted test file
already matches `aa64b3e15b` exactly), rather than merely absent. Per STEP 4 I
did not call `git cherry-pick --skip`; CHERRY_PICK_HEAD is left intact for
`cherry_pick_finalize_resolution` to detect the clean staged diff and skip the
commit.
