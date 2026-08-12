---
uid: report-73f3821c
id: REPORT-1878
type: report
title: 'Code Review: request-a8ccd0dd'
created_by: xgd
created_at: '2026-08-12T19:01:43.490582+00:00'
updated_at: '2026-08-12T19:01:43.490582+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: code_review
  subject_uid: request-a8ccd0dd
  anchor_uid: request-a8ccd0dd
---

# Code Review

**Result**: FAIL

## Summary

REQ-135 phase A is well-structured, well-reasoned code — the derivation is closed
at every control, the proportional track write is correct and load-bearing, and
the commentary carries the measured evidence behind each decision. It fails on one
**critical regression**: a text run whose family declares faces but no *italic*
face renders `italic` as `locked`, and because the modal posts every staged field,
the origin refuses the entire save. On such a run **no edit can be saved at all** —
including the plain copy editing REQ-117 already shipped. `xgd/home`, the site
§9.2 names as the one where the lock is visible, is exactly this shape.

A second, lower-severity instance of the same class: a run declaring no
`fontWeight` has one fabricated from the lowest declared face and written into its
axes by a save that only touched the words.

## Quality Gates

| Gate | Status | Evidence |
|------|--------|----------|
| Tests (REQ-135 suites) | **PASS** | `test_UAT_FC_REQ-135_text_properties`, `reconciliation-copy-edit-typography`, `reconciliation-copy-edit-parameter-sheet` — 17/17 pass |
| Tests (full suite) | **FAIL — pre-existing, NOT this change** | 13 failed / 1510 passed / 4 skipped. Failures confined to `test_UAT_FC_REQ-122_chat_host` (5), `reconciliation-assistant-conversation` (6), `test_UAT_FC_REQ-127_session_binding` (2). **Verified pre-existing**: reverting REQ-135's five production files to `eba1c3385^` reproduces the identical 13 failures. |
| Lint | **NOT VERIFIED** | `npx eslint` aborts: "couldn't find an eslint.config.(js\|mjs\|cjs)". No flat config in the repo; the `javascript-vitest` suite declares `lint.tools: [eslint]`. |
| Build | **NOT VERIFIED** | `tsc -p .` fails: no root `tsconfig.json` (only `tsconfig.base.json`). |
| Coverage (≥25%) | Not separately measured | — |

### The quality gate is passing vacuously

`xgd quality run --tests tests/test_UAT_FC_REQ-135_text_properties.test.ts` reports
**Overall Status: SUCCESS** while the underlying vitest run printed
`13 failed | 1510 passed`. The gate's own INFO explains why:

> Suite 'javascript-vitest' ran with an empty scope: 1527 tests were collected and all were deselected by the -k filter. No tests to execute.

This is why every recent quality report reads `Scoped quality: pass (0 tests, 0 failed)`
(REPORT-1872, REPORT-1871, REPORT-1866, REPORT-1862). **No quality report in this
reconcile has actually executed a test.** The passing REQ-135 result above is from
running vitest directly, not from the gate. This is an XGD tooling defect, not a
defect in the reviewed code, but it means "tests pass" was never gate-evidenced.

## External Interface Accessibility

Wired in — no dead code found.

| Seam | Evidence |
|------|----------|
| `L1FieldValue` exported | `packages/site-schema/src/l1/index.ts:51` |
| `fonts` reaches the derivation | `tools/generate/src/cli/edit.ts:474-476` (`segmentOptions`) → `editCopyGet:502`, `editCopySet:541` |
| `documentFonts` consumed | `tools/generate/src/cli/edit.ts:479-482`, called from `segmentOptions` |
| Parameter sheet mounted | `apps/control-app/src/builder/editor.js:356-368`; destroyed at `:242`; staged at `:380`; dirty at `:386` |
| `.builder-modal__props` styled | `apps/control-app/src/builder/builder.css:282-306` |
| `locked` honoured by the widget | `@lagrangefoundry/webui-fields/src/schema.js:104`, `index.js:201` (`is-locked`) |

Verified live: my probe opened the real modal against a real `startBuilder` origin,
fetched fields over `/api/copy`, posted, and received a structured refusal — the
whole path is reachable.

## Code Quality

| File | Finding | Severity |
|------|---------|----------|
| `packages/site-schema/src/l1/edit.ts:759` | A `locked` field is refused on **presence**, not on **change**, while the client posts every staged field. Blocks all saves on locked-italic runs. | **Critical** |
| `packages/site-schema/src/l1/edit.ts:423,695` | `fontWeight` seeds from `weights[0]` when the run declares none, and the write branch has no absent-axis guard, so an unrelated save writes a weight the run never had. | **Major** |
| `packages/site-schema/src/l1/edit.ts:615-620` | `rangeError` gets this exact rule right ("the bound binds a change, never the status quo") — the other two paths did not inherit it. | Note |

No leftover debug code, no commented-out blocks, no TODO stubs, no magic numbers
outside the two named `TEXT_SIZE_*_PX` constants, no duplicated helper logic.
`writeTypography` correctly mutates the existing axes bag rather than replacing it,
and the absent-is-the-default rule for `italic`/`textTransform` is right.

## Checklist Compliance

No architecture, security, or design checklist reports exist
(`xgd ticket list --type report --filter fields.report_kind=<kind>` returns
`"items": []` for all three). Sections omitted per the review contract.

Noting anyway, against DOC-2: the structured-only invariant holds. Every added
control is a bounded integer, a closed enum, or a boolean; nothing on this surface
can express raw CSS or HTML, and `typeError` checks per-descriptor rather than
assuming string.

## Smoke Test

Entry points exercised:
- `1c copy get` / `1c copy set` — driven through the real `run()` entry point by the
  passing REQ-135 UATs, and by my own probe.
- The builder modal → `/api/copy` → draft write — driven end-to-end against a real
  `startBuilder` origin in jsdom with the real `defaultModal` and real webui
  components (`WEBUI_INSTALLED` true).

`node --experimental-strip-types` cannot load the CLI directly (extension-less
relative imports need Vite's resolver), so `--help` was not invoked standalone; the
vitest-hosted invocations above are strictly stronger evidence.

## Issues Found

**Critical (must fix)**:

- **A locked field blocks every save on the segment.** `applyCopyFields`
  (`edit.ts:756-763`) refuses any posted value for a field with `locked: true`,
  regardless of whether it differs from the current value. But `editor.js`
  `stagedValues()` (`:378-382`) spreads `properties.getValues()`, and
  `mountFields`' `getValues()` is `{...values, ...staged}` over every descriptor it
  was handed (`webui-fields/src/index.js:85,410`) — locked rows included. So the
  post always carries `italic`, and the origin always refuses it.

  Reproduced end-to-end through the real modal and real origin, on a run with a
  Satoshi family declaring weights 400/500/700/900 and no italic face:

  ```
  PROBE italic row locked: true
  PROBE modal still open: true
  PROBE error shown: true | text: Field 'italic' is not editable on this segment.
                                  — Read the segment's fields with '1c copy get acme home 0.0'
  PROBE draft text now: "Designed for developers who ship"   ← the edit was lost
  ```

  The user edited only the words. **This is a regression of REQ-117's shipped copy
  editing**, not merely an incomplete new feature: on any Satoshi run on `xgd/home`
  the builder can no longer change text, size, weight or capitalisation either,
  because the whole change map is rejected at the first field.

  The existing tests miss it structurally, and the fixtures say why:
  - `test_UAT_FC_REQ-135_text_properties.test.ts:311-315` posts `{ italic: true }`
    alone via the CLI — a *changed* locked value, correctly refused.
  - `reconciliation-copy-edit-parameter-sheet.test.ts:98-101` is the only suite that
    drives a full modal Save, and its fixture deliberately declares an italic face
    "so the italic control is genuinely editable rather than locked".

  Locked-and-unchanged is therefore never posted through a Save anywhere in the suite.

**Warnings (should fix)**:

- **A run declaring no `fontWeight` acquires one on an unrelated save.**
  `typographyFields` seeds `values.fontWeight = String(axes.fontWeight ?? weights[0])`
  (`edit.ts:423`) whenever two or more weights are offered, and the write branch
  (`edit.ts:695-699`) only compares against the existing axis — absent ≠ 400, so it
  writes. Probe on a run with `axes: { fontFamily: 'Inter, sans-serif', fontSizePx: 18 }`
  against faces 400/700/400-italic:

  ```
  PROBE2 derived values: {"fontSizePx":18,"fontWeight":"400","italic":false,"textTransform":"none"}
  PROBE2 result: {"ok":true,"changed":["text","fontWeight"]} | axes now: {"fontFamily":"Inter, sans-serif","fontSizePx":18,"fontWeight":400}
  ```

  A run inheriting a heavier weight from its panel is silently re-weighted by a
  text-only edit — precisely the failure the union rule in `weightChoices` was
  written to prevent, surviving in the undeclared-axis case. Note `sizeField`
  (`edit.ts:394-396`) withholds its control entirely in the analogous case, so the
  two axes are inconsistent with each other.

## Fix-It Prompt

Both defects are one root cause: **the modal posts every staged field, so the write
side must treat an unchanged value as a no-op on every path.** `rangeError`
(`edit.ts:604-620`) already states and implements this rule; extend it.

1. **`packages/site-schema/src/l1/edit.ts:756-763` — refuse a locked field only on
   change.** Replace the unconditional refusal with a comparison against what the
   derivation reported, which `applyCopyFields` already has in hand as
   `derived.values[name]` (it passes it to `rangeError` at `:766`):

   ```ts
   if (field.locked && value !== derived.values[name]) {
     return { ok: false, field: name, message: `Field '${name}' is not editable on this segment.` }
   }
   ```

   This keeps the security property intact — a locked field can still never be
   *changed* — while letting a save that merely echoes it through proceed. Update
   the doc comment above `applyCopyFields` (`:739-742`), which currently states the
   refusal is unconditional.

2. **`packages/site-schema/src/l1/edit.ts:695-699` — do not write a weight the run
   did not declare.** Guard the `fontWeight` branch so an absent axis is not
   populated by the seeded default. Prefer threading the derived current value into
   `writeTypography` and skipping when `axes.fontWeight === undefined && next` equals
   it, which preserves the capability of deliberately setting a weight; the
   alternative — mirroring `sizeField`'s withhold-when-undeclared guard — is more
   consistent but removes that capability. Whichever is chosen, make the choice
   explicit in the comment, as `sizeField` does.

3. **Add the missing composed evidence.** The gap is that no test drives a full
   modal Save on a locked-italic run. Add a UAT to
   `tests/test_UAT_FC_REQ-135_text_properties.test.ts`'s browser block (the harness
   at `:380-432` already does everything needed) that opens `A_HEADLINE` — whose
   fixture is already the four-weight, no-italic Satoshi shape — edits only the copy
   control, clicks Save, and asserts the draft text changed and no error is shown.
   Add a second asserting a run with no declared `fontWeight` still has none after a
   text-only save.

4. **Do not "fix" the 13 failing tests** in `test_UAT_FC_REQ-122_chat_host`,
   `reconciliation-assistant-conversation` and `test_UAT_FC_REQ-127_session_binding`.
   They are pre-existing and unrelated — confirmed by reverting REQ-135's production
   files and reproducing them identically. They are out of scope for this fix.
