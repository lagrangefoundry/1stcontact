---
uid: report-897a969d
id: REPORT-4174
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-13T23:35:32.220137+00:00'
updated_at: '2026-09-13T23:35:32.220137+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `tests/req93-l1-slot-mounted-behaviors.test.ts` — **UU**, rule 2c (UU on
  code/test file), case 2: non-overlapping changes combined. The only
  conflict hunk was the import block: HEAD added two conformance fixture
  imports (`./fixtures/conformance/mobile-overflow`,
  `./fixtures/conformance/throws-on-render`), incoming added
  `fsReferenceBundle` from `../tools/generate/src/store/fs-reference-store`.
  Kept all three imports. Every other incoming hunk (the async
  reference-store migration) auto-merged cleanly.

- `tests/reconciliation-colour-census-and-retrofit.test.ts` — **DU**, rule 2a
  first branch (HEAD-side deletion is a legitimate refactor, incoming
  modification now obsolete), under the BUG-1301 PRECEDENCE note. `git rm`.

## Incoming changes preserved

### tests/req93-l1-slot-mounted-behaviors.test.ts — fully preserved

Verified against `git diff 694e0cff8d 835230e1bd -- <file>` (merge commit,
diff taken vs first parent). Every incoming hunk is present in the resolved
file:

- line 62: `import { fsReferenceBundle } from '.../store/fs-reference-store'`
- lines 583-586: `await writeL1(fsReferenceBundle(ref), doc)`,
  `await writeForms(fsReferenceBundle(ref), forms)`,
  `const result = await cmdRepro('gigabyte', { cwd, ref })`
- line 607: `test_UAT_FC_REQ-93_part_stale_bundle_fails_rather_than_stranding_the_behaviour`
  is now `async () =>`
- lines 614-621: `await writeL1(fsReferenceBundle(ref), doc)`, the three
  `await expect(cmdRepro(...)).rejects.toThrow(...)` conversions, and
  `await writeForms(fsReferenceBundle(ref), [{ slot: 'ghost', ... }])`

No test function was removed; HEAD's fixture imports are also intact.

Spot-check (`npx vitest run tests/req93-l1-slot-mounted-behaviors.test.ts`):
10 passed, 1 skipped, 2 failed. Both failures are
`Error: listen EPERM: operation not permitted 0.0.0.0` raised from
`tools/generate/src/cli/serve.ts:42` via `serveOneModulePage` — the sandbox
forbids binding a listening socket. They are the AC-1624 conformance tests,
untouched by this conflict. The two tests carrying the incoming migration
(`...part_stale_bundle_fails...` and the forms/repro test) both passed, which
also confirms the merged import block resolves.

### tests/reconciliation-colour-census-and-retrofit.test.ts — hunk dropped under BUG-1301 precedence

The incoming commit's only changes to this file were the same mechanical
async/reference-store migration: add the `fsReferenceBundle` import, make
`capturedBundle` async, and `await` it plus `cmdRepro` in the AC-944 and
AC-947 tests.

HEAD-side commit that already removed the target:
**b8399b2fcf** _"fix(uat): retire the superseded colour-retrofit UATs and
stale wording"_ (2026-09-10), which deleted the file in full (798 lines).

Why that removal is a legitimate, documented refactor and not a resolution
shortcut:

- It is a deliberate, human-authored UAT-hygiene commit responding to
  `report-dde93f42` (uat level, capability-b4ac88fc), which found three
  consistency/exclusivity violations with one root cause: the AC-level
  repair in 1a027575a4 moved claims between AC-932, AC-941 and AC-944 and
  updated only one of the three test files asserting them.
- The commit message states the reason for this specific file: it is the
  pre-REQ-137 original, claiming AC-939…AC-947 a *second* time with four
  byte-identical test function names, so an AC→test index could not
  attribute them; and its AC-944 test asserted the pixel-identity guarantee
  REQ-137 superseded, so a passing run read as evidence for a retired
  guarantee.
- It names the replacement as a strict superset:
  `tests/reconciliation-colour-retrofit-shade-model.test.ts`. Confirmed by
  comparing UAT function names — the deleted file carried AC-939…AC-947; the
  surviving file carries AC-939…AC-947 plus AC-932, AC-1146 and AC-1147. The
  only claim not carried forward is the retired AC-944 pixel-identity
  assertion, which is exactly what REQ-137 superseded.
- It predates this cherry-pick and is already integrated into HEAD; it was
  verified in its own right (16 passed on overlay + shade-model, 25 passed /
  1 skipped elsewhere).

The incoming commit's *intent* for this area is not lost — it landed on the
surviving superset file, which auto-merged cleanly:
`tests/reconciliation-colour-retrofit-shade-model.test.ts` line 76 has the
`fsReferenceBundle` import, line 283 has
`await writeL1(fsReferenceBundle(dir), synthDoc(colors) as never)`, and
line 946 has `await cmdRepro('reproduced', { cwd, ref })`.

No UAT function that exists anywhere in HEAD was deleted by this resolution.
