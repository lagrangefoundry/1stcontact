---
uid: report-3ede8cdd
id: REPORT-2285
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-19'
created_by: xgd
created_at: '2026-08-20T00:54:29.968178+00:00'
updated_at: '2026-08-20T00:54:29.968178+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-19
---

Incoming commit: b179902c314cff1f8027d9fa28d1c495df9ddda8 —
`feat(store): an async SiteStore port, with the filesystem behind it [FREE-CODED]` (2026-08-15).

## Files resolved

- **`package.json`** — UU, config file (§2g scalar). Sole conflict is the version
  line: HEAD `0.1.58` vs incoming `0.1.50 → 0.1.51`. Kept HEAD's `0.1.58`. The
  version line is monotonic and the incoming bump is already superseded by seven
  later bumps on the bundle branch; taking `0.1.51` would move the project version
  backwards. The staged file is byte-identical to HEAD, which is the correct
  outcome for a superseded bump — not a discarded change.

- **`tests/reconciliation-beyond-l1-authoring.test.ts`** — UU, UAT test file
  (§2c + §2f). Four conflict hunks, all the same shape: HEAD (from
  `feat(palette): shade on the reference replaces named steps [FREE-CODED]`)
  added richer assertions to existing UATs, while incoming converted the whole
  file from a synchronous `Toolbox.run` to the async `SiteStore`-backed one.
  The two intents are orthogonal, so both were applied: HEAD's assertions kept
  in full, incoming's `await` conversion applied to every one of them. No test
  function or assertion from either side was dropped.
  - `test_UAT_AC1096…`: kept HEAD's follow-on "the refusal is a prompt rather
    than a dead end" block; awaited its `set_config`.
  - `test_UAT_AC1099…` (component subtree): kept HEAD's `MapSegment` interface
    and its stronger `expect(node).toEqual(readPage()…slots.form)` plus the
    whole `set_l1` rewrite section (incoming had only
    `expect(typeof node.kind).toBe('string')`, a strict subset); awaited
    `describe_page`, both `get_l1` reads and the `set_l1` write. HEAD's
    downstream `expect(html).toContain('How can we help?')` — which merged
    cleanly — depends on that section, so incoming's weaker version could not
    have stood alone.
  - `test_UAT_AC1107…` (asset replace): kept HEAD's module-level `REDRAWN`
    constant over incoming's newly-introduced local `redrawn`; the surrounding
    clean-merged assertion at the next line already reads `REDRAWN`. Awaited the
    `write_image` replace call.
  - `test_UAT_AC1109…` (CLI/surface parity): kept HEAD's fuller surface-side
    sequence (`configure_component`, add + remove of `spare`, the second
    `write_image` with `replace: true`) — the clean-merged assertions below it
    check exactly those effects (`modules.map(id) === ['signup']`, stored bytes
    `=== REDRAWN`) — and awaited all six calls.

## Incoming changes preserved

The incoming diff for this file is *entirely* the sync→async conversion:
`Box.run` → `Promise<string>`, `json` → `async`, `await` at every call site, and
`it('…AC1106…')` → `async`. Verified against `git show b179902c3 -- <file>`:

- `interface Box { run: … => Promise<string> }` — present (line 46).
- `const json = async <T,>(…): Promise<T> => JSON.parse(unwrap(await box.run(…)))`
  — present (lines 53–54).
- `it('test_UAT_AC1106…', async () => {` — present (line 802).
- Every `box.run(…)` and `json<…>(box, …)` call site is awaited: a grep for
  either symbol not preceded by `await` returns nothing.

Two of those conversions had been *lost* rather than conflicted — HEAD-added
regions that merged cleanly and so escaped the incoming file-wide rewrite
(`expect(box.run('set_config', {key:'config'…}))` and
`expect(box.run('add_component', {name:'reviews'…}))`). Both were left as
un-awaited Promises, on which `.not.toContain(…)` passes vacuously while the
write races the assertions after it. Both are now awaited, so incoming's intent
holds across the whole file and not only where git flagged it.

Typechecked the resolved file with `tsc --noEmit --strict`: no errors in it.
