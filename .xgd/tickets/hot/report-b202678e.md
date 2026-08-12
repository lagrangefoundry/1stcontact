---
uid: report-b202678e
id: REPORT-1925
type: report
title: 'Code Review: request-8a132869'
created_by: xgd
created_at: '2026-08-12T22:48:43.647489+00:00'
updated_at: '2026-08-12T22:48:43.647489+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: code_review
  subject_uid: request-8a132869
  anchor_uid: request-8a132869
---

# Code Review

**Result**: FAIL

## Summary

REQ-136 adds image framing, shape and colour adjustment as typed L1 axes — `objectPosition` on the image leaf, a `filter` group on the shared surface, and `parallelogram` / `blob` mask shapes — plus the capture-fold and editor controls to reach them. The design is sound and faithful to the structured-only invariant (DOC-2): no raw CSS reaches the document, every control is a bounded integer or a closed enum, the renderer remains the sole emitter, and no operation touches a file. Two confirmed correctness defects block the pass, both localised and both in code this ticket added.

The first is the serious one: the editor's `get` rounds held values while the `set` path compares against the unrounded originals, so saving a picture's alt text silently perturbs its pan, saturation and rotation. This was reproduced end-to-end through the real modal contract.

## Quality Gates

| Gate | Status | Evidence |
|------|--------|----------|
| Build | PASS | `pnpm -r build` exit 0; `tsc --noEmit` clean for `packages/site-schema`, `packages/framework`, `tools/generate` |
| Tests | PASS (with pre-existing failures) | `npx vitest run` → 1535 passed, 13 failed, 4 skipped (1552) |
| REQ-136 suites | PASS | 5 files / 23 tests all green |
| Lint | VACUOUS | see Warnings |
| Coverage | NOT MEASURED | see Warnings |

**The 13 failures are pre-existing and unrelated.** They fall in exactly three suites — `reconciliation-assistant-conversation` (6), `test_UAT_FC_REQ-122_chat_host` (5), `test_UAT_FC_REQ-127_session_binding` (2). Verified independently of the ticket's claim: those suites import only `tools/generate/src/cli/{ai/host,ai/toolbox,builder,commands}`, and `git diff main..HEAD -- tools/generate/src/cli/` is **empty** — this branch modifies none of them. The failure messages are assistant-turn failures (`expected [ 'user' ] to deeply equal [ 'user', 'assistant' ]`, `expected 'The old headline.' to be 'A new headline.'`), consistent with the AI host not running in this environment.

## External Interface Accessibility

Wired in at every layer — no dead code found.

| Seam | Evidence |
|------|----------|
| Schema | `l1FilterSchema` / `l1ObjectPositionSchema` defined and *referenced*: `filter` in `surfaceAxesShape` (schema.ts:725), `objectPosition` in `l1ImageAxesSchema` (schema.ts:1026) |
| Exports | reachable via `export * from './schema'` / `'./types'` (l1/index.ts:5-6) |
| Validator | `checkSurface` bounds the filter stack (validate.ts:427-450), and is called for both node axes (validate.ts:297) **and** interaction states (validate.ts:475) — the REQ-99 hole is genuinely closed |
| Renderer | `filterDecls` reached from `surfaceDecls` (render.ts:620); `object-position` emitted in the `image` branch (render.ts:2094); `parallelogram` / `blob` in `maskDecls` (render.ts:523-526) |
| Capture fold | `foldObjectPosition` / `foldFilter` called from `imageAxes` (fold.ts:1056-1059) and `boxAxes` (fold.ts:967) |
| Editor | `imageFramingFields` spliced into `copyFieldsOf` (edit.ts:718,730); `IMAGE_FRAMING_FIELDS` routed in `applyCopyFields` (edit.ts:1152) |

## Smoke Test

`1c copy get|set` — the real argv entry point — is driven by `tests/test_UAT_FC_REQ-136_image_framing.test.ts` via `run([...argv, '--json'])` (line 110) against a real scaffolded site. No stack traces; 9 ACs green. The browser save path was additionally read end-to-end at `apps/control-app/src/builder/editor.js:367-412`, which is where defect 1 below was confirmed.

## Checklist Compliance

No `architecture_checklist`, `security_checklist` or `design_checklist` report exists in the ticket store (`xgd ticket list --type report --filter fields.report_kind=<kind>` returns 0 for all three). Sections omitted per the review contract.

## Issues Found

### Critical (must fix)

---

**C1 — A no-op save silently mutates the document: the derivation rounds, the write path does not.**

`packages/site-schema/src/l1/edit.ts:562-572` reports every held framing value through `Math.round(...)`. `writeImageFraming` (edit.ts:1010) then compares the incoming value against the node's **unrounded** value. Any fractional held axis therefore fails the equality test on a plain echo and is overwritten with the rounded value.

This is reachable through the primary pipeline REQ-136 itself adds: `foldObjectPosition` writes 2dp fractions (fold.ts:753-754) and `foldFilter` writes 4dp fractions (fold.ts:812), so every captured page is a source of such values.

It fires on a real gesture. `apps/control-app/src/builder/editor.js:367-380` builds `stagedValues()` from `getValues()` across both `mountFields` instances, seeded from the derived values, and `save` posts **the whole map** as soon as `isDirty()` is true for any one control (editor.js:392-412). `applyCopyFields`' own doc-comment states this: *"the modal posts every staged field rather than only the touched ones"* (edit.ts:1112-1113). Editing only the alt text posts all 15 image fields.

Reproduced against the real `copyFieldsOf` / `applyCopyFields` pair:

```
BEFORE  axes.objectPosition {"xPct":33.33,"yPct":50}
        axes.filter         {"saturate":1.405}
        transform           {"rotateDeg":12.5}

derived values -> objectPositionXPct: 33, saturatePct: 141, rotateDeg: 13
post {...derivedValues, alt: 'b'}

CHANGED ["alt","objectPositionXPct","rotateDeg","saturatePct"]
AFTER   axes.objectPosition {"xPct":33,"yPct":50}
        axes.filter         {"saturate":1.41}
        transform           {"rotateDeg":13}
```

Three axes the operator never touched moved, and `changed` reports them — so a save that edited alt text produces a four-field diff and a history entry the user did not ask for. This contradicts the ticket's own stated design rule ("a control returned to its identity leaves the definition exactly as it found it rather than recording a no-op") and the spirit of AC-6 ("a framing edit disturbs no other axis").

It also breaks the REQ-135 precedent the module otherwise follows carefully. Typography reports its held value verbatim — `values.fontSizePx = axes.fontSizePx` (edit.ts:391), no rounding — and its write path is *handed* the derived current value: `writeTypography(node, name, value, derived.values[name])` (edit.ts:1148). `writeImageFraming(node, name, value)` (edit.ts:1152) is not. That missing fourth argument is the structural difference that causes this.

**Remediation** — pick one, at `packages/site-schema/src/l1/edit.ts`:

- *Preferred:* pass the derived value through, matching `writeTypography`. Change the call at edit.ts:1152 to `writeImageFraming(node, name, value, derived.values[name])` and, in `applyFraming` (edit.ts:1024-1088), compare `value` against that reported current rather than against the raw axis. An echo then compares equal by construction, whatever rounding the derivation applied.
- *Alternative:* drop `Math.round` from the derivation (edit.ts:562-572 and the `FILTER_CONTROLS` loop at edit.ts:575-578) and report held values verbatim, as `fontSizePx` does. Note this surfaces fractional values in integer-typed controls, so the first option is the safer fit.

**Regression test to add** to `tests/test_UAT_FC_REQ-136_image_framing.test.ts`: seed an image whose `objectPosition`, `filter.saturate` and `transform.rotateDeg` carry fractional values (as the fold produces them), `copy get`, then `copy set` the returned values map with only `alt` altered. Assert `changed` is exactly `['alt']` and that the three framing axes are byte-identical afterwards. AC-6 currently asserts non-disturbance only from an integral starting state, which is why it passes today.

---

**C2 — `foldFilter` clamps only the upper bound, so a captured negative hue folds to a document its own validator rejects.**

`tools/generate/src/l1/fold.ts:826` applies `n = Math.min(n, fn.max)`. There is no corresponding lower clamp. The non-negative guard on the line above (fold.ts:824) is skipped for `deg` units — correctly, since a negative hue rotation is meaningful — which leaves `hueRotateDeg` with a bounded ceiling and an unbounded floor.

Confirmed by execution against the real `foldFilter`:

```
foldFilter('hue-rotate(5000deg)')   -> {"hueRotateDeg":3600}   // clamped
foldFilter('hue-rotate(-5000deg)')  -> {"hueRotateDeg":-5000}  // NOT clamped
```

`-5000` is outside `L1_ENVELOPE.rotateDeg` (`{min: -3600, max: 3600}`, validate.ts:41), which `checkSurface` enforces at validate.ts:441-447. Capturing a page with `filter: hue-rotate(-5000deg)` therefore produces an L1 document that `validateL1` refuses — the fold emitting output its own envelope rejects. It also contradicts the intent stated three lines above the bug: *"Clamped into the envelope rather than dropped"* (fold.ts:822-824).

Low reachability in practice — it needs an authored rotation past ten full turns — but the fix is one line and the failure mode is a hard validation stop on capture.

**Remediation**: give `FILTER_FUNCTIONS` (fold.ts:775-784) a `min` alongside `max` (`0` for the ratio/px functions, `L1_ENVELOPE.rotateDeg.min` for `hue-rotate`) and clamp both ends at fold.ts:826: `n = Math.min(Math.max(n, fn.min), fn.max)`. The existing `if (fn.unit !== 'deg' && n < 0) continue` guard at fold.ts:824 can then go, since the floor subsumes it — or stay, if "negative is not a treatment" is meant to remain a drop rather than a clamp for those functions.

**Regression test to add** to `tests/reconciliation-l1-fold-framing-and-adjustment.test.ts`: assert `foldFilter('hue-rotate(-5000deg)')` yields `-3600`, and that `validateL1` accepts a document built from it. The existing fold coverage exercises the positive ceiling only.

### Warnings (should fix — not blocking)

**W1 — The lint gate is vacuous, project-wide.** `.xgd/quality.yaml` declares `lint.tools: [eslint]`, but no eslint binary is installed (`node_modules/.bin/eslint` absent) and no `eslint.config.*` / `.eslintrc*` exists anywhere in the repo. Every quality report accordingly records `lint: {status: success, errors: 0, warnings: 0, duration_seconds: 0.0001}` — a success that means nothing ran. Pre-existing and not introduced by REQ-136, so it does not gate this review, but "lint clean" is currently unevidenced for the whole project.

**W2 — No coverage measured on this reconcile.** The most recent quality reports are all `Scoped quality: pass (0 tests, 0 failed)` with `suites: {}` (report-75a96b44, and the six before it). The last report that actually executed tests was report-5093d2f1 at 19:21 (72 tests), before the final fix cycles. The scoped selection is resolving empty; the real evidence in this review is the direct `vitest run` recorded above.

**W3 — Blob determinism rests on `Math.sin`, which ECMAScript does not specify bit-exactly.** `blobPoints` (render.ts:459-462) uses the standard GLSL `sin * 43758.5453` hash. Determinism holds within one engine, which is what the round-trip gate needs and what the AC-4 seed test proves. Across engine or V8 versions the outline could drift slightly. Not a defect today — both the page render and the edit render channel run through the same runtime — but worth a comment noting the assumption, since DOC-23 §7 round-trip identity is the stated justification for the seed.

**W4 — Non-null assertion on an implicit fall-through.** `applyFraming` ends with `FILTER_CONTROLS.find((c) => c.name === name)!` (edit.ts:1078). It is safe — `IMAGE_FRAMING_FIELDS` gates entry and is built from the same list — but the coupling is implicit and a future field added to the set without a matching control would throw rather than fail cleanly. Consider an explicit guard.

**W5 — `clearKey`'s doc-comment describes behaviour it does not implement.** The comment at edit.ts:940-949 explains empty-container pruning at length, but `clearKey` (edit.ts:950-953) only deletes a key; the pruning lives in `setNested` (edit.ts:956-970). Move the rationale to `setNested`.

## Code Quality

| File | Finding | Severity |
|------|---------|----------|
| `packages/site-schema/src/l1/edit.ts:562-578,1152` | Rounded derivation vs unrounded write comparison → silent mutation on echo (C1) | Critical |
| `tools/generate/src/l1/fold.ts:826` | One-sided clamp; negative `hueRotateDeg` escapes the envelope (C2) | Critical |
| `packages/framework/src/l1/render.ts:459-462` | Cross-engine determinism assumption undocumented (W3) | Minor |
| `packages/site-schema/src/l1/edit.ts:1078` | Non-null assertion on implicit fall-through (W4) | Minor |
| `packages/site-schema/src/l1/edit.ts:940-953` | Doc-comment on the wrong function (W5) | Trivial |

Otherwise clean. No leftover debug code, no commented-out blocks, no TODO stubs, no duplicated logic, no version-suffixed files. The new code reuses the established seams throughout rather than inventing parallel ones — `setNested` mirrors the existing prune discipline, `shapeChoices` follows the same union rule as `imageChoices` and `weightChoices`, and the percentage-projection pattern is REQ-135's. The renderer's fixed filter emission order (render.ts:494-508) is a genuinely good catch: taking order from object key order would let identical axes paint two ways.

**Supersession of the five `['src','alt']` suites is legitimate.** Each assertion was restated as its actual subject rather than deleted — ordering and `not.toContain('backgroundImageUrl')` in `reconciliation-copy-edit-background-selection.test.ts:334-336`, empty-versus-non-empty in the same file at 413-418, `.slice(0, 2)` plus `toMatchObject` in `reconciliation-copy-edit-write-path.test.ts:292-297`, and "more than one field, none opened" in `reconciliation-copy-edit-form-presentation.test.ts:1305-1317`. Each carries a comment naming why the old form was incidental. No AC was weakened to accommodate the change.

**Evidence validity: sound.** The REQ-136 UATs drive the real `1c` argv entry point, the real renderer and the real validator against a real scaffolded site in a temp dir. No internal mocking. The fixture is deliberately the awkward cases (an image with no axes, one carrying a feathered mask the control does not offer, one at the `rounded-full` sentinel), which is why the "refused on change, never on presence" rule (`rangeError`, edit.ts:804) is properly exercised. The one gap is the fractional starting state C1 needs.

## Fix-It Prompt

Two defects, both localised. Do not refactor beyond them.

1. **`packages/site-schema/src/l1/edit.ts`** — make the framing write path compare against what the derivation reported, not against the raw axis. Pass `derived.values[name]` as a fourth argument from edit.ts:1152 into `writeImageFraming` / `applyFraming`, matching `writeTypography` at edit.ts:1148, and use it as the `current` in every branch of `applyFraming` (edit.ts:1024-1088). Verify by seeding an image with `objectPosition: {xPct: 33.33, yPct: 50}`, `filter: {saturate: 1.405}` and `transform: {rotateDeg: 12.5}`, running `copy get`, then `copy set` with the returned values and only `alt` changed: `changed` must be exactly `['alt']` and the three axes byte-identical.

2. **`tools/generate/src/l1/fold.ts`** — add a `min` to each `FILTER_FUNCTIONS` entry (fold.ts:775-784) and clamp both ends at fold.ts:826. `foldFilter('hue-rotate(-5000deg)')` must yield `{hueRotateDeg: -3600}`, and the resulting document must pass `validateL1`.

Add the two regression tests described under C1 and C2. Leave the warnings (W1-W5) alone unless they are trivial to fold in; none of them gate this review.
