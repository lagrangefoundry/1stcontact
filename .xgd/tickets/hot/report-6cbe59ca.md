---
uid: report-6cbe59ca
id: REPORT-1491
type: report
title: 'Reconciliation Review: commits (BUNDLE-14)'
created_by: xgd
created_at: '2026-08-06T21:54:19.435930+00:00'
updated_at: '2026-08-06T21:54:19.435930+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: reconciliation_review
  subject_uid: bundle-0385746c
  anchor_uid: bundle-0385746c
---

# Reconciliation Review: Story Coverage

**Result**: FAIL
**Mode**: commits
**Surface**: (n/a — commits mode)
**Anchor**: bundle-0385746c (BUNDLE-14 = BUG-31 + REQ-114 + REQ-116)
**Stories Reviewed**: 6

The failure is **not** intent fidelity or story coverage — both are strong, and on
Steps 4 and 6 alone this review would pass. The failure is **Step 5b, evidence
sufficiency**: nine UATs are red on this reconcile branch, four of them on stories
inside this review's scope, and every root cause traces to this bundle's own code.
One of the nine is a genuine unreconciled contradiction *inside* the matrix.

## Intent Fidelity (Step 4A)

Assessed against the bundle body and its three source tickets. All three intents
are represented faithfully, and — notably — the stories flag their divergences
rather than absorbing them:

| Intent | Declared behaviour | Story | Fidelity |
|---|---|---|---|
| BUG-31 | option (b): namespace, do not refuse | STORY-94 Technical Context records the choice **and** the withdrawn alternative | Faithful |
| BUG-31 | sandbox is never publicly servable | STORY-95 states it as confinement "never derived from a request", not as a rejection check | Faithful |
| BUG-31 | conditional-write narrowing | STORY-94 carries an explicit "Known divergence from intent (flag for regression)" | Faithful — divergence declared, not absorbed |
| REQ-114 | palette model, literal base + overlay | STORY-80, incl. the withdrawal of the "overlay parked in L2" position | Faithful |
| REQ-114 | AC6 "all four sites retrofitted" | STORY-5e7eb0c5 records two sites census at zero literals and are vacuously retrofitted | Faithful — noted as intent/observation, not silently restated |
| REQ-114 | AC7 "reproduce the DOC-23 §5.3 table" | Story records the counts moved 17/15 → 18/16 and that the durable property is the method | Faithful — divergence declared |
| REQ-114 | complete retirement, no stubs | STORY-83 states it as a negative guarantee with the reasoning for why it is an AC | Faithful |
| REQ-116 | 9 ACs, renderer-side only | STORY-af36c2cb, 1:1 onto AC-948..958 | Faithful |
| REQ-116 | commit-sweep provenance | Recorded in the story's Technical Context | Faithful |

**One intent criterion is unmet as a matter of fact**: REQ-114's own AC12 — "Full
suite green, and a clean `pnpm -r build` typechecks". Typecheck is clean
(`tsc --noEmit` exit 0 for both `tools/generate` and `apps/public-site`); the
suite is **not** green (below).

## Coverage Map (Step 4B)

| # | Behavior | Coverage | Story | Notes |
|---|---|---|---|---|
| 1 | Deploy keys scoped to store root | Covered | story-5349d01f | AC-924 |
| 2 | Non-servable root reports no URL + reason | Covered | story-5349d01f | AC-925 |
| 3 | Per-root deploy index | Covered | story-5349d01f | AC-926 |
| 4 | Prune scoped to root | Covered | story-5349d01f | AC-899 (modified) |
| 5 | SERVABLE_ROOT never derived from a request | Covered | story-d34eccd8 | AC-927 |
| 6 | Index authority gated by root first | Covered | story-d34eccd8 | AC-905 (modified) — **evidence red** |
| 7 | Palette shape; every colour axis takes hex or ref | Covered | story-c490f1cf | AC-928 |
| 8 | Dangling ref = validation failure, loud resolve | Covered | story-c490f1cf | AC-929 |
| 9 | Alpha rides on the reference | Covered | story-c490f1cf | AC-930 |
| 10 | Resolution once at the load boundary | Covered | story-c490f1cf | AC-931 — see Finding C |
| 11 | Retrofit shrinks palette, loses no colour | Covered | story-c490f1cf | AC-932 |
| 12 | No `--color-*` emitted or referenced | Covered | story-d0a8cfad | AC-933 |
| 13 | Page bg + text colour as L1 document fields | Covered | story-d0a8cfad | AC-934 |
| 14 | No closed colour-role vocabulary survives | Covered | story-d0a8cfad | AC-935 |
| 15 | Non-colour token groups intact | Covered | story-d0a8cfad | AC-936 |
| 16 | `1c colors` census (+ `--json`) | Covered | story-5e7eb0c5 | AC-939, AC-940 |
| 17 | `--assign` retrofit, two passes, `--names` | Covered | story-5e7eb0c5 | AC-941..943, AC-946 |
| 18 | Lossless-or-nothing write gate | Covered | story-5e7eb0c5 | AC-944, AC-945 |
| 19 | Re-runnable, fold unchanged | Covered | story-5e7eb0c5 | AC-947 |
| 20 | Edit channel: own location, from draft, no history | Covered | story-af36c2cb | AC-958 |
| 21 | Deliberately inert page | Covered | story-af36c2cb | AC-948 |
| 22 | Settled state (reveal, carousel) | Covered | story-af36c2cb | AC-949, AC-950 — see Finding D |
| 23 | Derived segmentation | Covered | story-af36c2cb | AC-951 |
| 24 | Render-scoped addresses, slot-rooted | Covered | story-af36c2cb | AC-953..955 |
| 25 | Renderer-drawn outlines, no geometry shift | Covered | story-af36c2cb | AC-952 |
| 26 | No leakage; L1 `id` untouched | Covered | story-af36c2cb | AC-956, AC-957 |
| 27 | Scaffolder's colour source after the palette cut | **Uncovered** | — | Finding B — the behaviour changed and no story records it |
| 28 | `renderL1Document` precondition after the retrofit | **Uncovered** | — | Finding C — a documented seam gained an undeclared requirement |
| 29 | A behavior module may ship edit-channel CSS | **Contradicted** | story-af36c2cb vs story-179b8c06 | Finding D — the matrix now holds both AC-950 and AC-809 |

No ungrounded stories were found — every story claim is supported by the intent,
the code, or both. (Table omitted.)

## Evidence Sufficiency (Step 5b) — the reason for FAIL

Full suite on this reconcile branch: **9 failed | 1131 passed | 9 skipped (1149)**,
5 failed files. Reproduced across three runs. Four root causes, all this bundle's.

### Finding A — `manifestKey` arity: 5 red UATs (BUG-31, plan items 1–2)

`manifestKey` became `manifestKey(root, slug)` (`tools/generate/src/deploy/manifest.ts:48`).
Two pre-existing reconciliation test files still call it with one argument, so `root`
takes the slug and `slug` is `undefined`; the helper addresses `acme/undefined/manifest.json`
while the real `cmdDeploy` writes `sites/acme/manifest.json`.

- **story-d34eccd8 (STORY-95) — IN SCOPE.** `tests/reconciliation-serve-deployed-snapshot.test.ts:252, 258, 452`
  - AC-903 `test_UAT_AC903_published_url_serves_and_follows_the_live_revision` — `Error: no deploy index in shared storage`
  - AC-905 `test_UAT_AC905_only_indexed_snapshots_are_servable` — same
  - AC-913 `test_UAT_AC913_apex_returns_a_holding_response_and_never_serves_a_site` — same
  - **AC-905 is one of the two ACs plan item 2 explicitly modified.** The bundle rewrote the criterion and left its only covering evidence red.
- **story-66115f6b (STORY-92) — collateral.** `tests/reconciliation-clean-page-urls.test.ts:293`
  - AC-916, AC-920 — `TypeError: Cannot read properties of null (reading 'live')`

Note this is invisible to `tsc`: `tests/` is outside both package tsconfigs, so an
arity error in a test survives a clean typecheck.

### Finding B — the scaffolder's colour source: 2 red UATs (REQ-114, plan item 4)

- **story-86c7c21b (STORY-93) — collateral, and a real intent conflict.**
  `tests/reconciliation-scaffold-starter-l1.test.ts:162, 221`
  - AC-870 `test_UAT_AC870_fresh_site_renders_placeholder_centred_on_theme_background`
  - AC-873 `test_UAT_AC873_document_and_placeholder_colours_come_from_the_site_theme`
  - Both: `TypeError: Cannot read properties of undefined (reading 'bg')` reading `site.theme.palette.bg`.

This is not a stale assertion to be patched. AC-873 is titled *"the starting colours
come from the theme"*; AC-935, **added by this bundle**, asserts no site definition
declares a theme palette. A newly created site's colours now come from somewhere
else, and no story in the matrix says where. Plan item 4 scoped its footprint to
`storage/sites/*/draft/site.json` — the four existing definitions — and missed the
code that mints new ones.

### Finding C — the retrofit gave `renderL1Document` an undeclared precondition: 1 red UAT

- **story-d0a8cfad (STORY-83) — IN SCOPE.** (Its `uat_coverage` field already reads `fail`.)
  `tests/reconciliation-l1-control-and-texture.test.ts:573`
  - AC-831 `test_UAT_AC831_five_axes_paint_as_ordered_layers_and_untextured_pages_are_byte_identical`
  - `Error: L1 palette reference 'sand' does not resolve: no palette is declared.`

The test walks every `storage/sites/*/draft/pages/*.json` and calls
`renderL1Document(page.l1)` directly. After the retrofit, xgd's pages carry
`{ ref: 'sand' }`, and that entry point throws without the site palette.

AC-931 says resolution happens once at the load boundary so "everything downstream
reads exactly the document it would have read had the colours been authored as
literals". True for consumers that enter through `loadSite` — but `renderL1Document`
is a seam a shipped criterion uses directly, and it has silently gained a
requirement. Either the palette must reach that entry point, or AC-831's evidence
must change and AC-931 must state the precondition. As it stands one of STORY-83's
own criteria is red and the matrix is silent about the new requirement.

### Finding D — the matrix now asserts both sides of a contradiction: 1 red UAT

- **story-179b8c06 (STORY-85) — collateral, and the one genuine absorbed divergence.**
  `tests/reconciliation-behavior-l1-composition.test.ts:266`
  - AC-809 `test_UAT_AC809_modules_ship_no_css_beyond_declared_invariant_elements`
  - `AssertionError: carousel selector [data-fc-edit] .carousel__track is mechanics or the current-slide signal: expected false to be true`

REQ-116 made each behavior module declare its own behaviour-off state, which for
the carousel means shipping a `[data-fc-edit] .carousel__track` rule. story-af36c2cb
**anticipated this**, in its Technical Context: *"the behavior-module obligation is
asserted here … does extend the behavior-module contract, which another story owns …
Flagged so a reviewer can move it if they disagree."*

As reviewer: flagging is necessary but not sufficient here, because the consequence
is a red criterion on the story that was not moved. The matrix now holds **AC-950**
("a carousel declares its own behaviour-off state", passing) and **AC-809** ("a module
ships no CSS beyond its declared invariant elements", failing) simultaneously. One of
them must give:

- *Preferred* — upgrade STORY-85 so the contract admits an edit-channel settled-state
  carve-out alongside the existing invariant-element carve-out (this is a real,
  intended extension of the module contract and deserves to be stated there), or
- narrow AC-809's scope to the served channels, so the zero-CSS guarantee is asserted
  where it is actually load-bearing.

Either is defensible. Leaving both criteria standing is not.

### Evidence *quality* — no defects found

Spot-checked the new UATs against the Step 5b traps. They are good:

- **Real entry points.** AC-924 drives the real `cmdDeploy` and asserts observable
  storage state, using distinguishable page content so namespacing is proven rather
  than assumed (`expect(html).toContain('SCRATCH-CONTENT')` /
  `.not.toContain('REAL-SITE-CONTENT')`). AC-927 drives the Worker's real `fetch`.
  The edit-render UATs assert on bytes written to disk by `1c render --edit`.
- **Not source inspection.** AC-935 reads like it might be — "inspect the published
  schema surface" — but the two `toBeUndefined()` export checks are scaffolding; the
  behavioural weight is carried by a real `themeTokensSchema.parse` proving the key
  is discarded, and by two real `validateSite` calls proving a layer colour role is
  rejected as an *unknown key* rather than ignored. Sound.
- **No internal mocking.** R2 is faked at the client/binding boundary only — an
  external system boundary, which the thin-mock rule permits.

The problem is not that the new evidence is weak. It is that the code the new
evidence proves broke nine criteria elsewhere, and the reconciliation shipped
without noticing.

## Plan Item Accounting (Step 6)

| Plan Item | Expected Story | Status |
|---|---|---|
| 1. Deploy: store-root isolation | story-5349d01f (upgrade) | ✓ AC-924/925/926 added; AC-892/899/900 modified |
| 2. Public serving: one servable root | story-d34eccd8 (upgrade) | ✓ AC-927 added; AC-905 modified |
| 3. L1 colour model: literal base, palette overlay | story-c490f1cf (upgrade) | ✓ AC-928..932 added; AC-716 modified |
| 4. One colour system; page colour re-homed | story-d0a8cfad (upgrade) | ✓ AC-933..936 added |
| 5. `1c colors` census + retrofit | story-5e7eb0c5 (feature) | ✓ new story, AC-939..947 |
| 6. The edit render | story-af36c2cb (feature) | ✓ new story, AC-948..958 |

**All six plan items produced output. No plan item was dropped.**

## Judgment Calls

- **Findings A–D are material, not trivial.** Each is a *currently failing* criterion
  on a *shipped* capability, caused by *this bundle's* code. None is an impossible
  input or a debug path. A developer reading the matrix would believe AC-905, AC-831,
  AC-809, AC-870 and AC-873 hold; none does.
- **Collateral breakage is in scope for this review even though three of the stories
  are not.** The reconciliation's job is to leave the matrix true. A bundle that
  reconciles six stories correctly while silently reddening four criteria on three
  others has not done that. The fix loop must repair all nine.
- **Finding D is weighted heaviest** despite being one test. A and B are repairs;
  D is the matrix asserting a proposition and its negation. story-af36c2cb explicitly
  invited a reviewer to rule on it, and this is the ruling.
- **AC-845 (`reconciliation-l1-navigation`) is flagged, not gated.** It failed in one
  full-suite run and passed both in isolation and in a second full run — order-dependent
  or intermittent. Worth a look during the fix loop; not a blocking finding.
- **FC-orphan test duplication is noted, not gated.** `tests/req116-edit-render.test.ts`
  (7 × `test_UAT_FC_REQ-116_*`) and `tests/bug31-sandbox-r2-namespace.test.ts`
  (5 × `test_UAT_FC_BUG-31_*`) duplicate the reconciliation UATs; REPORT-1485 handed
  the cleanup to this step. Naming and dedup belong to structural validation, so it is
  recorded here rather than made a gate.
- **Tooling observation for the operator.** Every scoped quality report on these six
  stories reads `pass (0 tests, 0 failed)` with `"suites": {}` (e.g. report-3d2097c6,
  report-b743f6f2). The scoped gate executed **no tests at all**, which is why nine
  red UATs reached this review unremarked. That is a gap in the gate, not in the
  stories — but it is the reason this bundle got this far.

## Verdict

**FAIL.** Story coverage and intent fidelity are strong — all six plan items landed,
every new criterion is faithful to its ticket, and the stories record their
divergences (the conditional-write narrowing, the vacuous two-site retrofit, the
census count drift, the commit-sweep provenance) rather than absorbing them. On
Steps 4 and 6 this would pass.

It fails Step 5b. Nine UATs are red, four of them on stories under review:

1. **story-d34eccd8** — AC-903, AC-905, AC-913 red. Fix `manifestKey(SLUG)` →
   `manifestKey(root, SLUG)` at `tests/reconciliation-serve-deployed-snapshot.test.ts:252, 258, 452`.
   AC-905 was modified by this bundle and its only evidence does not run.
2. **story-66115f6b** — AC-916, AC-920 red. Same fix at
   `tests/reconciliation-clean-page-urls.test.ts:293`.
3. **story-86c7c21b** — AC-870, AC-873 red. The scaffolder no longer writes
   `theme.palette`, so "the starting colours come from the theme" is no longer true.
   Requires an upgrade item recording where a new site's colours now come from — not
   just a test edit.
4. **story-d0a8cfad** — AC-831 red. `renderL1Document` throws on shipped pages
   carrying palette references. Either thread the palette to that seam or state the
   precondition on AC-931 and re-evidence AC-831.
5. **story-179b8c06** — AC-809 red, and contradicted by AC-950. Resolve by upgrading
   STORY-85's contract to admit the edit-channel settled-state carve-out (preferred),
   or by narrowing AC-809 to the served channels.

Also unmet: REQ-114's own acceptance criterion 12, "Full suite green". Typecheck is
clean; the suite is not.
