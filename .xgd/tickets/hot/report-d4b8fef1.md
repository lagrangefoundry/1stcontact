---
uid: report-d4b8fef1
id: REPORT-2157
type: report
title: 'Reconciliation Review: commits (BUNDLE-18)'
created_by: xgd
created_at: '2026-08-16T23:03:16.048290+00:00'
updated_at: '2026-08-16T23:03:16.048290+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: reconciliation_review
  subject_uid: bundle-d9226698
  anchor_uid: bundle-d9226698
---

# Reconciliation Review: Story Coverage

**Result**: PASS
**Mode**: commits
**Surface**: —
**Anchor**: bundle-d9226698 (BUNDLE-18 = BUG-34 + REQ-137)
**Stories Reviewed**: 3 (story-3bf94bd4, story-c490f1cf, story-5e7eb0c5)

This is the **second pass** on this bundle. The first review (`report-69863744`)
found the stories faithful and complete and failed on exactly one mechanical
defect: `acceptance_criterion-66e919f9` (AC-945) had been rewritten to claim the
abort diagnostic states the numeric bound on standard error, which the code does
not do, and its UAT failed on that clause. The fix loop (`report-cf0f2b96`)
applied the prescribed remediation. **That defect is resolved, nothing was
traded away to resolve it, and no new defect was introduced.** PASS.

---

## Verification of the prior FAIL

| Prescribed remediation | Landed? | Evidence |
|---|---|---|
| Narrow AC-945's second bullet to what the diagnostic actually emits | ✓ | Bullet now reads “…identifies which of those causes applies, naming the colours that failed to reproduce or the validation problems found”. The clause *“and stating the bound a shaded reference had to meet”* is gone. Verification section speaks only of “the corresponding diagnostic”. |
| Delete the failing `expect(collide.stderr).toContain(\`${SHADE_FIT_TOLERANCE}/255\`)` | ✓ | `git show cc46086b2` — one assertion removed at `tests/reconciliation-colour-retrofit-shade-model.test.ts:790`; the comment above it now records *why* (the bound rides the `CommandError.hint`, which the `1c` launcher drops) instead of documenting a known gap. |
| Keep `/exceeds the shade bound/i` and `/#[0-9a-f]{6}/` | ✓ | Both present and unmodified — cause-identification and colour-naming are still proven. |
| **Do NOT** change `colors.ts` to print the hint | ✓ | The fix commit touches **one file, the test**. `grep SHADE_FIT_TOLERANCE tools/generate/src/cli/colors.ts` still shows the `hint` at :674 and the success-path drift report at :720, both untouched. No runtime behaviour changed; the reconciliation stayed a documentation exercise. |

The narrowed AC-945 is now **accurate against the code**. `cmdColorsAssign`
(`tools/generate/src/cli/colors.ts:667-678`) throws a `CommandError` whose
`message` names the cause (`Palette assignment for '<slug>' exceeds the shade
bound — N colour(s) do not round-trip: #…`) and whose `hint` carries the number;
only the message reaches stderr. The AC now claims exactly the former.

Its remaining delta against `main` is not merely a rollback but a **required**
edit: the old text guaranteed a derived reference “would reproduce the *exact*
literal it replaces”, which REQ-137 §3's operator-approved supersession makes
false. It now states the bounded form (byte-exact where the reference carries no
shade, byte-exact for opacity always). Consistent with AC-944 and AC-932.

---

## Behavior Inventory

19 behaviours across 4 features, re-read from the code on this branch. The
inventory is unchanged from the first pass and is not restated in full here; the
four whose implementation I re-read directly this pass are noted in the coverage
map below.

## Coverage Map

| # | Behavior | Coverage | Story | Notes |
|---|----------|----------|-------|-------|
| 1 | `readGlyphFill` carries a run's own `background-image` + clip + fill colour when `background-clip: text` | Covered | story-3bf94bd4 | AC-1143. Re-read `page-style.js:221-238`: reads both the standard and `-webkit-` clip, bails unless `text` **and** an image is present, absolutises the URL against the render's own document. |
| 2 | The glyph paint lands on `.fields-control`, not `.builder-modal__box` | Covered | story-3bf94bd4 | AC-1143. Re-read `builder.css:298-301` — on the control, as the story states, because `background-image` does not inherit. |
| 3 | Each declaration falls back to the property's initial value, so an ordinary run is unaffected | Covered | story-3bf94bd4 | `none` / `border-box` / `currentColor`. Inertness by consumption, not a per-run check. |
| 4 | A fully transparent computed `color` is withheld from `--preview-color` | Covered | story-3bf94bd4 | AC-1040. Re-read `page-style.js:268` — `if (!isTransparent(cs.color)) put(...)`, so `--fields-fg` (`builder.css:252`) falls back to `--shell-fg`. |
| 5 | The backdrop stack still begins one element past the run | Covered | story-3bf94bd4 | AC-1040 states this explicitly, so the run's own background is correctly outside it. |
| 6–14 | L1 palette model — single-colour entry with `steps` deleted and `.strict()` rejection; continuous Oklab `shade` on [-1,+1]; zero/absent short-circuit; out-of-range as a validation failure; shade×alpha independence; chroma-only-decreases; per-entry tally; resolution at the load boundary leaving no reference; dangling-reference failure with the missing-step case dropped | Covered | story-c490f1cf | AC-928, AC-929, AC-930, AC-931, AC-1144, AC-1145 |
| 15–19 | Derivation & retrofit — entries + shades and never a step; base-by-reach with usage as tiebreak; round-based grouping; family-change refusal; unreachable member as its own byte-exact entry; fit searched over the model's own `shadeHex`; write gate (unshaded exact, shaded ≤ 8/255) with drift reported; fixpoint on re-run | Covered | story-5e7eb0c5 | AC-943, AC-944, AC-932, AC-946, AC-947, AC-1146, AC-1147 |

No behaviour observed in the code is uncovered, and **no ungrounded claim
remains** — the single entry in the first pass's Ungrounded Claims table
(AC-945) has been corrected. The table is omitted for that reason.

## Intent Fidelity

Both intents remain faithfully recorded, including the two places where
implementation diverged from a stated default **and said so** rather than
absorbing it silently:

- Base selection moved from “the most-used colour” to “the member that reaches
  the most others”, with usage as tiebreak — recorded in STORY-97's In-scope
  text with its reason (a mix only removes chroma, so reach runs one way).
- The family-change refusal, added to make the retrofit a fixpoint — AC-943 and
  AC-947.
- REQ-114 AC3's pixel-identity guarantee is superseded, not lost: AC-944 and
  AC-932 carry the measured replacement with its provenance, matching the
  operator's explicit approval of option (a) at tolerance 8.

## Step 5b — Evidence Sufficiency

The workflow's own scoped quality report (`report-388220a3`) again records
`"suites": {}` — **zero tests** — so it is not evidence of anything. All suites
were executed directly on this branch:

| Suites | Result |
|---|---|
| `reconciliation-colour-retrofit-shade-model`, `reconciliation-colour-shade-axis`, `reconciliation-copy-edit-glyph-paint` | **15 passed, 0 failed** (3 files) |
| `reconciliation-colour-census-and-retrofit`, `reconciliation-colour-palette-overlay`, `req114-palette-model`, `test_UAT_FC_REQ-137_palette_shade`, `reconciliation-copy-edit-form-presentation`, `test_UAT_FC_BUG-34_glyph_fill_preview`, `req121-copy-modal-elegance` | **72 passed, 0 failed** (7 files) |
| **Total** | **87 passed, 0 failed** |

The previously failing `test_UAT_AC945_unprovable_retrofit_exits_nonzero_diagnoses_and_writes_nothing` now passes. `test_UAT_AC1143_*` **ran** rather than skipping (the `WEBUI_INSTALLED` gate is satisfied here), so AC-1143 is genuinely proven in this environment.

Every active AC on the three stories has a covering UAT (`test_UAT_AC1143`, `AC1144`, `AC1145`, `AC1146`, `AC1147`, and the modified `AC928/929/930/931/932/941/943/944/945/946/947/1040` sets). Quality checks:

- **No internal mocking.** No `vi.mock` / `vi.fn` / stubs in any of the three new suites.
- **Real entry points throughout**: the shipped `cli([...])` launcher, `cmdColorsAssign`, `resolveL1Color` / `validateSite`, and for AC-1143 the real `1c render --edit` bytes → real edit bridge → modal opened by *clicking the words*.
- **AC-945 is still sufficient after the deletion.** The removed assertion covered a clause the AC no longer makes. What remains proves every claim the AC does make, across all three abort causes: non-zero exit; a cause-distinguishing diagnostic on stderr (`/no draft/i`, `/exceeds the shade bound/i` + a named colour, and the contract-validation message); and `hashTree` equality before/after, which also proves the no-partial-write clause. A broken implementation that wrote a page and then aborted, or that aborted with a generic message, would fail this UAT.
- **AC-1147 is not a “which function is called” bookkeeping test** despite its subject. It asserts an observable equality — every reported drift entry re-resolves through `resolveL1Color`/`shadeHex` to the exact reported hex and delta, across two sites and every shaded reference — so a second, divergent copy of the arithmetic breaks it.
- **One partial source assertion, acceptably scoped.** AC-1143's last hop (the custom properties reaching the control) is asserted against `builder.css` text because jsdom does not resolve `var()` in `getComputedStyle`. This is not name-checking: the stylesheet **is** the runtime artifact for that hop, the assertions pin the exact declarations *and* that each fallback is the property's initial value, *and* that the box rule carries none of them. Every read feeding those properties is asserted against real computed values off the rendered page. The limitation is declared in the suite header and in STORY-101.

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. Copy modal preview — glyph paint (BUG-34) | story-3bf94bd4 | ✓ AC-1143 added; AC-1040 modified |
| 2. L1 palette model — shade on the reference (REQ-137) | story-c490f1cf | ✓ AC-1144, AC-1145 added; AC-928, AC-929, AC-930, AC-931 modified |
| 3. Palette derivation & retrofit — entries + shades (REQ-137) | story-5e7eb0c5 | ✓ AC-1146, AC-1147 added; AC-943, AC-944, AC-932, AC-947, AC-946 modified |

No plan item was dropped. All 17 AC files changed on this branch correspond to the plan's add/modify lists, with two exceptions — AC-945 and AC-941 — both discussed under Judgment Calls.

## Judgment Calls

- **AC-945 and AC-941 were modified outside the plan; both are now accepted.** Neither appears in item 3's `acceptance_criteria_changes`, which is how the first pass's defect entered. But both were *forced* by the model change rather than invented: AC-945 guaranteed reproduction of “the exact literal” and AC-941 reported “each entry… with how many **steps** it carries” — wording the deleted `steps` field makes impossible to satisfy. Leaving them unedited would have been the worse failure (two ACs describing a model the code no longer has). Both now match the code and both have passing UATs. The lesson is for plan authorship, not a verdict against this matrix.
- **The 71 pre-existing AI tool-surface failures remain correctly uncovered.** They reproduce on a clean `xgd-working`, sit in suites this bundle does not touch, and the plan deliberately gave them no item. A downstream full-suite run should treat them as pre-existing, not as a regression from this reconciliation.
- **Non-material, carried forward from the first pass:** `test_UAT_AC944_render_is_byte_identical_before_and_after_the_retrofit` in `reconciliation-colour-census-and-retrofit.test.ts` still carries the stale comment “Pixel-identity is a property, not a tolerance” against the now-superseded guarantee. Its assertion remains true and it passes (every reference on that fixture is unshaded, where byte-exactness is what AC-944 still promises). Likewise `test_UAT_AC941_*` and `test_UAT_AC945_*` each exist in two files. Test-name uniqueness and comment hygiene are structural validation's remit. Worth tidying; not worth a FAIL.

## Verdict

**PASS.** Stories accurately and completely document the behaviour surface, and
remain faithful to both intents including the operator's recorded decisions (the
tolerance-8 split, the continuous shade axis, the REQ-114 AC3 supersession) and
the two flagged implementation divergences. Every plan item produced output. The
sole defect from the first pass is fixed exactly as prescribed — the AC narrowed
to the code's real behaviour, the one over-reaching assertion removed, and
`colors.ts` deliberately left alone so no runtime behaviour changed outside
REQ-137 §4's declared footprint. All 87 tests across the ten affected suites
pass, and every active AC is backed by evidence a broken implementation could
not satisfy.
