---
uid: report-ffccb13f
id: REPORT-1931
type: report
title: 'Code Review: request-8a132869'
created_by: xgd
created_at: '2026-08-12T23:06:48.060625+00:00'
updated_at: '2026-08-12T23:06:48.060625+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: code_review
  subject_uid: request-8a132869
  anchor_uid: request-8a132869
---

# Code Review

**Result**: PASS

Re-review after the `fix_review_free_coded` cycle addressing `report-b202678e` (FAIL, 2 criticals).

## Summary

Both criticals from the prior review are fixed in `ea1936b83` and I verified each one myself rather than taking the fix report's word for it — C1 end-to-end through the real `1c copy get|set` CLI against a live scaffolded site, C2 through the AC-1134 fold suite. I also re-audited the single-gate rewrite the fix introduced (it deleted six per-branch equality checks) for new defects and found none, and checked the other seven `FILTER_FUNCTIONS` entries for the same one-sided-clamp class of bug C2 was. The implementation remains faithful to the structured-only invariant (DOC-2): no raw CSS reaches the document, every control is a bounded integer or a closed enum, the renderer stays the sole emitter, and no operation touches a file.

## Quality Gates

| Gate | Status | Evidence |
|------|--------|----------|
| Build / typecheck | PASS | `tsc --noEmit` exit 0 for `packages/site-schema`, `packages/framework`, `tools/generate` |
| Tests (full suite) | PASS (13 pre-existing failures) | `npx vitest run` → **1535 passed / 13 failed / 4 skipped** (1552), 213/216 files |
| REQ-136 + superseded suites | PASS | 10 files / **69 tests** green |
| Lint | VACUOUS | see W1 — pre-existing, project-wide |
| Coverage | NOT MEASURED | see W2 — pre-existing |

**The 13 failures are unrelated to this branch.** They fall in exactly three suites — `reconciliation-assistant-conversation`, `test_UAT_FC_REQ-122_chat_host`, `test_UAT_FC_REQ-127_session_binding`. Basis, in order of strength:

1. This branch changes **seven** non-ticket files: `package.json` and six L1 sources (`packages/framework/src/l1/render.ts`, `packages/site-schema/src/l1/{edit,schema,types,validate}.ts`, `tools/generate/src/l1/fold.ts`). It touches no CLI, AI-host, or app code — `git diff main..HEAD --name-only -- tools/generate/src/cli/ apps/` is empty.
2. The failure signature is the assistant never producing a turn: `expected [ { role: 'user' } ] to have a length of 2`, `expected 'The old headline.' to be 'A new headline.'`. A typed `filter` / `objectPosition` / `mask` axis cannot cause an absent assistant reply.
3. The count is byte-identical to the pre-fix baseline the prior review measured at the branch point (1535/13/4).

**Stated honestly:** I could not produce a *fresh* `main` baseline in this environment to close the loop by execution. Both attempts (a temp worktree with a symlinked `node_modules`, and the existing `main` worktree at `15d34878c`) died on module resolution before running a test — the symlink resolved imports back into this worktree, and the `main` worktree's installed tree is stale (`tools/generate/src/store/index.ts` fails to import `./paths`). That is an environment gap, not a signal about main. The three points above are what the conclusion rests on.

## Verification of the Two Criticals

### C1 — no-op save silently mutates the document → **FIXED, verified end-to-end**

The fix takes the review's preferred remediation: `writeImageFraming` gained a fourth `reported` argument (edit.ts:1008), the call site passes `derived.values[name]` (edit.ts:1178) exactly as `writeTypography` does one line above, and `applyFraming` gates on `if (value === reported) return false` (edit.ts:1036) as the single change comparison.

I reproduced the review's exact scenario through the **real CLI**, not the in-process harness — scaffolded a sandbox site, seeded an image with the precision a capture actually produces, and drove `1c copy get` / `1c copy set`:

```
BEFORE  axes {"objectPosition":{"xPct":33.33,"yPct":50},"filter":{"saturate":1.405}}
        transform {"rotateDeg":12.5}
get  -> objectPositionXPct: 33, saturatePct: 141, rotateDeg: 13
set  -> {...all 15 staged fields, alt changed}

changed  ["alt"]                                    <- was ["alt","objectPositionXPct","rotateDeg","saturatePct"]
AFTER   axes {"objectPosition":{"xPct":33.33,"yPct":50},"filter":{"saturate":1.405}}
        transform {"rotateDeg":12.5}                 <- byte-identical
```

And the control still **binds** a change — posting `saturatePct: 140` and `shape: 'blob'` returned `changed: ["shape","saturatePct"]`, wrote `filter.saturate: 1.4` and `mask: {shape: 'blob'}`, and left `objectPosition` and `transform` untouched. Out-of-range is still refused, not clamped: `saturatePct: 9999` → `SCHEMA_INVALID`, `Saturation (%) must be at most 400 (got 9999)`.

**I audited the single-gate rewrite for new defects and found none.** Deleting the six per-branch checks could in principle produce a false `changed` (write when nothing differs) or a missed change. Neither is reachable: `typeError` forces every framing control to an integer before the write loop, and `reported` is `Math.round(held)`, so `value !== reported` implies the written value genuinely differs from the held axis. The absent-axis case is still handled, because the derivation reports each function's identity for a missing axis and the gate catches the echo. The one deliberate consequence — an operator cannot write exactly `33` onto a held `33.33` — is the same tradeoff `writeTypography` already makes, and preserving stored precision is the better side of it.

The `objectPosition` branch's carry-over of the *untouched* component from the **held** axis rather than from what was reported for it (edit.ts:1054-1060) is correct and asserted: moving the X slider leaves Y's stored precision alone.

### C2 — one-sided clamp lets a captured negative hue escape the envelope → **FIXED**

Every `FILTER_FUNCTIONS` entry gained a `min` (fold.ts:773-787), `hue-rotate` now takes **both** bounds from `L1_ENVELOPE.rotateDeg` instead of a hardcoded `3600` ceiling, and fold.ts:821 clamps both ends. AC-1134 asserts `hue-rotate(-5000deg)` → `-3600` and that the resulting document passes `validateL1`; the suite is green.

**I checked the other seven functions for the same bug class**, since C2 was really "a fold bound that disagrees with the validator":

| Function | Fold clamp | Validator bound | Agrees? |
|---|---|---|---|
| `grayscale` / `sepia` / `invert` | 0..1 | schema `min(0).max(1)` | yes |
| `saturate` / `brightness` / `contrast` | 0..`filterAmount.max` (4) | `checkSurface` `filterAmount` 0..4 | yes |
| `hueRotateDeg` | `rotateDeg.min`..`.max` | `rotateDeg` ±3600 | yes (fixed) |
| `blurPx` | 0..10_000 | `checkEffectLen` → `effectPx` ±10_000 | yes |

No remaining case where the fold can emit what its own envelope rejects.

**W4 was folded in** while that line was being rewritten: `FILTER_CONTROLS.find(...)!` is now a clean `if (!control) return false` (edit.ts:1103-1104).

## External Interface Accessibility

Wired in at every layer, re-verified at current line numbers after the fix moved them. No dead code.

| Seam | Evidence |
|------|----------|
| Schema | `filter` in `surfaceAxesShape` (schema.ts:725); `objectPosition` in `l1ImageAxesSchema` (schema.ts:1026) |
| Types | `L1Filter` / `L1ObjectPosition` exported (types.ts:105-107) |
| Validator | `checkSurface` bounds the stack (validate.ts:432-451), called for node axes **and** interaction states — the REQ-99 hole stays closed |
| Renderer | `filterDecls` reached from `surfaceDecls` (render.ts:623); `object-position` in the image branch (render.ts:2095); `maskDecls` at render.ts:2180 |
| Capture fold | `foldFilter` at fold.ts:978 (`boxAxes`) and fold.ts:1069; `foldObjectPosition` at fold.ts:1067 |
| Editor | `imageFramingFields` spliced into `copyFieldsOf` (edit.ts:718); `IMAGE_FRAMING_FIELDS` routed in `applyCopyFields` (edit.ts:1177), and derived from `FILTER_CONTROLS` so the set and the table cannot drift |
| Version | `package.json` 0.1.37 → 0.1.38, matching `fields.version` on the anchor |

## Smoke Test

Entry points exercised live, outside the test harness, against a throwaway sandbox site (removed afterwards; tree left clean):

| Invocation | Result |
|---|---|
| `1c --help` | usage printed, exit 0 |
| `1c new <slug> --sandbox` | site created |
| `1c copy get <slug> home 0.1 --json` | 15 fields — `src`, `alt` **first, in that order**, then the 13 framing controls; a bare picture reads back browser defaults, not blanks |
| `1c copy set ... --values <json>` | the three cases above (echo / real change / refusal) |
| `1c render <slug> --sandbox` | emitted `filter: saturate(1.4)`, `object-position: 33.33% 50%`, and a 24-vertex `clip-path: polygon(...)` for the blob |

No stack traces, no crashes. The rendered CSS confirms the axes reach paint.

## Code Quality

| File | Finding | Severity |
|------|---------|----------|
| `packages/framework/src/l1/render.ts:459-462` | Blob determinism rests on `Math.sin`, unspecified bit-exactly by ECMAScript (W3, carried) | Minor |
| `packages/site-schema/src/l1/edit.ts:940-953` | `clearKey`'s doc-comment describes pruning that lives in `setNested` (W5, carried) | Trivial |
| `packages/site-schema/src/l1/edit.ts:576-612` | The `shape` control writes a bare `{shape:'blob'}`; `roughness`/`seed` are not offered, so every operator-picked blob is seed 0 / roughness 0.5 (N1, new, minor) | Trivial |

Otherwise clean. No TODO/FIXME, no `console.log`/`debugger`, no commented-out blocks, no version-suffixed files (grepped across all six changed sources). The new code reuses established seams rather than inventing parallel ones: `setNested` mirrors the existing prune discipline, `shapeChoices` follows the same union rule as `imageChoices` and REQ-135's `weightChoices`, and the percentage-projection pattern is REQ-135's. The renderer's **fixed** filter emission order (render.ts:491-509) remains the right call — taking order from object key order would let identical axes paint two ways.

The fix's own comments are load-bearing and accurate: the `applyFraming` gate is explicitly marked THE ONLY CHANGE GATE, which is what stops the two-comparison shape that caused C1 from growing back.

**Supersession of the five `['src','alt']` suites remains legitimate** — re-checked after the fix. Each assertion was restated as its actual subject (ordering, `not.toContain`, empty-vs-not, `toMatchObject`, "more than one field → none opened") rather than deleted, each carries a comment naming why the old form was incidental, and no AC was weakened. Confirmed live: `copy get` returns `src` then `alt` first, in that order.

**Evidence validity: sound.** The REQ-136 UATs drive the real `1c` argv entry point, the real renderer and the real validator against a real scaffolded site in a temp dir — no internal mocking. The two regression tests the fix added went into the **AC-named** suites (`reconciliation-copy-edit-image-framing` → AC-1122, `reconciliation-l1-fold-framing-and-adjustment` → AC-1134) rather than the FC file reconcile is retiring, which is the right call and keeps the evidence attached to the ACs that own the claims. The `A_FOLDED` fixture carries exactly the precision the fold emits (2dp position, 4dp adjustment, half-degree rotation), so the echo assertion is a real test rather than a tautology — the gap the prior review named is closed.

## Checklist Compliance

No `architecture_checklist`, `security_checklist` or `design_checklist` report exists in the ticket store (all three queries return 0). Sections omitted per the review contract.

## Issues Found

**Critical (must fix)**: none.

**Warnings (should fix — none blocking)**:

- **W1 — the lint gate is vacuous, project-wide.** `.xgd/quality.yaml` declares `lint.tools: [eslint]`, but no eslint binary is installed (`node_modules/.bin/eslint` absent) and no `eslint.config.*` / `.eslintrc*` exists anywhere in the repo. Every quality report records `lint: {status: success, errors: 0, warnings: 0}` — a success that means nothing ran. Pre-existing and not introduced by REQ-136, but "lint clean" is unevidenced for the whole project. **Deserves its own ticket.**
- **W2 — no coverage measured on this reconcile.** The recent quality reports are all `Scoped quality: pass (0 tests, 0 failed)` with `suites: {}` (report-befee500 and its predecessors). The scoped selection resolves empty; the real test evidence in this review is the direct `vitest run` recorded above. Pre-existing.
- **W3 — blob determinism rests on `Math.sin`** (render.ts:459-462), which ECMAScript does not specify bit-exactly. Determinism holds within one engine, which is what the round-trip gate needs and what the AC-4 seed test proves; across engine versions the outline could drift. Worth a comment naming the assumption, since DOC-23 §7 round-trip identity is the stated justification for the seed.
- **W5 — `clearKey`'s doc-comment describes behaviour it does not implement** (edit.ts:940-953); the pruning lives in `setNested` (edit.ts:956+). Move the rationale.
- **N1 (new, minor) — the shape control cannot vary a blob.** Picking `blob` writes a bare `{shape:'blob'}`, and `roughness`/`seed` are not among the 13 offered controls, so every operator-picked blob is the same outline (seed 0, roughness 0.5). The AI can address both axes directly and the renderer defaults are sensible, so this is a control-surface limitation rather than a defect — but it means "random splat" is currently one specific splat.

W1 and W2 are repo-level gaps this ticket cannot close. W3, W5 and N1 are small and local. None of them gate.
